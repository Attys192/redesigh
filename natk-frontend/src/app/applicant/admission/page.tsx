'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle2, Loader2, RefreshCw, Zap } from 'lucide-react';
import { IAdmissionCampaign, IAdmissionResult } from '@/types';
import { getAdmissionCampaigns, getAdmissionResults } from '@/lib/api';

const formLabels: Record<string, string> = {
  'full-time': 'Очная форма обучения',
  'part-time': 'Заочная форма обучения',
};

const fundingLabels: Record<string, string> = {
  budget: 'За счет бюджетных ассигнований',
  paid: 'По договорам об оказании платных образовательных услуг',
};

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return '-';
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function groupKey(result: IAdmissionResult) {
  return [result.formType, result.educationBase, result.fundingType].join('|');
}

function groupTitle(result: IAdmissionResult) {
  return `${formLabels[result.formType] ?? result.formType}, база ${result.educationBase} классов, ${
    fundingLabels[result.fundingType] ?? result.fundingType
  }`;
}

function getDefaultCampaignYear(campaigns: IAdmissionCampaign[]) {
  return campaigns.find((campaign) => Number(campaign.plansCount ?? 0) > 0)?.year ?? campaigns[0]?.year ?? 2026;
}

export default function ApplicantAdmissionPage() {
  const [campaigns, setCampaigns] = useState<IAdmissionCampaign[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [results, setResults] = useState<IAdmissionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await getAdmissionCampaigns();
        setCampaigns(data);
        setSelectedYear(getDefaultCampaignYear(data));
      } catch (err) {
        console.error('Admission campaigns load error:', err);
        setSelectedYear(2025);
      }
    };

    loadCampaigns();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;

    const loadResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getAdmissionResults(selectedYear);
        setResults(data);
      } catch (err) {
        console.error('Admission results load error:', err);
        setError('Не удалось загрузить сведения о приеме. Проверьте работу сервера.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [selectedYear]);

  // Расширенный расчет итогов
  const totals = useMemo(() => {
    return results.reduce(
      (acc, item) => {
        const places = Number(item.places || 0);
        const apps = Number(item.applicationsCount || 0);
        const accepted = Number(item.accepted || 0);
        const avgScore = Number(item.avgScore || 0);

        acc.places += places;
        acc.applications += apps;
        acc.accepted += accepted;
        // Для расчета среднего балла по колледжу используем взвешенное значение
        acc.weightedScore += (avgScore * accepted);
        
        return acc;
      },
      { places: 0, applications: 0, accepted: 0, weightedScore: 0 },
    );
  }, [results]);

  const totalCompetition = totals.places > 0 ? totals.applications / totals.places : 0;
  const collegeAvgScore = totals.accepted > 0 ? totals.weightedScore / totals.accepted : null;

  const hasFinalColumns = results.some(
    (result) => (result.accepted ?? 0) > 0 || (result.avgScore ?? 0) > 0 || (result.passingScore ?? 0) > 0,
  );

  const groupedResults = useMemo(() => {
    const groups = new Map<string, { title: string; items: IAdmissionResult[] }>();

    results.forEach((result) => {
      const key = groupKey(result);
      if (!groups.has(key)) {
        groups.set(key, { title: groupTitle(result), items: [] });
      }
      groups.get(key)?.items.push(result);
    });

    return Array.from(groups.values());
  }, [results]);

  const latestUpdate = useMemo(() => {
    const timestamps = results
      .map((result) => result.updatedAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));

    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps)).toLocaleString('ru-RU');
  }, [results]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
         <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900 shadow-sm">
  <BarChart3 size={16} />
  Сведения о приеме
