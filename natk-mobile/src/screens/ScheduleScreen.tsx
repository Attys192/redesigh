import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { ISchedule, GroupedLesson } from '../types';
import { getGroups, getSchedule } from '../api/client';
import { COLORS, TAB_BAR_HEIGHT } from '../utils/constants';

export default function ScheduleScreen() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadSchedule(selectedGroup);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const data = await getGroups();
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async (groupName: string) => {
    try {
      const data = await getSchedule(groupName);
      setSchedule(data);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedGroup) {
      await loadSchedule(selectedGroup);
    }
    setRefreshing(false);
  }, [selectedGroup]);

  // Группировка пар (аналогично веб-версии)
  const groupLessons = (lessons: ISchedule[]): GroupedLesson[] => {
    const map = new Map<string, GroupedLesson>();

    for (const lesson of lessons) {
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
        const existing = entry.subgroups[subgroupNum];
        
        if (existing && 
            existing.subject === lesson.subject.name &&
            existing.teacher === lesson.teacher?.fullName &&
            existing.room === lesson.room?.name) {
          continue;
        }
        
        entry.subgroups[subgroupNum] = {
          subject: lesson.subject.name,
          teacher: lesson.teacher?.fullName,
          room: lesson.room?.name,
        };
      } else {
        if (entry.wholeGroup && 
            entry.wholeGroup.subject === lesson.subject.name &&
            entry.wholeGroup.teacher === lesson.teacher?.fullName &&
            entry.wholeGroup.room === lesson.room?.name) {
          continue;
        }
        
        entry.wholeGroup = {
          subject: lesson.subject.name,
          teacher: lesson.teacher?.fullName,
          room: lesson.room?.name,
        };
      }
    }

    const result: GroupedLesson[] = [];
    for (const entry of map.values()) {
      if (entry.subgroups && entry.subgroups[1] && entry.subgroups[2]) {
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

    return result.sort((a, b) => a.lessonNumber - b.lessonNumber);
  };

  // Группировка по дням
  const groupedByDay = (): { day: string; lessons: GroupedLesson[] }[] => {
    const days: { [key: string]: GroupedLesson[] } = {};
    
    for (const item of schedule) {
      const day = item.dayOfWeek;
      if (!days[day]) {
        days[day] = [];
      }
    }
    
    for (const day of Object.keys(days)) {
      const dayLessons = schedule.filter(s => s.dayOfWeek === day);
      days[day] = groupLessons(dayLessons);
    }
    
    const daysOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return daysOrder
      .filter(day => days[day] && days[day].length > 0)
      .map(day => ({ day, lessons: days[day] }));
  };

  const renderLessonCard = (lesson: GroupedLesson) => {
    if (lesson.subgroups) {
      // Карточка с подгруппами
      return (
        <View key={`${lesson.lessonNumber}-${lesson.dayOfWeek}`} style={styles.subgroupCard}>
          <View style={styles.lessonNumberBadge}>
            <Text style={styles.lessonNumberText}>{lesson.lessonNumber}</Text>
            <Text style={styles.lessonTimeText}>{lesson.startTime || '--:--'}</Text>
          </View>
          
          <View style={styles.subgroupsContainer}>
            {/* 1 подгруппа */}
            <View style={[styles.subgroupHalf, lesson.subgroups[2] && styles.subgroupHalfWithBorder]}>
              <View style={styles.subgroupBadge}>
                <Text style={styles.subgroupBadgeText}>1 подгруппа</Text>
              </View>
              {lesson.subgroups[1] ? (
                <>
                  <Text style={styles.subjectText} numberOfLines={2}>
                    {lesson.subgroups[1].subject}
                  </Text>
                  {lesson.subgroups[1].teacher && (
                    <Text style={styles.detailText}>Преподаватель: {lesson.subgroups[1].teacher}</Text>
                  )}
                  {lesson.subgroups[1].room && (
                    <Text style={styles.detailText}>Аудитория: {lesson.subgroups[1].room}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.windowText}>— Окно —</Text>
              )}
            </View>
            
            {/* 2 подгруппа */}
            {lesson.subgroups[2] && (
              <View style={styles.subgroupHalf}>
                <View style={[styles.subgroupBadge, styles.subgroupBadge2]}>
                  <Text style={styles.subgroupBadgeText}>2 подгруппа</Text>
                </View>
                {lesson.subgroups[2] ? (
                  <>
                    <Text style={styles.subjectText} numberOfLines={2}>
                      {lesson.subgroups[2].subject}
                    </Text>
                    {lesson.subgroups[2].teacher && (
                      <Text style={styles.detailText}>Преподаватель: {lesson.subgroups[2].teacher}</Text>
                    )}
                    {lesson.subgroups[2].room && (
                      <Text style={styles.detailText}>Аудитория: {lesson.subgroups[2].room}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.windowText}>— Окно —</Text>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    // Обычная карточка
    return (
      <View key={`${lesson.lessonNumber}-${lesson.dayOfWeek}`} style={styles.lessonCard}>
        <View style={styles.lessonNumberBadge}>
          <Text style={styles.lessonNumberText}>{lesson.lessonNumber}</Text>
          <Text style={styles.lessonTimeText}>{lesson.startTime || '--:--'}</Text>
        </View>
        
        <View style={styles.lessonContent}>
          <Text style={styles.subjectText} numberOfLines={2}>
            {lesson.wholeGroup?.subject || 'Неизвестный предмет'}
          </Text>
          {lesson.wholeGroup?.teacher && (
            <Text style={styles.detailText}>Преподаватель: {lesson.wholeGroup.teacher}</Text>
          )}
          {lesson.wholeGroup?.room && (
            <Text style={styles.detailText}>Аудитория: {lesson.wholeGroup.room}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderDay = ({ item }: { item: { day: string; lessons: GroupedLesson[] } }) => (
    <View style={styles.dayContainer}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{item.day}</Text>
        <View style={styles.dayDivider} />
        <Text style={styles.dayCount}>{item.lessons.length} пар</Text>
      </View>
      {item.lessons.map(lesson => renderLessonCard(lesson))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Заголовок с выбором группы */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Расписание</Text>
        <Text style={styles.headerSubtitle}>Актуальное расписание занятий</Text>
        <TouchableOpacity
          style={styles.groupSelector}
          onPress={() => setShowGroupPicker(true)}
        >
          <Text style={styles.groupSelectorText}>{selectedGroup || 'Выбрать группу'}</Text>
          <Text style={styles.groupSelectorIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно выбора группы */}
      <Modal
        visible={showGroupPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGroupPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите группу</Text>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={(value) => {
                setSelectedGroup(value);
                setShowGroupPicker(false);
              }}
            >
              {groups.map((group) => (
                <Picker.Item key={group} label={group} value={group} />
              ))}
            </Picker>
          </View>
        </Pressable>
      </Modal>

      {/* Список расписания */}
      <FlatList
        data={groupedByDay()}
        renderItem={renderDay}
        keyExtractor={(item) => item.day}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIconText}>?</Text>
            </View>
            <Text style={styles.emptyText}>Расписание не найдено</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  groupSelectorIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listContent: {
    padding: 16,
    paddingBottom: TAB_BAR_HEIGHT,
  },
  dayContainer: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  dayCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
  lessonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subgroupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonNumberBadge: {
    width: 52,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 12,
    marginRight: 12,
  },
  lessonNumberText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  lessonTimeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },
  lessonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  subgroupsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  subgroupHalf: {
    flex: 1,
  },
  subgroupHalfWithBorder: {
    borderRightWidth: 2,
    borderRightColor: COLORS.border,
    paddingRight: 12,
    marginRight: 12,
  },
  subgroupBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subgroupBadge2: {
    backgroundColor: '#f0fdfa',
  },
  subgroupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.warning,
  },
  windowText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
