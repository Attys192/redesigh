'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Code,
  Cpu,
  GraduationCap,
  Hammer,
  Layout,
  Monitor,
  Plane,
  Printer,
  Radio,
  RotateCcw,
  Settings,
  Stethoscope,
  Telescope,
  Wrench,
  Zap,
  LucideIcon,
} from 'lucide-react';
import { SPECIALTIES } from '@/shared/constants';

type SpecialtyCode =
  | '09.02.01'
  | '09.02.11'
  | '11.02.16'
  | '11.02.17'
  | '12.02.09'
  | '15.02.09'
  | '15.02.16'
  | '15.02.17'
  | '25.02.03'
  | '25.02.06'
  | '25.02.08'
  | '31.02.04';

type ScoreMap = Partial<Record<SpecialtyCode, number>>;

interface TestAnswer {
  text: string;
  icon: keyof typeof ICON_MAP;
  scores: ScoreMap;
}

interface TestQuestion {
  id: number;
  text: string;
  subtitle: string;
  answers: TestAnswer[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Cpu,
  Hammer,
  Layout,
  Monitor,
  Plane,
  Printer,
  Radio,
  Settings,
  Stethoscope,
  Telescope,
  Wrench,
  Zap,
  BookOpen,
};

const ACTIVE_CODES: SpecialtyCode[] = [
  '09.02.01',
  '09.02.11',
  '11.02.16',
  '11.02.17',
  '12.02.09',
  '15.02.09',
  '15.02.16',
  '15.02.17',
  '25.02.03',
  '25.02.06',
  '25.02.08',
  '31.02.04',
];

const QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    text: 'Какая работа кажется тебе самой естественной?',
    subtitle: 'Не выбирай престиж. Выбирай то, что реально хотелось бы делать каждый день.',
    answers: [
      { text: 'Разбираться в компьютерах, сетях и железе', icon: 'Monitor', scores: { '09.02.01': 5, '09.02.11': 2 } },
      { text: 'Писать программы и продумывать логику систем', icon: 'Code', scores: { '09.02.11': 5, '09.02.01': 2 } },
      { text: 'Собирать, настраивать и ремонтировать технику', icon: 'Wrench', scores: { '11.02.16': 4, '15.02.17': 3, '25.02.06': 2 } },
      { text: 'Работать с авиацией, приборами или беспилотниками', icon: 'Plane', scores: { '25.02.06': 4, '25.02.08': 4, '25.02.03': 3 } },
    ],
  },
  {
    id: 2,
    text: 'Что тебе интереснее изучать глубоко?',
    subtitle: 'Этот вопрос помогает отделить IT, электронику, механику, авиацию и оптику.',
    answers: [
      { text: 'Алгоритмы, базы данных, интерфейсы, веб-сервисы', icon: 'Code', scores: { '09.02.11': 5 } },
      { text: 'Архитектуру ПК, операционные системы, сети', icon: 'Monitor', scores: { '09.02.01': 5 } },
      { text: 'Электротехнику, микросхемы, датчики, измерения', icon: 'Cpu', scores: { '11.02.17': 4, '11.02.16': 4, '25.02.03': 2 } },
      { text: 'Оптику, лазеры, линзы, приборы зрения', icon: 'Telescope', scores: { '12.02.09': 4, '31.02.04': 4 } },
    ],
  },
  {
    id: 3,
    text: 'Какой формат задач тебе ближе?',
    subtitle: 'Проектирование, эксплуатация и производство требуют разного мышления.',
    answers: [
      { text: 'Создать новое устройство или систему с нуля', icon: 'Zap', scores: { '11.02.17': 5, '09.02.11': 3, '25.02.08': 2 } },
      { text: 'Найти неисправность и довести технику до нормы', icon: 'Wrench', scores: { '11.02.16': 5, '15.02.17': 4, '25.02.06': 3 } },
      { text: 'Точно изготовить деталь по чертежу или модели', icon: 'Hammer', scores: { '15.02.16': 5, '15.02.09': 3 } },
      { text: 'Настроить сложную систему, чтобы она стабильно работала', icon: 'Settings', scores: { '09.02.01': 3, '25.02.03': 4, '15.02.17': 3 } },
    ],
  },
  {
    id: 4,
    text: 'Что тебе приятнее видеть в результате работы?',
    subtitle: 'Выбирай результат, которым хотелось бы гордиться.',
    answers: [
      { text: 'Рабочее приложение или цифровой сервис', icon: 'Code', scores: { '09.02.11': 5 } },
      { text: 'Стабильную компьютерную сеть или исправный сервер', icon: 'Monitor', scores: { '09.02.01': 5 } },
      { text: 'Готовую металлическую деталь или механизм', icon: 'Hammer', scores: { '15.02.16': 4, '15.02.17': 3 } },
      { text: 'Исправный самолет, дрон или авиационный прибор', icon: 'Plane', scores: { '25.02.06': 4, '25.02.08': 4, '25.02.03': 4 } },
    ],
  },
  {
    id: 5,
    text: 'Как ты относишься к чертежам, схемам и документации?',
    subtitle: 'Во многих технических специальностях без этого никуда.',
    answers: [
      { text: 'Люблю точность, схемы и техническую логику', icon: 'Layout', scores: { '11.02.17': 4, '25.02.03': 4, '15.02.16': 3 } },
      { text: 'Нормально, если документация помогает собрать систему', icon: 'BookOpen', scores: { '09.02.01': 3, '11.02.16': 3, '12.02.09': 3 } },
      { text: 'Предпочитаю код и цифровые модели', icon: 'Code', scores: { '09.02.11': 4, '15.02.09': 3 } },
      { text: 'Лучше практическая работа руками, чем бумаги', icon: 'Wrench', scores: { '15.02.17': 4, '25.02.06': 3, '31.02.04': 2 } },
    ],
  },
  {
    id: 6,
    text: 'Какая среда работы тебе ближе?',
    subtitle: 'Представь реальное рабочее место после колледжа.',
    answers: [
      { text: 'Офис, команда разработки, компьютеры и задачи в трекере', icon: 'Code', scores: { '09.02.11': 5 } },
      { text: 'Лаборатория электроники, приборы, платы, измерения', icon: 'Cpu', scores: { '11.02.17': 5, '11.02.16': 4 } },
      { text: 'Цех, станки, инструменты, промышленное оборудование', icon: 'Settings', scores: { '15.02.16': 4, '15.02.17': 5, '15.02.09': 3 } },
      { text: 'Авиапредприятие, ангар, аэродромная техника', icon: 'Plane', scores: { '25.02.06': 5, '25.02.03': 3 } },
    ],
  },
  {
    id: 7,
    text: 'Какой тип ответственности тебе понятнее?',
    subtitle: 'Ответственность в профессии бывает разной.',
    answers: [
      { text: 'Чтобы данные, программы и сервисы не ломались', icon: 'Code', scores: { '09.02.11': 4, '09.02.01': 3 } },
      { text: 'Чтобы электронная техника работала безопасно', icon: 'Cpu', scores: { '11.02.16': 4, '11.02.17': 3 } },
      { text: 'Чтобы авиационная система не подвела в эксплуатации', icon: 'Plane', scores: { '25.02.06': 4, '25.02.03': 5, '25.02.08': 3 } },
      { text: 'Чтобы человеку правильно подобрали оптику', icon: 'Stethoscope', scores: { '31.02.04': 5 } },
    ],
  },
  {
    id: 8,
    text: 'Что из этого звучит наиболее интересно?',
    subtitle: 'Здесь важна не школьная оценка, а любопытство.',
    answers: [
      { text: 'Программирование, тестирование, управление проектом', icon: 'Code', scores: { '09.02.11': 5 } },
      { text: 'Дискретная математика, сети, архитектура компьютеров', icon: 'Monitor', scores: { '09.02.01': 5 } },
      { text: '3D-моделирование, сканирование, печать деталей', icon: 'Printer', scores: { '15.02.09': 5 } },
      { text: 'Лазеры, тепловизоры, оптико-электронные системы', icon: 'Telescope', scores: { '12.02.09': 5 } },
    ],
  },
  {
    id: 9,
    text: 'Если что-то сломалось, что ты сделаешь первым?',
    subtitle: 'Это показывает твой стиль решения проблем.',
    answers: [
      { text: 'Проверю логи, настройки и программную ошибку', icon: 'Code', scores: { '09.02.11': 4, '09.02.01': 3 } },
      { text: 'Возьму приборы, прозвоню цепи, найду неисправный узел', icon: 'Cpu', scores: { '11.02.16': 5, '11.02.17': 3 } },
      { text: 'Проверю механический износ, крепления и регулировку', icon: 'Wrench', scores: { '15.02.17': 4, '25.02.06': 4 } },
      { text: 'Сравню показания датчиков, навигации и системы управления', icon: 'Layout', scores: { '25.02.03': 5, '25.02.08': 3 } },
    ],
  },
  {
    id: 10,
    text: 'Какая техника тебя сильнее цепляет?',
    subtitle: 'Выбирай без оглядки на сложность.',
    answers: [
      { text: 'Серверы, ПК, локальные сети', icon: 'Monitor', scores: { '09.02.01': 5 } },
      { text: 'Платы, микроконтроллеры, датчики, устройства', icon: 'Cpu', scores: { '11.02.17': 5, '11.02.16': 3 } },
      { text: 'Самолеты, авиационные агрегаты и обслуживание', icon: 'Plane', scores: { '25.02.06': 5 } },
      { text: 'БПЛА, радиоканалы, полетные контроллеры', icon: 'Radio', scores: { '25.02.08': 5 } },
    ],
  },
  {
    id: 11,
    text: 'Что для тебя важнее в работе?',
    subtitle: 'Это помогает различить производство, сервис и разработку.',
    answers: [
      { text: 'Постоянно придумывать и улучшать цифровые решения', icon: 'Code', scores: { '09.02.11': 5 } },
      { text: 'Делать точные физические изделия', icon: 'Hammer', scores: { '15.02.16': 5, '15.02.09': 3 } },
      { text: 'Обслуживать большие промышленные системы', icon: 'Settings', scores: { '15.02.17': 5 } },
      { text: 'Работать на стыке техники и помощи людям', icon: 'Stethoscope', scores: { '31.02.04': 5, '12.02.09': 2 } },
    ],
  },
  {
    id: 12,
    text: 'Какой школьный набор тебе ближе?',
    subtitle: 'Это не экзамен, а индикатор интересов.',
    answers: [
      { text: 'Информатика и математика', icon: 'Code', scores: { '09.02.11': 4, '09.02.01': 4 } },
      { text: 'Физика и технология', icon: 'Zap', scores: { '11.02.17': 4, '11.02.16': 3, '25.02.03': 3 } },
      { text: 'Черчение, труд, инженерная графика', icon: 'Layout', scores: { '15.02.16': 4, '15.02.17': 3, '25.02.06': 3 } },
      { text: 'Биология, физика, точные измерения', icon: 'Stethoscope', scores: { '31.02.04': 4, '12.02.09': 4 } },
    ],
  },
  {
    id: 13,
    text: 'Какой проект ты бы выбрал?',
    subtitle: 'Представь, что тебе дают месяц и наставника.',
    answers: [
      { text: 'Сделать приложение для учета заявлений абитуриентов', icon: 'Code', scores: { '09.02.11': 5 } },
      { text: 'Собрать и настроить компьютерную лабораторию', icon: 'Monitor', scores: { '09.02.01': 5 } },
      { text: 'Напечатать корпус устройства на 3D-принтере', icon: 'Printer', scores: { '15.02.09': 5 } },
      { text: 'Собрать электронный модуль с датчиками', icon: 'Cpu', scores: { '11.02.17': 5 } },
    ],
  },
  {
    id: 14,
    text: 'Какая авиационная тема ближе?',
    subtitle: 'Если авиация не твое, выбери самый терпимый вариант.',
    answers: [
      { text: 'Производство, ремонт и обслуживание авиационной техники', icon: 'Plane', scores: { '25.02.06': 5 } },
      { text: 'Беспилотники, полеты, обслуживание БПЛА', icon: 'Radio', scores: { '25.02.08': 5 } },
      { text: 'Навигационные комплексы, приборы, бортовые системы', icon: 'Layout', scores: { '25.02.03': 5 } },
      { text: 'Автоматизация и программная часть технических систем', icon: 'Code', scores: { '09.02.11': 2, '09.02.01': 2, '11.02.17': 2 } },
    ],
  },
  {
    id: 15,
    text: 'Что бы ты скорее стал изучать после занятий?',
    subtitle: 'Свободный интерес часто честнее школьной программы.',
    answers: [
      { text: 'Фреймворки, языки программирования, базы данных', icon: 'Code', scores: { '09.02.11': 5 } },
      { text: 'Linux, сетевое оборудование, сборка ПК', icon: 'Monitor', scores: { '09.02.01': 5 } },
      { text: 'Пайка, Arduino, схемотехника, измерительные приборы', icon: 'Cpu', scores: { '11.02.17': 4, '11.02.16': 4 } },
      { text: 'CAD, CAM, станки, 3D-печать', icon: 'Printer', scores: { '15.02.09': 4, '15.02.16': 4 } },
    ],
  },
  {
    id: 16,
    text: 'Как ты предпочитаешь работать?',
    subtitle: 'Командность и самостоятельность важны для выбора.',
    answers: [
      { text: 'В команде, где есть роли, задачи и общий продукт', icon: 'Code', scores: { '09.02.11': 4, '25.02.08': 2 } },
      { text: 'Самостоятельно диагностировать конкретную проблему', icon: 'Wrench', scores: { '09.02.01': 3, '11.02.16': 4, '15.02.17': 3 } },
      { text: 'По регламенту, где цена ошибки высокая', icon: 'BookOpen', scores: { '25.02.06': 4, '25.02.03': 4, '31.02.04': 3 } },
      { text: 'Творчески, экспериментируя с материалами и формами', icon: 'Printer', scores: { '15.02.09': 5, '11.02.17': 2 } },
    ],
  },
  {
    id: 17,
    text: 'Что тебе ближе: человек, машина или система?',
    subtitle: 'В технических профессиях фокус сильно отличается.',
    answers: [
      { text: 'Человек: зрение, подбор очков, консультация', icon: 'Stethoscope', scores: { '31.02.04': 5 } },
      { text: 'Машина: детали, узлы, агрегаты, обслуживание', icon: 'Wrench', scores: { '25.02.06': 4, '15.02.17': 4, '15.02.16': 3 } },
      { text: 'Система: сеть, программа, комплекс устройств', icon: 'Settings', scores: { '09.02.01': 3, '09.02.11': 3, '25.02.03': 3 } },
      { text: 'Прибор: оптика, электроника, точные измерения', icon: 'Telescope', scores: { '12.02.09': 5, '11.02.17': 3 } },
    ],
  },
  {
    id: 18,
    text: 'Какой результат теста был бы для тебя самым ожидаемым?',
    subtitle: 'Финальный вопрос усиливает осознанный выбор.',
    answers: [
      { text: 'IT: программирование или компьютерные системы', icon: 'Code', scores: { '09.02.11': 4, '09.02.01': 4 } },
      { text: 'Электроника и приборостроение', icon: 'Cpu', scores: { '11.02.17': 4, '11.02.16': 4, '12.02.09': 2 } },
      { text: 'Авиация и беспилотники', icon: 'Plane', scores: { '25.02.06': 4, '25.02.08': 4, '25.02.03': 4 } },
      { text: 'Производство, станки, 3D-печать и оборудование', icon: 'Settings', scores: { '15.02.16': 4, '15.02.09': 4, '15.02.17': 4 } },
    ],
  },
];

