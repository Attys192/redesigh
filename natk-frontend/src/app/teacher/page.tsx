'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Search, 
  User, 
  Check, 
  ChevronRight, 
  LogOut,
  Calendar,
  Rss,
  Building2,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import StaffAvatar from '@/components/StaffAvatar';

interface StaffItem {
  id: number;
  fullName: string;
  position?: string;
  photoUrl?: string | null;
}

interface TeacherProfile {
  id: number;
  fullName: string;
  position?: string;
}

const API_BASE = '/api';

export default function TeacherPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didFetch = useRef(false);

  // Load saved profile from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('teacherProfile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved) as TeacherProfile);
        return;
      } catch {
        localStorage.removeItem('teacherProfile');
      }
    }

    // No saved profile — load staff list once
    if (didFetch.current) return;
    didFetch.current = true;
    setLoading(true);
    fetch(`${API_BASE}/staff`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<StaffItem[]>;
      })
      .then((data) => {
        setStaffList(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        setLoading(false);
      });
  }, []);

  const selectProfile = (member: StaffItem) => {
    const tp: TeacherProfile = {
      id: member.id,
      fullName: member.fullName,
      position: member.position,
    };
    localStorage.setItem('teacherProfile', JSON.stringify(tp));
    setProfile(tp);
  };

  const resetProfile = () => {
    localStorage.removeItem('teacherProfile');
    setProfile(null);
    if (!didFetch.current) {
      didFetch.current = true;
      setLoading(true);
      fetch(`${API_BASE}/staff`)
        .then((res) => res.json() as Promise<StaffItem[]>)
        .then((data) => { setStaffList(data); setLoading(false); })
        .catch(() => { setError('Ошибка загрузки'); setLoading(false); });
    }
  };

  const filtered = query.trim()
    ? staffList.filter((s) =>
        s.fullName.toLowerCase().includes(query.trim().toLowerCase())
      )
    : staffList;

  const quickLinks = [
    { href: '/teacher/schedule', icon: Calendar, label: 'Моё расписание', color: 'text-blue-500', bg: 'bg-blue-50' },
    { href: '/teacher/news', icon: Rss, label: 'Новости колледжа', color: 'text-orange-500', bg: 'bg-orange-50' },
    { href: '/teacher/structure', icon: Building2, label: 'Структура', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { href: '/teacher/documents', icon: FolderOpen, label: 'Документы', color: 'text-violet-500', bg: 'bg-violet-50' },
  ];

  /* ─────────────── DASHBOARD (profile already set) ─────────────── */
  if (profile) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-amber-200 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-amber-100 font-semibold mb-1 text-sm uppercase tracking-widest">
                Добро пожаловать
              </p>
              <h1 className="text-2xl md:text-4xl font-black leading-tight mb-2">
                {profile.fullName}
              </h1>
              {profile.position && (
                <p className="text-amber-100 text-base opacity-90">{profile.position}</p>
              )}
            </div>
            <button
              onClick={resetProfile}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0"
            >
              <LogOut size={16} />
              Сменить профиль
            </button>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Quick-link cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((ql) => {
            const IconComponent = ql.icon;
            return (
              <Link
                key={ql.href}
                href={ql.href}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4"
              >
                <div className={`${ql.bg} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <IconComponent size={24} className={ql.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm">{ql.label}</h3>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* View own staff profile */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center text-amber-700">
              <User size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Мой профиль на сайте</p>
              <p className="text-sm text-slate-500">Биография, контакты, расписание</p>
            </div>
          </div>
          <Link
            href="/teacher/profile"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Открыть
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  /* ─────────────── PROFILE SELECTION ─────────────── */
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-700">
          <User size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">Выберите свой профиль</h1>
        <p className="text-slate-500">
          Найдите своё имя в базе сотрудников колледжа. Выбор сохранится в браузере.
        </p>
      </div>

      {/* Search box */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Введите фамилию или имя..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/5" />
                <div className="h-3 bg-slate-100 rounded w-2/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-400">
          Никого не найдено по запросу «{query}»
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((member) => (
            <button
              key={member.id}
              onClick={() => selectProfile(member)}
              className="w-full bg-white hover:bg-amber-50 border border-slate-100 hover:border-amber-300 rounded-xl p-4 flex items-center gap-4 transition-all group text-left"
            >
              {member.photoUrl ? (
                <StaffAvatar
                  name={member.fullName}
                  src={member.photoUrl}
                  className="w-14 h-14 rounded-xl shrink-0"
                />
              ) : (
                <div className="bg-slate-100 group-hover:bg-amber-100 w-14 h-14 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-amber-700 transition-colors shrink-0">
                  <User size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{member.fullName}</p>
                {member.position && (
                  <p className="text-xs text-slate-500 truncate">{member.position}</p>
                )}
              </div>
              <Check size={18} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
