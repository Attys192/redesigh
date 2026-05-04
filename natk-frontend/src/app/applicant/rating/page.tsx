'use client';

import React, { useState } from 'react';
import { IAdmissionStatus } from '@/types';

export default function ApplicantRatingPage() {
  const [registrationCode, setRegistrationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<IAdmissionStatus | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3005';

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = registrationCode.trim().toUpperCase();

    if (!normalizedCode) {
      setErrorMessage('Введите регистрационный код.');
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/admission/status/${encodeURIComponent(normalizedCode)}`);
      const contentType = res.headers.get('content-type') ?? '';

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Код не найден. Проверьте правильность ввода.');
        }
        throw new Error(`Ошибка сервера (${res.status})`);
      }

      if (!contentType.includes('application/json')) {
        throw new Error('Сервер вернул некорректный формат ответа.');
      }

      const data: IAdmissionStatus = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Ошибка загрузки рейтинга:', err);
      setResult(null);
      setErrorMessage(
        err instanceof Error ? err.message : 'Не удалось получить данные рейтинга. Попробуйте позже.',
      );
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = result
    ? Math.max(1, Math.min(100, ((result.totalApplicants - result.yourPosition + 1) / result.totalApplicants) * 100))
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm space-y-5">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800">Рейтинг абитуриентов</h1>
        <p className="text-slate-500 max-w-3xl">
          Введите регистрационный код, чтобы узнать ваше место в конкурсном списке по выбранной специальности.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <input
            value={registrationCode}
            onChange={(e) => setRegistrationCode(e.target.value)}
            placeholder="Введите ваш регистрационный код (например, НАТК-2026-0001)"
            className="flex-1 rounded-2xl border border-slate-200 px-5 py-4 text-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-blue-600 px-7 py-4 text-white font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Ищем...' : 'Проверить'}
          </button>
        </form>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Регистрационный код</p>
              <p className="text-slate-700 font-extrabold text-xl">{result.registrationCode}</p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Специальность</p>
              <p className="text-slate-700 font-extrabold text-xl">{result.specialtyCode}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-2xl md:text-3xl font-black text-slate-800">
              Ваше место: {result.yourPosition} из {result.totalApplicants}
            </p>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${result.isPassing ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-extrabold ${
              result.isPassing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {result.isPassing ? 'Вы проходите на бюджет' : 'Вне списка зачисления'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
              <p className="text-slate-400 font-semibold">Бюджетных мест</p>
              <p className="text-slate-800 font-black text-lg">{result.budgetPlaces}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
              <p className="text-slate-400 font-semibold">Ваш средний балл</p>
              <p className="text-slate-800 font-black text-lg">{result.score.toFixed(3)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
              <p className="text-slate-400 font-semibold">Оригинал аттестата</p>
              <p className="text-slate-800 font-black text-lg">{result.hasOriginal ? 'Да' : 'Нет'}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm leading-relaxed">
            Внимание! Сейчас система работает в режиме симуляции, так как официальные списки открываются в период
            приемной кампании.
          </div>
        </div>
      )}
    </div>
  );
}