</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800">Поданные заявления и конкурс</h1>
              <p className="mt-2 max-w-3xl text-slate-500">
                Данные по плану приема, заявлениям, конкурсу и итоговым баллам по выбранной приемной кампании.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => setSelectedYear(campaign.year)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  selectedYear === campaign.year
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                {campaign.year}
              </button>
            ))}
          </div>
        </div>

       {/* Обновленная сетка статистики (6 колонок на больших экранах) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* План приема */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">План приема</p>
            <p className="text-2xl font-black text-slate-800">{totals.places}</p>
          </div>

          {/* Подано заявлений */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Заявлений</p>
            <p className="text-2xl font-black text-slate-800">{formatNumber(totals.applications)}</p>
          </div>

          {/* Конкурс */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Конкурс</p>
            <p className="text-2xl font-black text-blue-600">{formatNumber(totalCompetition, 2)}</p>
          </div>

          {/* Принято (НОВОЕ) */}
          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600/70 mb-1">Зачислено</p>
            <p className="text-2xl font-black text-blue-700">{formatNumber(totals.accepted)}</p>
          </div>

          {/* Средний балл */}
          <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 mb-1">Ср. балл</p>
            <p className="text-2xl font-black text-emerald-700">{formatScore(collegeAvgScore)}</p>
          </div>

          {/* Обновлено */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Обновлено</p>
            <p className="text-sm font-black text-slate-700 leading-tight">
              {latestUpdate?.split(',')[0] ?? '-'}
              <br/>
              <span className="text-slate-400 font-medium">{latestUpdate?.split(',')[1] ?? ''}</span>
            </p>
          </div>
        </div>

        {!hasFinalColumns && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-blue-800">
            <RefreshCw size={20} className="mt-0.5 shrink-0 animate-spin-slow" />
            <p className="text-sm font-medium">
              Итоговые показатели (зачислено, средний и проходной балл) появятся в таблице после завершения работы приемной комиссии.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={42} />
          <p className="mt-4 font-semibold text-slate-400">Загрузка данных...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedResults.map((group) => (
            <section key={group.title} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-1.5 rounded-full bg-emerald-500" />
                <h2 className="text-xl font-black text-slate-800">{group.title}</h2>
              </div>

              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="bg-slate-50/50 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 font-bold">Специальность</th>
                        <th className="px-6 py-4 text-right font-bold">План</th>
                        <th className="px-6 py-4 text-right font-bold">Заявления</th>
                        <th className="px-6 py-4 text-right font-bold">Конкурс</th>
                        {hasFinalColumns && <th className="px-6 py-4 text-right font-bold text-emerald-600">Принято</th>}
                        {hasFinalColumns && <th className="px-6 py-4 text-right font-bold text-emerald-600">Ср. балл</th>}
                        {hasFinalColumns && <th className="px-6 py-4 text-right font-bold text-emerald-600">Проходной</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((result) => (
                        <tr key={result.resultId || `${result.planId}-${result.specialtyCode}`} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                                {result.specialtyCode.split('.')[0]}
                              </span>
                              <div>
                                <p className="font-black text-slate-800 leading-none">{result.specialtyCode}</p>
                                <p className="mt-1.5 text-xs font-medium text-slate-400 line-clamp-1">{result.specialtyTitle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-slate-700">{result.places}</td>
                          <td className="px-6 py-5 text-right font-bold text-slate-700">
                            {formatNumber(result.applicationsCount)}
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-blue-600">
                            {formatNumber(result.competition, 2)}
                          </td>
                          {hasFinalColumns && (
                            <td className="px-6 py-5 text-right font-black text-slate-800">
                              {formatNumber(result.accepted)}
                            </td>
                          )}
                          {hasFinalColumns && (
                            <td className="px-6 py-5 text-right">
                              <span className="inline-block rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1 font-black text-emerald-900 shadow-sm">
  {formatScore(result.avgScore)}
</span>
                            </td>
                          )}
                          {hasFinalColumns && (
                            <td className="px-6 py-5 text-right font-bold text-slate-700">
                              {formatScore(result.passingScore)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}

          {groupedResults.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <Zap className="mx-auto mb-4 text-slate-300" size={48} />
              <p className="text-2xl font-black text-slate-600">Данные не найдены</p>
              <p className="mt-2 text-slate-400">Попробуйте выбрать другой год или запустить синхронизацию в панели управления.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}