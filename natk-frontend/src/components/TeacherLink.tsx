'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { IStaff } from '@/types';

interface TeacherLinkProps {
  teacherName: string;
}

const teacherIdCache = new Map<string, number | null>();
const teacherRequestCache = new Map<string, Promise<number | null>>();

export const TeacherLink: React.FC<TeacherLinkProps> = ({ teacherName }) => {
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3005';

  useEffect(() => {
    if (!teacherName) {
      setLoading(false);
      return;
    }

    const lastName = teacherName.split(' ')[0].trim();
    if (!lastName) {
      setLoading(false);
      return;
    }

    if (teacherIdCache.has(lastName)) {
      setTeacherId(teacherIdCache.get(lastName) ?? null);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const loadTeacherId = async (): Promise<number | null> => {
      const existingRequest = teacherRequestCache.get(lastName);
      if (existingRequest) {
        return existingRequest;
      }

      const request = (async (): Promise<number | null> => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/staff/find?name=${encodeURIComponent(lastName)}`);
          if (!res.ok) {
            return null;
          }

          const contentType = res.headers.get('content-type') ?? '';
          if (!contentType.includes('application/json')) {
            return null;
          }

          const matches: IStaff[] = await res.json();
          return matches && matches.length > 0 ? matches[0].id : null;
        } catch {
          return null;
        }
      })();

      teacherRequestCache.set(lastName, request);
      return request;
    };

    const findTeacher = async () => {
      try {
        const id = await loadTeacherId();
        teacherIdCache.set(lastName, id);
        teacherRequestCache.delete(lastName);

        if (!isCancelled) {
          setTeacherId(id);
        }
      } catch (err) {
        console.error('Ошибка поиска преподавателя:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    findTeacher();
    return () => {
      isCancelled = true;
    };
  }, [teacherName, apiBaseUrl]);

  if (loading || !teacherId) {
    return <span>{teacherName || '---'}</span>;
  }

  return (
    <Link 
      href={`/student/staff/${teacherId}`}
      className="text-blue-600 hover:underline transition-all font-bold"
    >
      {teacherName}
    </Link>
  );
};
