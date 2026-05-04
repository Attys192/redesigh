'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ISchedule } from '@/types';
import { useRouter } from 'next/navigation';
import { UserCog } from 'lucide-react';

interface TeacherProfile {
  id: number;
  fullName: string;
  position?: string;
}

interface GroupedLesson {
  lessonNumber: number;
  time: string;
  dayOfWeek: string;
  lessonDate: Date;
  subgroups: {
    1?: ISchedule;
    2?: ISchedule;
    all?: ISchedule;
  };
}

const DAYS_ORDER = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const LESSON_TIMES: Record<number, string> = {
  1: '08:30 – 10:05',
  2: '10:15 – 11:50',
  3: '12:20 – 13:55',
  4: '14:05 – 15:40',
  5: '15:50 – 17:25',
  6: '17:35 – 19:10',
};

function getLessonTime(lesson: ISchedule): string {
  if (lesson.startTime) return lesson.startTime;
  return LESSON_TIMES[lesson.lessonNumber] ?? '--:--';
}

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

function getTodayDayName(): string {
  const idx = new Date().getDay();
  const map: Record<number, string> = {
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница',
    6: 'Суббота',
    0: 'Воскресенье',
  };
  return map[idx] ?? '';
}

function localDateStr(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
}

function formatScheduleDateTitle(day: string, lessons: GroupedLesson[]): string {
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

export default function TeacherSchedulePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [groupedLessons, setGroupedLessons] = useState<Record<string, GroupedLesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didFetch = useRef(false);

  const todayName = getTodayDayName();
  useEffect(() => {
    const saved = localStorage.getItem('teacherProfile');
    if (!saved) {
      router.replace('/teacher');
      return;
    }
    try {
      const p = JSON.parse(saved) as TeacherProfile;
      setProfile(p);
      if (!didFetch.current) {
        didFetch.current = true;
        fetchSchedule(p.fullName);
      }
    } catch {
      localStorage.removeItem('teacherProfile');
      router.replace('/teacher');
    }
  }, [router]);

  const fetchSchedule = (teacherName: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/schedule?teacher=${encodeURIComponent(teacherName)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ISchedule[]>;
      })
      .then((data) => {
        const grouped = data.reduce<Record<string, GroupedLesson[]>>((acc, lesson) => {
          const day = lesson.dayOfWeek.charAt(0).toUpperCase() + lesson.dayOfWeek.slice(1).toLowerCase();
          const date = localDateStr(new Date(lesson.lessonDate));

          if (!acc[day]) acc[day] = [];

          let entry = acc[day].find(
            (item) =>
              item.lessonNumber === lesson.lessonNumber &&
              localDateStr(new Date(item.lessonDate)) === date
          );

          if (!entry) {
            entry = {
              lessonNumber: lesson.lessonNumber,
              time: getLessonTime(lesson),
              dayOfWeek: day,
              lessonDate: new Date(lesson.lessonDate),
              subgroups: {},
            };
            acc[day].push(entry);
          }

          if (lesson.isSubgroup && lesson.subgroupNumber) {
            entry.subgroups[lesson.subgroupNumber as 1 | 2] = lesson;
          } else {
            entry.subgroups.all = lesson;
          }

          return acc;
        }, {});

        for (const day in grouped) {
          grouped[day].sort((a, b) => a.lessonNumber - b.lessonNumber);
        }

        setGroupedLessons(grouped);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        setLoading(false);
      });
  };

  const handleRefresh = () => {
    if (profile) {
      didFetch.current = false;
      fetchSchedule(profile.fullName);
    }
  };

  const handleChangeProfile = () => {
    localStorage.removeItem('teacherProfile');
    router.push('/teacher');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarIcon />
            </span>
            <span>Моё расписание</span>
            {todayName && (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-base font-semibold">
                {todayName}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">Актуальное расписание занятий на текущую неделю</p>
          {profile && (
            <p className="text-slate-600 mt-2 font-medium">{profile.fullName}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
          >
            <RefreshIcon />
            Обновить
          </button>
          <button
            onClick={handleChangeProfile}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all shadow-sm"
          >
            <UserCog size={15} />
            Изменить профиль
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {Object.keys(groupedLessons).length === 0 ? (
        <div className="col-span-full py-20 text-center space-y-4">
          <div className="text-6xl">📭</div>
          <h2 className="text-2xl font-bold text-slate-800">Расписание не найдено</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            На текущий момент пары для этого преподавателя не загружены.
            Попробуйте обновить или запустить синхронизацию на бэкенде.
          </p>
        </div>
      ) : (
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8">
          {DAYS_ORDER.map((day) => {
            const lessons = groupedLessons[day];
            if (!lessons) return null;
            const isToday = day === todayName;

            return (
              <div key={day} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  {isToday ? (
                    <span className="bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Сегодня
                    </span>
                  ) : null}
                  <h2
                    className={`text-xl font-black uppercase tracking-wider ${
                      isToday ? 'text-amber-600' : 'text-slate-800'
                    }`}
                  >
                    {formatScheduleDateTitle(day, lessons)}
                  </h2>
                  <div className="h-px bg-slate-200 flex-1" />
                  {lessons.filter((lesson) => lesson.lessonNumber > 0).length > 0 && (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {formatPairsCount(lessons.filter((lesson) => lesson.lessonNumber > 0).length)}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {lessons.map((lesson, idx) => (
                    <div
                      key={`${day}-${lesson.lessonNumber}-${idx}`}
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {lesson.lessonNumber === 0 ? (
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-slate-800 leading-tight">
                            {lesson.subgroups.all?.subject.name || 'Не учебный день'}
                          </h3>
                        </div>
                      ) : lesson.subgroups[1] || lesson.subgroups[2] ? (
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
                              {lesson.time || '--:--'}
                            </span>
                          </div>

                          <div className="grid min-w-0 grid-cols-1 md:grid-cols-2">
                            <div
                              className={`p-5 ${
                                lesson.subgroups[2] ? 'md:border-r-2 md:border-slate-200' : 'md:col-span-2'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    1 подгруппа
                                  </span>
                                </div>
                                {lesson.subgroups[1] ? (
                                  <>
                                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                                      {lesson.subgroups[1].subject.name}
                                    </h3>
                                    <div className="mt-2 space-y-1 text-sm text-slate-500">
                                      <div className="font-bold text-blue-600">
                                        {lesson.subgroups[1].group.name}
                                      </div>
                                      {lesson.subgroups[1].room && (
                                        <div>
                                          <span className="font-medium">Ауд. {lesson.subgroups[1].room.name}</span>
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

                            {lesson.subgroups[2] && (
                              <div className="p-5">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-teal-100 text-teal-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                      2 подгруппа
                                    </span>
                                  </div>
                                  <h3 className="text-base font-bold text-slate-800 leading-tight">
                                    {lesson.subgroups[2].subject.name}
                                  </h3>
                                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                                    <div className="font-bold text-blue-600">
                                      {lesson.subgroups[2].group.name}
                                    </div>
                                    {lesson.subgroups[2].room && (
                                      <div>
                                        <span className="font-medium">Ауд. {lesson.subgroups[2].room.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
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
                              {lesson.time || '--:--'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-3 p-5">
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">
                              {lesson.subgroups.all?.subject.name || 'Неизвестный предмет'}
                            </h3>

                            <div className="space-y-1">
                              {lesson.subgroups.all?.group && (
                                <div className="text-sm font-bold text-blue-600">
                                  {lesson.subgroups.all.group.name}
                                </div>
                              )}

                              {lesson.subgroups.all?.room && (
                                <div className="text-sm text-slate-500">
                                  <span className="font-medium">Ауд. {lesson.subgroups.all.room.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

