'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { IDepartment, IStaff } from '@/types';
import StaffAvatar from '@/components/StaffAvatar';

interface StaffPreview {
  id: number;
  fullName: string;
  photoUrl?: string;
  positionName?: string;
}

export default function TeacherStructurePage() {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffMap, setStaffMap] = useState<Record<string, StaffPreview>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005'}/api/departments`)
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка сети');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка загрузки структуры:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const uniqueNames = Array.from(new Set(departments.map((d) => d.headName).filter(Boolean)));

    const fetchStaffIds = async () => {
      const map: Record<string, StaffPreview> = {};

      await Promise.all(
        uniqueNames.map(async (name) => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005'}/api/staff/find?name=${encodeURIComponent(name!.split(' ')[0])}`
            );

            if (res.ok) {
              const matches: IStaff[] = await res.json();
              if (matches.length > 0) {
                map[name!] = {
                  id: matches[0].id,
                  fullName: matches[0].fullName,
                  photoUrl: matches[0].photoUrl,
                  positionName: matches[0].positions?.[0]?.positionName,
                };
              }
            }
          } catch {}
        })
      );

      setStaffMap(map);
    };

    if (departments.length > 0) {
      fetchStaffIds();
    }
  }, [departments]);

  const categories = departments.reduce((acc, dept) => {
    const category = dept.category || 'Другое';
    if (!acc[category]) acc[category] = [];
    acc[category].push(dept);
    return acc;
  }, {} as Record<string, IDepartment[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-orange-700 p-8 text-white shadow-2xl shadow-amber-200 md:p-12">
        <div className="relative z-10">
          <h1 className="mb-4 text-3xl font-black text-white md:text-4xl">Структура и органы управления</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-amber-100">
            Иерархическая структура подразделений колледжа, информация о руководителях и органах управления.
          </p>
        </div>
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {Object.entries(categories).map(([category, items]) => (
        <section key={category} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200"></div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">{category}</h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((dept) => (
              <div 
                key={dept.id} 
                className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute right-0 top-0 -mr-12 -mt-12 h-24 w-24 rounded-bl-full bg-amber-50/50 transition-colors group-hover:bg-amber-100/50"></div>

                <div className="min-h-[5rem] md:min-h-[5.5rem]">
                  <h3 className="pr-8 text-lg font-bold leading-tight text-slate-800">{dept.name}</h3>
                </div>

                <div className="flex-grow space-y-4">
                  {dept.headName ? (
                    staffMap[dept.headName] ? (
                      <Link
                        href={`/teacher/staff/${staffMap[dept.headName].id}`}
                        className="-ml-3 grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-4 rounded-2xl p-3 text-amber-600 transition-colors hover:bg-amber-50"
                      >
                        <StaffAvatar
                          name={staffMap[dept.headName].fullName}
                          src={staffMap[dept.headName].photoUrl}
                          className="flex h-32 w-32 rounded-2xl border border-slate-200 bg-white p-2"
                          imageClassName="object-contain"
                          showInitials={false}
                        />
                        <div className="min-w-0 self-center space-y-2">
                          <span className="block break-words text-base font-bold leading-snug">
                            {dept.headName}
                          </span>
                          {staffMap[dept.headName]?.positionName && (
                            <span className="block text-sm font-medium leading-snug text-slate-500">
                              {staffMap[dept.headName].positionName}.
                            </span>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="-ml-3 grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-4 rounded-2xl p-3 text-slate-400">
                        <StaffAvatar
                          name={dept.headName}
                          className="flex h-32 w-32 rounded-2xl border border-slate-200 bg-white p-2"
                          imageClassName="object-contain"
                          showInitials={false}
                        />
                        <div className="min-w-0 self-center">
                          <span className="block break-words text-base font-bold leading-snug">
                            {dept.headName}
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="-ml-3 grid cursor-default grid-cols-[8rem_minmax(0,1fr)] items-start gap-4 rounded-2xl p-3 text-slate-300 opacity-70">
                      <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-2">
                        <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0 self-center space-y-2">
                        <span className="block text-base font-bold leading-snug text-slate-400">
                          Руководитель не назначен
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-col space-y-3 pt-2">
                  {dept.address && (
                    <div className="text-xs text-slate-500">
                      <p className="leading-snug">{dept.address}</p>
                    </div>
                  )}
                  {dept.email && (
                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">Адрес электронной почты:</span>{' '}
                      <a href={`mailto:${dept.email}`} className="transition-colors hover:text-amber-600">
                        {dept.email}
                      </a>
                    </div>
                  )}
                  {dept.website && (
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="transition-all grayscale group-hover:grayscale-0">🌐</span>
                      <a
                        href={dept.website.startsWith('http') ? dept.website : `https://${dept.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-amber-100 underline-offset-4 transition-colors hover:text-amber-600"
                      >
                        {dept.website}
                      </a>
                    </div>
                  )}
                  {dept.documentUrl && (
                    <div className="pt-1 text-xs text-slate-500">
                      <a
                        href={dept.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-amber-600 hover:underline"
                      >
                        Положение о подразделении
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {departments.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
          <span className="mb-4 block text-4xl">🔍</span>
          <h3 className="text-lg font-bold text-slate-400">Данные не найдены</h3>
          <p className="text-sm text-slate-400">Запустите синхронизацию `type=structure` в панели управления</p>
        </div>
      )}
    </div>
  );
}
