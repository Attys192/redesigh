'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock3,
  GraduationCap,
  Loader2,
  MapPin,
  Search,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { IAdmissionCampaign, IAdmissionPlan } from '@/types';
import { getAdmissionCampaigns, getAdmissionPlans } from '@/lib/api';

const formLabels: Record<string, string> = { 'full-time': 'Очная форма', 'part-time': 'Заочная форма' };
const fundingLabels: Record<string, string> = { budget: 'Бюджет', paid: 'Платно' };

function formatDuration(months: number) {
  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  const yearLabel = years === 1 ? 'год' : years < 5 ? 'года' : 'лет';
  return restMonths > 0 ? `${years} ${yearLabel} ${restMonths} мес.` : `${years} ${yearLabel}`;
}

function contextKey(plan: IAdmissionPlan) {
  return [plan.formType, plan.educationBase, plan.fundingType, plan.durationMonths].join('|');
}

function contextTitle(plan: IAdmissionPlan) {
  return `${formLabels[plan.formType] ?? plan.formType}, база ${plan.educationBase} классов, ${
    fundingLabels[plan.fundingType] ?? plan.fundingType
  }, ${formatDuration(plan.durationMonths)}`;
}

export default function SpecialtiesPage() {
  const [campaigns, setCampaigns] = useState<IAdmissionCampaign[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [plans, setPlans] = useState<IAdmissionPlan[]>([]);
  const [activeCampus, setActiveCampus] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Инициализация списка кампаний
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await getAdmissionCampaigns();
        setCampaigns(data);
        
        // Умный выбор года: берем самый поздний год, в котором есть планы (plansCount > 0)
        const activeCampaign = data.find((c: IAdmissionCampaign) => Number(c.plansCount) > 0);
        setSelectedYear(activeCampaign ? activeCampaign.year : data[0]?.year || 2025);
      } catch (err) {
        setSelectedYear(2025);
      }
    };
    loadCampaigns();
  }, []);

  // Загрузка планов при смене года
  useEffect(() => {
    if (!selectedYear) return;

    const loadPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdmissionPlans(selectedYear);
        setPlans(data);
      } catch (err) {
        setError('Не удалось загрузить планы приема на выбранный год.');
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, [selectedYear]);

 const campuses = useMemo<string[]>(() => {
    // Используем явную проверку (c): c is string, чтобы TS "поверил", что null удалены
    return Array.from(
      new Set(
        plans
          .map((p) => p.campusAddress)
          .filter((c): c is string => typeof c === 'string' && c.length > 0)
      )
    );
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plans.filter(p => {
      const matchCampus = activeCampus === 'all' || p.campusAddress === activeCampus;
      const matchQuery = !q || p.specialtyCode.toLowerCase().includes(q) || p.specialtyTitle.toLowerCase().includes(q);
      return matchCampus && matchQuery;
    });
  }, [activeCampus, plans, query]);

  const groupedPlans = useMemo(() => {
    const groups = new Map<string, { title: string; items: IAdmissionPlan[] }>();
    filteredPlans.forEach(plan => {
      const key = contextKey(plan);
      if (!groups.has(key)) {
        groups.set(key, { title: contextTitle(plan), items: [] });
      }
      groups.get(key)?.items.push(plan);
    });
    return Array.from(groups.values());
  }, [filteredPlans]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
              <GraduationCap size={16} /> Приемная кампания {selectedYear}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800">Специальности и профессии</h1>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedYear(c.year)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  selectedYear === c.year ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {c.year} год
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Конкурсных групп" value={filteredPlans.length} />
          <StatCard label="Всего мест" value={filteredPlans.reduce((s, p) => s + (p.places || 0), 0)} />
          <StatCard label="Корпусов" value={campuses.length} />
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по коду или названию..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <select
            value={activeCampus}
            onChange={(e) => setActiveCampus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="all">Все адреса</option>
            {campuses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={42} />
          <p className="mt-4 font-bold text-slate-400">Синхронизация списка...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedPlans.map((group) => (
            <section key={group.title} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <h2 className="text-xl font-black text-slate-800">{group.title}</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {group.items.map((plan) => (
                  <SpecialtyCard key={plan.id} plan={plan} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function SpecialtyCard({ plan }: { plan: IAdmissionPlan }) {
  return (
    <article className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <p className="text-2xl font-black text-blue-600 leading-none">{plan.specialtyCode}</p>
          <h3 className="text-lg font-black leading-snug text-slate-800 group-hover:text-blue-700 transition-colors">
            {plan.specialtyTitle}
          </h3>
        </div>
        <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center min-w-20">
          <p className="text-[10px] font-bold uppercase text-blue-400">мест</p>
          <p className="text-2xl font-black text-blue-700">{plan.places}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
          <MapPin size={14} /> {plan.campusAddress || 'Корпус уточняется'}
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
          <Clock3 size={14} /> {formatDuration(plan.durationMonths)}
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`/applicant/specialties/${encodeURIComponent(plan.specialtyCode)}`} 
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors">
          <FileText size={16} /> Подробнее
          <ChevronRight size={14} />
        </Link>
        <Link href={`/applicant/calculator?code=${plan.specialtyCode}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
          <CalendarDays size={16} />
        </Link>
      </div>
    </article>
  );
}