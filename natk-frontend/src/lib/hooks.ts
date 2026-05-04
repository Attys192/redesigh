/**
 * Custom React Hooks for Data Fetching
 * Centralizes data fetching logic and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ISchedule, INews, IStaff, ISpecialty, IGroupedLesson } from '@/types';
import { getSchedule, getGroups, getNews, getStaff, getSpecialties } from './api';
import { DAYS_ORDER } from '@/shared/constants';

// ============================================================================
// Generic Fetch Hook
// ============================================================================

interface UseFetchOptions<T> {
  initialData?: T;
  enabled?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { initialData = null, enabled = true } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// Schedule Hook
// ============================================================================

interface UseScheduleResult {
  schedule: ISchedule[];
  groupedSchedule: Record<string, IGroupedLesson[]>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSchedule(groupName: string | null): UseScheduleResult {
  const fetchFn = useCallback(async () => {
    if (!groupName) return [];
    return getSchedule(groupName);
  }, [groupName]);

  const { data, loading, error, refetch } = useFetch(fetchFn, {
    enabled: !!groupName,
  });

  const schedule = data ?? [];

  const groupedSchedule = useMemo(() => {
    return groupLessonsByDay(schedule);
  }, [schedule]);

  return { schedule, groupedSchedule, loading, error, refetch };
}

// ============================================================================
// Groups Hook
// ============================================================================

export function useGroups() {
  return useFetch(getGroups, { initialData: [] });
}

// ============================================================================
// News Hook
// ============================================================================

export function useNews() {
  return useFetch(getNews, { initialData: [] });
}

// ============================================================================
// Staff Hook
// ============================================================================

export function useStaff() {
  return useFetch(getStaff, { initialData: [] });
}

// ============================================================================
// Specialties Hook
// ============================================================================

export function useSpecialties() {
  return useFetch(getSpecialties, { initialData: [] });
}

// ============================================================================
// Utility Functions
// ============================================================================

function groupLessonsByDay(schedule: ISchedule[]): Record<string, IGroupedLesson[]> {
  const map = new Map<string, IGroupedLesson>();

  for (const lesson of schedule) {
    const key = `${lesson.lessonDate}-${lesson.lessonNumber}`;
    
    if (!map.has(key)) {
      map.set(key, {
        lessonNumber: lesson.lessonNumber,
        startTime: lesson.startTime,
        dayOfWeek: lesson.dayOfWeek,
        lessonDate: lesson.lessonDate,
        isSubgroup: lesson.isSubgroup,
      });
    }

    const entry = map.get(key)!;

    if (lesson.isSubgroup && lesson.subgroupNumber) {
      if (!entry.subgroups) {
        entry.subgroups = {};
      }
      const subgroupNum = lesson.subgroupNumber as 1 | 2;
      entry.subgroups[subgroupNum] = {
        subject: lesson.subject.name,
        teacher: lesson.teacher?.fullName,
        room: lesson.room?.name,
      };
    } else {
      entry.wholeGroup = {
        subject: lesson.subject.name,
        teacher: lesson.teacher?.fullName,
        room: lesson.room?.name,
      };
    }
  }

  // Merge identical subgroups
  const result: IGroupedLesson[] = [];
  for (const entry of map.values()) {
    if (entry.subgroups?.[1] && entry.subgroups?.[2]) {
      const sub1 = entry.subgroups[1];
      const sub2 = entry.subgroups[2];
      
      if (sub1.subject === sub2.subject && 
          sub1.teacher === sub2.teacher && 
          sub1.room === sub2.room) {
        entry.wholeGroup = sub1;
        entry.subgroups = undefined;
        entry.isSubgroup = false;
      }
    }
    result.push(entry);
  }

  // Group by day
  const days: Record<string, IGroupedLesson[]> = {};
  for (const day of DAYS_ORDER) {
    const dayLessons = result.filter(l => l.dayOfWeek === day);
    if (dayLessons.length > 0) {
      days[day] = dayLessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
    }
  }

  return days;
}
