'use client';

import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Map, 
  ChevronRight, 
  ChevronLeft,
  X,
  History,
  Cpu,
  Building2,
  Users,
  CheckCircle2
} from 'lucide-react';

export default function ApplicantTourModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const hasSeenTour = localStorage.getItem('hasSeenApplicantTour');
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenApplicantTour', 'true');
    setIsOpen(false);
  };

  const tourSteps = [
    {
      title: 'Почти век истории',
      description: 'Новосибирский авиационный технический колледж им. Б.С. Галущака основан в 1929 году. Мы стоим у истоков сибирской авиации и готовим лучших специалистов для высокотехнологичных отраслей.',
      icon: <History className="text-indigo-600" size={32} />,
      image: '/tour/history.jpg',
      imageClassName: 'object-cover'
    },
    {
      title: 'Технологии завтрашнего дня',
      description: 'От 3D-печати и программирования до сборки беспилотников (БАС) и медицинских оптических систем. Учись на современном оборудовании!',
      icon: <Cpu className="text-indigo-600" size={32} />,
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800', // Tech themed
      imageClassName: 'object-cover'
    },
    {
      title: 'Два современных корпуса',
      description: 'Учеба проходит в самом центре города (Красный проспект, 72) и в авиационном сердце Новосибирска (проспект Дзержинского, 26).',
      icon: <Building2 className="text-indigo-600" size={32} />,
      image: '/tour/campus.png',
      imageClassName: 'object-cover'
    },
    {
      title: 'Не только учеба!',
      description: 'Студенческий совет, спортклуб «АВИА», творческий центр «Крылья» и наша легендарная команда КВН «Эффект тапочки». Раскрой свои таланты!',
      icon: <Users className="text-indigo-600" size={32} />,
      image: '/tour/student-life.png',
      imageClassName: 'object-contain bg-slate-50'
    },
    {
      title: 'Готов стать частью команды?',
      description: 'Выбери специальность мечты. А если сомневаешься — пройди наш короткий тест на профориентацию прямо сейчас!',
      icon: <Rocket className="text-indigo-600" size={32} />,
      image: '/tour/test.png',
      imageClassName: 'object-cover'
    }
  ];

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row h-auto md:h-[500px]">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 md:text-slate-400 md:bg-transparent md:hover:bg-slate-100 md:hover:text-slate-600 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* Left Column: Image */}
        <div className="w-full md:w-5/12 relative h-48 md:h-full overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent z-10"></div>
          {tourSteps.map((s, i) => (
            <div 
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${i === step ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}
            >
              <img 
                src={s.image} 
                alt={s.title}
                className={`w-full h-full ${s.imageClassName ?? 'object-cover'}`}
              />
            </div>
          ))}
          <div className="absolute bottom-6 left-6 z-20 hidden md:block">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
              НАТК 1929 — 2026
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="w-full md:w-7/12 flex flex-col p-6 sm:p-8 md:p-12 relative bg-white">
          {/* Slide Indicators Top */}
          <div className="flex gap-1.5 mb-8">
            {tourSteps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'flex-1 bg-indigo-600' : 'flex-1 bg-slate-100'}`}
              />
            ))}
          </div>

          <div className="flex-1 relative overflow-hidden min-h-[240px] sm:min-h-[260px]">
            {tourSteps.map((s, i) => (
              <div 
                key={i}
                className={`transition-all duration-500 absolute inset-0 flex flex-col justify-center transform ${i === step ? 'translate-x-0 opacity-100' : i < step ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-full opacity-0 pointer-events-none'}`}
              >
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h2 className="max-w-[18rem] sm:max-w-md md:max-w-none pr-10 text-[1.75rem] sm:text-3xl md:text-4xl font-black text-slate-800 leading-[1.1] break-words mb-4">
                  {s.title}
                </h2>
                <p className="text-slate-500 text-sm sm:text-base md:text-lg leading-relaxed max-w-md">
                  {s.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              <button 
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className={`p-3 rounded-2xl border-2 border-slate-100 text-slate-400 transition-all ${step === 0 ? 'opacity-0' : 'hover:border-indigo-600 hover:text-indigo-600 active:scale-90'}`}
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex items-center gap-1 md:hidden">
                {tourSteps.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>

            {step < tourSteps.length - 1 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 group"
              >
                Далее
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={handleClose}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 animate-pulse"
              >
                Начать путь
                <CheckCircle2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
