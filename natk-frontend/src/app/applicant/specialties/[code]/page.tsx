'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Loader2,
  Target,
  History,
} from 'lucide-react';
import { IAdmissionPlan, ISpecialtyProfile, IAdmissionCampaign } from '@/types';
import { getAdmissionPlans, getSpecialtyProfile, getAdmissionCampaigns } from '@/lib/api';

const fundingLabels: Record<string, string> = { budget: 'Бюджет', paid: 'Платно' };
const formLabels: Record<string, string> = { 'full-time': 'Очная', 'part-time': 'Заочная' };

function formatDuration(months: number) {
  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  const yearLabel = years === 1 ? 'год' : years < 5 ? 'года' : 'лет';
  return restMonths > 0 ? `${years} ${yearLabel} ${restMonths} мес.` : `${years} ${yearLabel}`;
}

export default function SpecialtyDetailsPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code);
  
  const [profile, setProfile] = useState<ISpecialtyProfile | null>(null);
  const [plans, setPlans] = useState<IAdmissionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Загружаем профиль, кампании и ВСЕ планы параллельно
        const [profileData, campaigns, allPlans] = await Promise.all([
          getSpecialtyProfile(code),
          getAdmissionCampaigns(),
          getAdmissionPlans() // Без года - берем все
        ]);

        setProfile(profileData);
        // Фильтруем планы только для этой специальности
        setPlans(allPlans.filter((p: IAdmissionPlan) => p.specialtyCode === code));
      } catch (err) {
        setError('Информация по специальности не найдена или еще не загружена.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  // Группируем планы по годам для наглядности
  const groupedPlans = useMemo(() => {
    const groups: Record<number, IAdmissionPlan[]> = {};
    plans.forEach(plan => {
      const year = plan.campaignYear;
      if (!groups[year]) groups[year] = [];
      groups[year].push(plan);
    });
    // Возвращаем отсортированным по году (новые сверху)
    return Object.entries(groups)
      .map(([year, items]) => ({ year: Number(year), items }))
      .sort((a, b) => b.year - a.year);
  }, [plans]);

  // Считаем места только для самого последнего (актуального) года
  const latestYearPlaces = useMemo(() => {
    if (groupedPlans.length === 0) return 0;
    return groupedPlans[0].items.reduce((sum, p) => sum + (p.places || 0), 0);
  }, [groupedPlans]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 className="animate-spin text-blue-600" size={42} />
      <p className="mt-4 font-semibold text-slate-400">Загружаем данные специальности...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="space-y-6">
      <Link href="/applicant/specialties" className="inline-flex items-center gap-2 font-bold text-slate-500">
        <ArrowLeft size={18} /> Назад
      </Link>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
        <p className="text-sm font-medium">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/applicant/specialties" className="inline-flex items-center gap-2 font-bold text-slate-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={18} /> К списку специальностей
      </Link>

      <section className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
              <GraduationCap size={16} /> {profile.code}
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight text-slate-800">{profile.title}</h1>
            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-slate-600">{profile.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-72">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Мест в {groupedPlans[0]?.year || ''}</p>
              <p className="text-2xl font-black text-slate-800">{latestYearPlaces}</p>
            </div>
            <div className="rounded-2xl bg-blue-50/50 border border-blue-100 px-5 py-4">
              <p className="text-xs font-bold text-blue-400 uppercase">Кампаний</p>
              <p className="text-2xl font-black text-blue-700">{groupedPlans.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/applicant/calculator?code=${profile.code}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-transform hover:scale-105">
            <CalendarDays size={18} /> Оценить шансы
          </Link>
          <a href={profile.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-200">
            Официальная страница
          </a>
        </div>
      </section>

      {/* Вывод планов по годам */}
      {groupedPlans.map((group, idx) => (
        <section key={group.year} className={`rounded-3xl border p-6 shadow-sm ${idx === 0 ? 'bg-white border-blue-100' : 'bg-slate-50/50 border-slate-100 opacity-80'}`}>
          <div className="flex items-center gap-3 mb-5">
            {idx === 0 ? <Target className="text-blue-600" /> : <History className="text-slate-400" />}
            <h2 className="text-xl font-black text-slate-800">
              План приема {group.year}/{group.year + 1} {idx === 0 && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">Текущий</span>}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.items.map((plan) => (
              <div key={plan.id} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{formLabels[plan.formType] || plan.formType} на базе {plan.educationBase} кл.</p>
                    <p className="mt-2 text-sm font-bold text-blue-500 uppercase">{fundingLabels[plan.fundingType] || plan.fundingType}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{formatDuration(plan.durationMonths)} • {plan.campusAddress || 'Корпус уточняется'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-300 uppercase">мест</p>
                    <p className="text-3xl font-black text-slate-800">{plan.places}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Блоки с контентом из профиля */}
      <ListBlock title="Изучаемые дисциплины" icon={<BookOpen size={20} />} items={profile.disciplines} />
      <ListBlock title="Профессиональная область" icon={<Target size={20} />} items={profile.professionalAreas} />
      <ListBlock title="Ключевые навыки" icon={<BriefcaseBusiness size={20} />} items={profile.skills} />
      <ListBlock title="Варианты карьеры" icon={<BriefcaseBusiness size={20} />} items={profile.careerOptions} />

      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-black text-slate-800">Подробное описание</h2>
        <div className="prose prose-slate max-w-none text-slate-600 prose-headings:text-slate-800 prose-strong:text-slate-700" 
             dangerouslySetInnerHTML={{ __html: profile.contentHtml ?? '' }} />
      </section>
    </div>
  );
}

function ListBlock({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">{icon}</div>
        <h2 className="text-xl font-black text-slate-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 border border-transparent hover:border-blue-100 transition-colors">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}