export default function TestPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = QUESTIONS[questionIndex];
  const progress = Math.round((questionIndex / QUESTIONS.length) * 100);

  const results = useMemo(() => {
    const totals: Record<SpecialtyCode, number> = ACTIVE_CODES.reduce(
      (acc, code) => ({ ...acc, [code]: 0 }),
      {} as Record<SpecialtyCode, number>,
    );

    answers.forEach((answer) => {
      Object.entries(answer.scores).forEach(([code, score]) => {
        totals[code as SpecialtyCode] += score ?? 0;
      });
    });

    return ACTIVE_CODES.map((code) => ({
      code,
      title: SPECIALTIES[code]?.title ?? code,
      score: totals[code],
    })).sort((a, b) => b.score - a.score);
  }, [answers]);

  const handleAnswer = (answer: TestAnswer) => {
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);

    if (questionIndex === QUESTIONS.length - 1) {
      setIsFinished(true);
    } else {
      setQuestionIndex((value) => value + 1);
    }
  };

  const goBack = () => {
    if (isFinished) {
      setIsFinished(false);
      return;
    }
    if (questionIndex === 0) return;
    setAnswers((value) => value.slice(0, -1));
    setQuestionIndex((value) => value - 1);
  };

  const resetTest = () => {
    setQuestionIndex(0);
    setAnswers([]);
    setIsFinished(false);
  };

  if (isFinished) {
    const [main, second, third] = results;
    const maxScore = Math.max(main.score, 1);

    return (
      <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-500">
        <div className="rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-8 md:p-10 text-white">
            <p className="text-indigo-200 font-bold uppercase tracking-widest text-sm">Результат профориентации</p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black">{main.code}</h1>
            <p className="mt-2 text-2xl font-bold opacity-95">{main.title}</p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-white p-3 text-indigo-600 shadow-sm">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">Самое сильное совпадение</h2>
                  <p className="mt-1 text-slate-500">
                    Твои ответы чаще совпадали с задачами, средой и предметами этой специальности. Ниже показаны еще
                    два близких варианта, чтобы выбор не был слишком узким.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[main, second, third].map((result, index) => (
                <div key={result.code} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-400">#{index + 1}</p>
                      <p className="text-xl font-black text-slate-800">
                        {result.code} · {result.title}
                      </p>
                    </div>
                    <div className="md:w-64">
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${Math.max(8, (result.score / maxScore) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs font-bold text-slate-400">{result.score} баллов</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href={`/applicant/specialties/${encodeURIComponent(main.code)}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white hover:bg-indigo-700"
              >
                Читать подробнее
                <ChevronRight size={20} />
              </Link>
              <Link
                href={`/applicant/calculator?code=${main.code}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Оценить шансы
              </Link>
              <button
                onClick={resetTest}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-4 font-bold text-slate-600 hover:bg-slate-200"
              >
                <RotateCcw size={20} />
                Пройти заново
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between gap-4">
        <button
          onClick={goBack}
          className={`flex items-center gap-2 font-bold transition-colors ${
            questionIndex === 0 ? 'invisible text-slate-300' : 'text-slate-400 hover:text-indigo-600'
          }`}
        >
          <ArrowLeft size={20} />
          Назад
        </button>
        <div className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-500">
          Вопрос {questionIndex + 1} из {QUESTIONS.length}
        </div>
      </div>

      <div className="mb-10">
        <div className="mb-6 h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-slate-800">{currentQuestion.text}</h1>
          <p className="mt-4 text-lg text-slate-500">{currentQuestion.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentQuestion.answers.map((answer) => {
          const Icon = ICON_MAP[answer.icon] ?? Code;

          return (
            <button
              key={answer.text}
              onClick={() => handleAnswer(answer)}
              className="group flex min-h-32 items-center gap-5 rounded-3xl border-2 border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:border-indigo-500 hover:shadow-lg"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-blue-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                <Icon size={32} />
              </span>
              <span className="flex-1 text-lg font-black leading-snug text-slate-800 group-hover:text-indigo-600">
                {answer.text}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-100 group-hover:border-indigo-600 group-hover:bg-indigo-600">
                <ChevronRight size={20} className="text-slate-300 group-hover:text-white" />
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-slate-400">
        Тест не заменяет консультацию приемной комиссии, но помогает сузить выбор по интересам, задачам и рабочей среде.
      </p>
    </div>
  );
}
