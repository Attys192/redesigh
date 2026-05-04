'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ISchedule } from '@/types';
import Link from 'next/link';
import { 
  Calendar, 
  Rss, 
  Briefcase, 
  FolderOpen, 
  Sparkles
} from 'lucide-react';

export default function StudentDashboard() {
  const [todaySchedule, setTodaySchedule] = useState<ISchedule[]>([]);
  const [tomorrowSchedule, setTomorrowSchedule] = useState<ISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3005';
  const didRequestRef = useRef(false);

  useEffect(() => {
    if (didRequestRef.current) {
      return;
    }
    didRequestRef.current = true;

    const savedGroup = localStorage.getItem('studentGroup');
    setGroup(savedGroup);

    if (savedGroup) {
      fetch(`${apiBaseUrl}/api/schedule?group=${encodeURIComponent(savedGroup)}`)
        .then(async (res) => {
          const contentType = res.headers.get('content-type') ?? '';

          if (!res.ok) {
            throw new Error(`Ошибка API: ${res.status}`);
          }

          if (!contentType.includes('application/json')) {
            throw new Error(`Ожидался JSON, получен ${contentType || 'unknown'}`);
          }

          return res.json() as Promise<ISchedule[]>;
        })
        .then((data: ISchedule[]) => {
          // Помощник для получения строки даты в формате YYYY-MM-DD в локальном времени
          const getLocalDateString = (date: Date) => {
            const offset = date.getTimezoneOffset();
            const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
            return adjustedDate.toISOString().split('T')[0];
          };

          const now = new Date();
          const todayStr = getLocalDateString(now);
          
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          const tomorrowStr = getLocalDateString(tomorrow);

          const todayPairs = data.filter(item => {
            // Преобразуем дату из БД (которая может быть в ISO) в строку YYYY-MM-DD
            const itemDateStr = new Date(item.lessonDate).toISOString().split('T')[0];
            return itemDateStr === todayStr;
          });

          const tomorrowPairs = data.filter(item => {
            const itemDateStr = new Date(item.lessonDate).toISOString().split('T')[0];
            return itemDateStr === tomorrowStr;
          });

          setTodaySchedule(todayPairs);
          setTomorrowSchedule(tomorrowPairs);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Ошибка загрузки краткого расписания:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const MiniSchedule = ({ title, lessons, dateLabel }: { title: string, lessons: ISchedule[], dateLabel: string }) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          {title}
        </h3>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">
          {dateLabel}
        </span>
      </div>
      
      <div className="space-y-3 flex-1">
        {lessons.length > 0 ? (
          lessons.slice(0, 3).map((lesson) => (
            <div key={lesson.id} className="grid grid-cols-[78px_minmax(0,1fr)] rounded-2xl bg-slate-50 border border-slate-100/50 overflow-hidden">
              <div className="flex flex-col items-center justify-center border-r border-slate-200 px-3 py-4">
                <span className="text-blue-600 font-black text-base leading-none">{lesson.lessonNumber}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">пара</span>
                <span className="mt-2 text-[10px] text-slate-500 font-bold whitespace-nowrap">
                  {lesson.startTime || '--:--'}
                </span>
              </div>
              <div className="min-w-0 space-y-1 px-4 py-3">
                <h4 className="text-sm font-bold text-slate-800 leading-snug">{lesson.subject.name}</h4>
                {lesson.teacher?.fullName && (
                  <p className="text-xs text-slate-500 font-medium leading-snug">
                    {lesson.teacher.fullName}
                  </p>
                )}
                {lesson.room?.name && (
                  <p className="text-xs text-slate-500 font-medium leading-snug">
                    Ауд. {lesson.room.name}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Sparkles size={28} className="text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-400 uppercase">Пар нет, отдыхай!</p>
          </div>
        )}
        {lessons.length > 3 && (
          <p className="text-[10px] text-center text-slate-400 font-bold pt-1">
            + еще {lessons.length - 3} пары
          </p>
        )}
      </div>
      
      <Link 
        href="/student/schedule" 
        className="mt-4 text-center py-2 text-xs font-black text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-50"
      >
        ПОЛНОЕ РАСПИСАНИЕ
      </Link>
    </div>
  );

  const quickLinks = [
    { href: '/student/schedule', icon: Calendar, label: 'Расписание', description: 'Полный график на неделю', color: 'text-blue-500', bg: 'bg-blue-50' },
    { href: '/student/news', icon: Rss, label: 'Новости', description: 'События и объявления', color: 'text-orange-500', bg: 'bg-orange-50' },
    { href: '/student/vacancies', icon: Briefcase, label: 'Вакансии', description: 'Работа для студентов', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { href: '/student/documents', icon: FolderOpen, label: 'Документы', description: 'Учебные материалы', color: 'text-violet-500', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Приветственный баннер */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">С возвращением!</h1>
            <p className="text-blue-100 text-lg opacity-90">
              Твой личный кабинет студента НАТК. Все самое важное собрано здесь, чтобы ты не терял время.
            </p>
          </div>
          
          {group && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex flex-col items-center">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Твоя группа</span>
              <span className="text-3xl font-black">{group}</span>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Блок быстрого расписания */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MiniSchedule 
            title="Сегодня" 
            lessons={todaySchedule} 
            dateLabel={new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} 
          />
          <MiniSchedule 
            title="Завтра" 
            lessons={tomorrowSchedule} 
            dateLabel={new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} 
          />
        </div>

        {/* Быстрые ссылки */}
        <div className="grid grid-cols-1 gap-4">
          {quickLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4"
              >
                <div className={`${link.bg} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <IconComponent size={24} className={link.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm">{link.label}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
