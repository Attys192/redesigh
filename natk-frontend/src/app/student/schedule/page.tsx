'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ISchedule, IGroupedLesson, IGroup } from '@/types';
import { TeacherLink } from '@/components/TeacherLink';
import { getAllGroups, getSchedule } from '@/lib/api';

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-calendar group-hover:scale-110 transition-transform"
      aria-hidden="true"
    >
      <path d="M8 2v4"></path>
      <path d="M16 2v4"></path>
      <rect width="18" height="18" x="3" y="4" rx="2"></rect>
      <path d="M3 10h18"></path>
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 10-10-5L2 10l10 5 10-5Z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
      <path d="M22 10v6"></path>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 2v6h-6"></path>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
      <path d="M3 22v-6h6"></path>
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    </svg>
  );
}

function formatScheduleDateTitle(day: string, lessons: IGroupedLesson[]): string {
  const lessonDate = lessons.find((lesson) => lesson.lessonDate)?.lessonDate;
  if (!lessonDate) return day;

  return `${new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(lessonDate))} - ${day}`;
}

function formatPairsCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} пара`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} пары`;
  }

  return `${count} пар`;
}

function getGroupPrefix(groupName: string): string {
  return groupName.match(/^[^\d.-]+/)?.[0].trim().toUpperCase() ?? groupName.toUpperCase();
}

function compareGroupNames(a: IGroup, b: IGroup): number {
  const prefixCompare = getGroupPrefix(a.name).localeCompare(getGroupPrefix(b.name), 'ru');
  if (prefixCompare !== 0) return prefixCompare;

  return a.name.localeCompare(b.name, 'ru', { numeric: true, sensitivity: 'base' });
}

