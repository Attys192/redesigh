'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  ChevronRight,
  GraduationCap,
  Calculator as CalcIcon,
  RotateCcw,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { ISpecialty } from '@/types';
import { SUBJECT_AREAS } from '@/shared/constants';
import { getSpecialties } from '@/lib/api';

export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}

function CalculatorContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  // Состояние для оценок: { [subjectName]: grade | null }
  const [grades, setGrades] = useState<Record<string, number | null>>({});

  // Состояние для данных о специальностях
  const [specialties, setSpecialties] = useState<ISpecialty[]>([]);
  const [selectedSpecialtyCode, setSelectedSpecialtyCode] = useState<string>(initialCode);
  const [loading, setLoading] = useState(true);

  // Состояние для аккордеона (открытые области)
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({
    'rus_lit': true,
    'math_inf': true
  });

  // Получение специальностей с бэкенда
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await Promise.race([
          fetch('http://localhost:3005/api/specialties'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]) as Response;

        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        if (data && data.length > 0) {
          const mappedData: ISpecialty[] = data.map((item: any) => ({
            id: item.id.toString(),
            code: item.code,
            title: item.title,
            campus: item.campus?.address || 'Корпус не указан',
            passingScore: item.passingScore
          }));
          setSpecialties(mappedData);
        } else {
          throw new Error('No data');
        }
      } catch (error) {
        console.error('Calculator fetch error:', error);
        // Резервные моковые данные
        const mockData: ISpecialty[] = [
          { id: '1', code: '09.02.11', title: 'Разработка и управление программным обеспечением', campus: 'Красный проспект, 72', passingScore: 4.65 },
          { id: '2', code: '09.02.01', title: 'Компьютерные системы и комплексы', campus: 'Красный проспект, 72', passingScore: 4.35 },
          { id: '3', code: '25.02.06', title: 'Производство и обслуживание авиационной техники', campus: 'Красный проспект, 72', passingScore: 4.20 },
          { id: '4', code: '25.02.08', title: 'Эксплуатация беспилотных авиационных систем', campus: 'Красный проспект, 72', passingScore: 4.50 },
          { id: '5', code: '31.02.04', title: 'Медицинская оптика', campus: 'Красный проспект, 72', passingScore: 4.40 },
        ];
        setSpecialties(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialties();
  }, []);

  // Алгоритм расчета GPA (п. 5.5 Правил приема)
  const calculateGPA = useMemo(() => {
    let areaAverages: number[] = [];

    SUBJECT_AREAS.forEach(area => {
      const areaGrades = area.subjects
        .map(sub => grades[sub])
        .filter((g): g is number => g !== null && g !== undefined);

      if (areaGrades.length > 0) {
        const areaSum = areaGrades.reduce((sum, g) => sum + g, 0);
        const areaAvg = areaSum / areaGrades.length;
        // Округляем средний балл области до 3-го знака
        areaAverages.push(Number(areaAvg.toFixed(3)));
      }
    });

    if (areaAverages.length === 0) return 0;

    const totalSumOfAverages = areaAverages.reduce((sum, avg) => sum + avg, 0);
    const finalGPA = totalSumOfAverages / areaAverages.length;
    
    // Итоговый балл округляем до 3-х знаков
    return Number(finalGPA.toFixed(3));
  }, [grades]);

  const averageScoreRaw = calculateGPA;
  const averageScore = averageScoreRaw.toFixed(3);

  // Цвет среднего балла
  const getScoreColor = () => {
    if (averageScoreRaw >= 4.5) return 'text-green-600';
    if (averageScoreRaw >= 4.0) return 'text-blue-600';
    if (averageScoreRaw > 0) return 'text-orange-500';
    return 'text-slate-300';
  };

  const handleGradeChange = (subject: string, grade: number | null) => {
    setGrades(prev => ({ ...prev, [subject]: grade }));
  };

  const toggleArea = (areaId: string) => {
    setOpenAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const resetAll = () => {
    setGrades({});
  };

  // Аналитика шансов
  const selectedSpecialty = specialties.find(s => s.code === selectedSpecialtyCode);
  const ps = selectedSpecialty?.passingScore;

  const renderChanceAlert = () => {
    if (!selectedSpecialtyCode || averageScoreRaw === 0) return null;
    if (ps === undefined || ps === null || ps === 0) {
      return (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <Info className="text-slate-400 shrink-0" size={24} />
          <p className="text-slate-600 font-medium text-sm">Нет данных о проходном балле за прошлый год для этой специальности.</p>
        </div>
      );
    }

    const diff = ps - averageScoreRaw;

    if (averageScoreRaw >= ps) {
      return (
        <div className="p-6 bg-green-50 border border-green-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="text-green-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-green-900 mb-1">Отличные шансы!</h4>
            <p className="text-green-700/80 text-sm">Ваш балл выше проходного прошлого года ({ps}). Вы уверенно проходите в топ рейтинга.</p>
          </div>
        </div>
      );
    } else if (diff <= 0.2) {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-yellow-900 mb-1">Шансы есть, но...</h4>
            <p className="text-yellow-700/80 text-sm">Конкурс будет напряженным. Ваш балл близок к проходному ({ps}). Стоит подтянуть оценки!</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <XCircle className="text-red-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-red-900 mb-1">Балл ниже проходного</h4>
            <p className="text-red-700/80 text-sm">Ваш балл заметно ниже проходного ({ps}). Рекомендуем рассмотреть коммерцию или другие специальности.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 px-4 py-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold">
          <CalcIcon size={16} />
          Калькулятор GPA (п. 5.5)
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Расчет шансов на поступление</h1>
        <p className="text-slate-500 text-lg max-w-3xl leading-relaxed">
          В НАТК средний балл считается как среднее арифметическое от средних баллов 11 предметных областей. Введите оценки из аттестата ниже.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Subjects Input */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <BookOpen className="text-indigo-600" size={24} />
                Предметные области
              </h3>
              <button 
                onClick={resetAll}
                className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold transition-colors text-sm"
              >
                <RotateCcw size={16} />
                Сбросить всё
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {SUBJECT_AREAS.map((area) => (
                <div key={area.id} className="group">
                  <button 
                    onClick={() => toggleArea(area.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{area.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">
                        {area.subjects.length} предметов
                      </p>
                    </div>
                    <ChevronDown 
                      className={`text-slate-300 transition-transform duration-300 ${openAreas[area.id] ? 'rotate-180 text-indigo-600' : ''}`} 
                      size={20} 
                    />
                  </button>

                  {openAreas[area.id] && (
                    <div className="p-6 bg-slate-50/30 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {area.subjects.map((subject) => (
                        <div key={subject} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <span className="font-medium text-slate-700">{subject}</span>
                          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
                            {[null, 3, 4, 5].map((grade) => (
                              <button
                                key={String(grade)}
                                onClick={() => handleGradeChange(subject, grade)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                  grades[subject] === grade
                                    ? grade === 5 ? 'bg-green-600 text-white shadow-md' :
                                      grade === 4 ? 'bg-blue-600 text-white shadow-md' :
                                      grade === 3 ? 'bg-orange-500 text-white shadow-md' :
                                      'bg-slate-400 text-white shadow-md'
                                    : 'text-slate-400 hover:bg-white hover:text-slate-600'
                                }`}
                              >
                                {grade === null ? 'Нет' : grade}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Result Widget */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Ваш средний балл</h3>
              <div className={`text-7xl md:text-8xl font-black transition-colors duration-500 tabular-nums ${getScoreColor()}`}>
                {averageScore}
              </div>
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                Рассчитано по методике НАТК (среднее от средних по областям)
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 ml-1">Желаемая специальность</label>
                <div className="relative group">
                  <select 
                    value={selectedSpecialtyCode}
                    onChange={(e) => setSelectedSpecialtyCode(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer group-hover:bg-white group-hover:shadow-sm"
                  >
                    <option value="">Выберите направление...</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.code}>
                        [{s.code}] {s.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>

              {selectedSpecialty && (
                <div className="p-5 bg-indigo-50 rounded-2xl flex items-center justify-between border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <span className="block font-bold text-indigo-900 text-xs">Проходной балл 2025</span>
                      <span className="text-indigo-400 text-[10px] font-medium tracking-tight">Минимальный балл зачисления</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-indigo-600 tabular-nums">{ps?.toFixed(2) || '—'}</span>
                </div>
              )}

              {renderChanceAlert()}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative group">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Оригиналы документов</h4>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Помните, что зачисление происходит только при наличии оригинала аттестата в приемной комиссии.
              </p>
              <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2">
                Сроки подачи
                <ChevronRight size={16} />
              </button>
            </div>
            <CalcIcon className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-white/10 transition-colors" size={160} />
          </div>
        </div>
      </div>
    </div>
  );
}