export default function SchedulePage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [schedule, setSchedule] = useState<ISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);

  // Инициализация при загрузке
  useEffect(() => {
    loadGroups();
    const savedGroup = localStorage.getItem('studentGroup');
    if (savedGroup) {
      setSelectedGroup(savedGroup);
      loadSchedule(savedGroup);
    } else {
      setIsSelecting(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedGroup || groups.length === 0) return;
    const group = groups.find((item) => item.name === selectedGroup);
    if (group?.course?.name) {
      setSelectedCourse(group.course.name);
    }
  }, [groups, selectedGroup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (groupDropdownRef.current && !groupDropdownRef.current.contains(target)) {
        setIsGroupDropdownOpen(false);
      }

      if (searchDropdownRef.current && !searchDropdownRef.current.contains(target)) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Получение списка всех групп
  const loadGroups = async () => {
    try {
      const data = await getAllGroups();
      setGroups(data);
      setErrorMessage(null);
    } catch (err) {
      console.error('Ошибка загрузки групп:', err);
      setErrorMessage('Не удалось загрузить список групп. Проверьте, что бэкенд запущен.');
    }
  };

  // Получение расписания для конкретной группы
  const loadSchedule = async (groupName: string) => {
    setLoading(true);
    try {
      const data = await getSchedule(groupName);
      setSchedule(data);
      setErrorMessage(null);
    } catch (err) {
      console.error('Ошибка загрузки расписания:', err);
      setErrorMessage('Не удалось загрузить расписание. Проверьте, что бэкенд запущен.');
    } finally {
      setLoading(false);
    }
  };

  // Выбор группы
  const handleGroupSelect = (groupName: string) => {
    const group = groups.find((item) => item.name === groupName);
    localStorage.setItem('studentGroup', groupName);
    setSelectedGroup(groupName);
    setSelectedCourse(group?.course?.name ?? '');
    setSearchQuery(groupName);
    setIsGroupDropdownOpen(false);
    setIsSearchDropdownOpen(false);
    setIsSelecting(false);
    loadSchedule(groupName);
  };

  // Смена группы
  const handleChangeGroup = () => {
    setIsSelecting(true);
    setSearchQuery('');
    setIsGroupDropdownOpen(false);
    setIsSearchDropdownOpen(false);
    if (groups.length === 0) {
      loadGroups();
    }
  };

  // Функция группировки пар (убирает дубли, объединяет подгруппы)
  const groupLessons = (lessons: ISchedule[]): IGroupedLesson[] => {
    const map = new Map<string, IGroupedLesson>();

    for (const lesson of lessons) {
      // Ключ группировки: дата + номер пары
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

      // Проверяем, является ли это подгруппой
      if (lesson.isSubgroup && lesson.subgroupNumber) {
        if (!entry.subgroups) {
          entry.subgroups = {};
        }
        // Проверяем на ПОЛНЫЙ ДУБЛЬ (тот же предмет, препод, аудитория)
        const subgroupNum = lesson.subgroupNumber as 1 | 2;
        const existing = entry.subgroups[subgroupNum];
        
        // Если уже есть запись для этой подгруппы, проверяем что это не дубль
        if (existing && 
            existing.subject === lesson.subject.name &&
            existing.teacher === lesson.teacher?.fullName &&
            existing.room === lesson.room?.name) {
          // Это полный дубль - пропускаем
          continue;
        }
        
        entry.subgroups[subgroupNum] = {
          subject: lesson.subject.name,
          teacher: lesson.teacher?.fullName,
          room: lesson.room?.name,
        };
      } else {
        // Обычная пара для всей группы
        // Проверяем на ПОЛНЫЙ ДУБЛЬ
        if (entry.wholeGroup && 
            entry.wholeGroup.subject === lesson.subject.name &&
            entry.wholeGroup.teacher === lesson.teacher?.fullName &&
            entry.wholeGroup.room === lesson.room?.name) {
          // Это полный дубль - пропускаем
          continue;
        }
        
        entry.wholeGroup = {
          subject: lesson.subject.name,
          teacher: lesson.teacher?.fullName,
          room: lesson.room?.name,
        };
      }
    }

    // Дополнительная проверка: если подгруппы идентичны -> это одна пара для всей группы
    const result: IGroupedLesson[] = [];
    for (const entry of map.values()) {
      if (entry.subgroups && entry.subgroups[1] && entry.subgroups[2]) {
        const sub1 = entry.subgroups[1];
        const sub2 = entry.subgroups[2];
        
        // Если обе подгруппы идентичны -> это дубль, показываем как обычную пару
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

    // Сортируем дневные записи перед обычными парами
    return result.sort((a, b) => a.lessonNumber - b.lessonNumber);
  };

  // Группировка расписания по дням недели с мемоизацией
  const groupedSchedule = useMemo(() => {
    const days: { [key: string]: IGroupedLesson[] } = {};
    
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
    
    return days;
  }, [schedule]);

  const daysOrder = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const courses = useMemo(() => {
    return [...new Set(groups.map((group) => group.course?.name).filter(Boolean) as string[])]
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesCourse = selectedCourse ? group.course?.name === selectedCourse : true;
      const matchesSearch = normalizedQuery
        ? group.name.toLowerCase().includes(normalizedQuery)
        : true;

      return matchesCourse && matchesSearch;
    }).sort(compareGroupNames);
  }, [groups, searchQuery, selectedCourse]);

  const renderGroupOptions = (items: IGroup[]) => {
    let currentPrefix = '';

    return items.map((group) => {
      const prefix = getGroupPrefix(group.name);
      const showPrefix = prefix !== currentPrefix;
      currentPrefix = prefix;

      return (
        <React.Fragment key={group.id}>
          {showPrefix && (
            <div className="px-4 pb-1 pt-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
              {prefix}
            </div>
          )}
          <button
            type="button"
            onClick={() => handleGroupSelect(group.name)}
            className="block w-full px-4 py-3 text-left font-semibold text-slate-700 hover:bg-blue-50"
          >
            {group.name}
          </button>
        </React.Fragment>
      );
    });
  };

  const visibleGroupOptions = useMemo(() => filteredGroups.slice(0, 5), [filteredGroups]);
  const visibleSearchOptions = useMemo(() => filteredGroups.slice(0, 5), [filteredGroups]);

  if (loading && !isSelecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarIcon />
            </span>
            <span>Расписание занятий</span>
            {selectedGroup && !isSelecting && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-lg">
                {selectedGroup}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">Актуальное расписание пар на текущую неделю</p>
        </div>
        
        {selectedGroup && !isSelecting && (
          <button
            onClick={handleChangeGroup}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
          >
            <RefreshIcon />
            <span>Изменить группу</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Экран выбора группы */}
      {isSelecting ? (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 max-w-2xl mx-auto text-center space-y-6">
          <div className="bg-blue-50 text-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCapIcon />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Выберите вашу группу</h2>
          <p className="text-slate-500">
            Для того чтобы мы могли показать вам расписание, пожалуйста, выберите вашу учебную группу из списка ниже.
          </p>

          <div className="mx-auto grid max-w-md gap-4 text-left">
            <div className="space-y-2">
              <label htmlFor="course-select" className="block text-sm font-bold text-slate-700">
                Курс
              </label>
              <div className="relative group">
                <select
                  id="course-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-100 text-slate-700 py-4 px-6 pr-12 rounded-2xl focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-bold text-lg"
                >
                  <option value="">Все курсы</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="group-select" className="block text-sm font-bold text-slate-700">
                Группа
              </label>
              <div className="relative group" ref={groupDropdownRef}>
                <button
                  id="group-select"
                  type="button"
                  onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between bg-slate-50 border-2 border-slate-100 text-slate-700 py-4 px-6 rounded-2xl focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-bold text-lg"
                >
                  <span>{selectedGroup ?? 'Нажмите для выбора...'}</span>
                  <span className="text-slate-400">
                    <ChevronDownIcon />
                  </span>
                </button>

             {isGroupDropdownOpen && (
  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-slate-200 bg-white shadow-xl">
    <div
      className="h-[240px] overflow-y-scroll py-2"
      style={{ overscrollBehavior: 'contain' }}
      onWheel={(e) => e.stopPropagation()}
    >
      {renderGroupOptions(filteredGroups)}
    </div>
  </div>
)}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="group-search" className="block text-sm font-bold text-slate-700">
                Поиск
              </label>
              <div className="relative" ref={searchDropdownRef}>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <SearchIcon />
                </div>
                <input
                  id="group-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  placeholder="Например, ПР-25.101"
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-700 py-4 pl-11 pr-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium"
                />

             {isSearchDropdownOpen && searchQuery.trim() && (
  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-slate-200 bg-white shadow-xl">
    <div
      className="h-[240px] overflow-y-scroll py-2"
      style={{ overscrollBehavior: 'contain' }}
      onWheel={(e) => e.stopPropagation()}
    >
      {renderGroupOptions(filteredGroups)}
    </div>
  </div>
)}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 pt-4">
            Выбор сохранится автоматически для будущих посещений
          </p>
        </div>
      ) : (
        /* Отображение расписания */
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8">
          {daysOrder.map((day) => (
            groupedSchedule[day] && (
              <div key={day} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">
                    {formatScheduleDateTitle(day, groupedSchedule[day])}
                  </h2>
                  <div className="h-px bg-slate-200 flex-1"></div>
                  {groupedSchedule[day].filter((lesson) => lesson.lessonNumber > 0).length > 0 && (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {formatPairsCount(groupedSchedule[day].filter((lesson) => lesson.lessonNumber > 0).length)}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {groupedSchedule[day].map((lesson, idx) => (
                    <div 
                      key={`${day}-${lesson.lessonNumber}-${idx}`} 
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {lesson.lessonNumber === 0 ? (
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-slate-800 leading-tight">
                            {lesson.wholeGroup?.subject || 'Не учебный день'}
                          </h3>
                        </div>
                      ) : (
                      <>
                      {/* Карточка для подгрупп (разделённая вертикальной чертой) */}
                      {lesson.subgroups ? (
                        <div className="grid grid-cols-[64px_150px_minmax(0,1fr)] items-stretch">
                          <div className="flex flex-col items-center justify-center border-r border-slate-100 p-5">
                            <span className="text-blue-600 font-black text-xl leading-none">
                              {lesson.lessonNumber}
                            </span>
                            <span className="text-slate-400 text-[10px] font-bold mt-1 uppercase">
                              Пара
                            </span>
                          </div>

                          <div className="flex items-center justify-center border-r border-slate-100 px-4 py-5 text-center">
                            <span className="whitespace-nowrap text-sm font-bold text-slate-600">
                              {lesson.startTime || '--:--'}
                            </span>
                          </div>

                          <div className="grid min-w-0 grid-cols-1 md:grid-cols-2">
                            <div className={`p-5 ${lesson.subgroups[2] ? 'md:border-r-2 md:border-slate-200' : 'md:col-span-2'}`}>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    1 подгруппа
                                  </span>
                                </div>
                                {lesson.subgroups[1] ? (
                                  <>
                                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                                      {lesson.subgroups[1].subject}
                                    </h3>
                                    <div className="mt-2 space-y-1 text-sm text-slate-500">
                                      {lesson.subgroups[1].teacher && (
                                        <div>
                                          <TeacherLink teacherName={lesson.subgroups[1].teacher!} />
                                        </div>
                                      )}
                                      {lesson.subgroups[1].room && (
                                        <div>
                                          <span className="font-medium">Ауд. {lesson.subgroups[1].room}</span>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-slate-400 text-lg font-medium py-4 text-center">
                                    — Окно —
                                  </div>
                                )}
                              </div>
                            </div>
                          
                          {/* Правая часть - 2 подгруппа */}
                          {lesson.subgroups[2] && (
                            <div className="p-5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-teal-100 text-teal-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    2 подгруппа
                                  </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-800 leading-tight">
                                  {lesson.subgroups[2].subject}
                                </h3>
                                      <div className="mt-2 space-y-1 text-sm text-slate-500">
                                  {lesson.subgroups[2].teacher && (
                                    <div>
                                      <TeacherLink teacherName={lesson.subgroups[2].teacher!} />
                                    </div>
                                  )}
                                  {lesson.subgroups[2].room && (
                                    <div>
                                      <span className="font-medium">Ауд. {lesson.subgroups[2].room}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          </div>
                        </div>
                      ) : (
                        /* Обычная карточка для всей группы */
                        <div className="grid grid-cols-[64px_150px_minmax(0,1fr)] items-stretch">
                          <div className="flex flex-col items-center justify-center border-r border-slate-100 p-5">
                            <span className="text-blue-600 font-black text-xl leading-none">
                              {lesson.lessonNumber}
                            </span>
                            <span className="text-slate-400 text-[10px] font-bold mt-1 uppercase">
                              Пара
                            </span>
                          </div>

                          <div className="flex items-center justify-center border-r border-slate-100 px-4 py-5 text-center">
                            <span className="whitespace-nowrap text-sm font-bold text-slate-600">
                              {lesson.startTime || '--:--'}
                            </span>
                          </div>

                          {/* Детали пары */}
                          <div className="min-w-0 flex-1 space-y-3 p-5">
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">
                              {lesson.wholeGroup?.subject || 'Неизвестный предмет'}
                            </h3>
                            
                            <div className="space-y-1">
                              {lesson.wholeGroup?.teacher && (
                                <div className="text-sm text-slate-500">
                                  <TeacherLink teacherName={lesson.wholeGroup.teacher} />
                                </div>
                              )}
                              
                              {lesson.wholeGroup?.room && (
                                <div className="text-sm text-slate-500">
                                  <span className="font-medium">Ауд. {lesson.wholeGroup.room}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          
          {Object.keys(groupedSchedule).length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="text-6xl">📭</div>
              <h2 className="text-2xl font-bold text-slate-800">Расписание не найдено</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Похоже, для группы {selectedGroup} на текущий момент данных о парах нет. 
                Попробуйте выбрать другую группу или запустить синхронизацию.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
