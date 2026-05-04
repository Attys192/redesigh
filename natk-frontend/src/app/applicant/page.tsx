'use client';

import React from 'react';
import Link from 'next/link';
import ApplicantTourModal from '@/components/ApplicantTourModal';
import { 
  Rocket, 
  ClipboardList, 
  GraduationCap, 
  FileText, 
  ListOrdered,
  ArrowRight
} from 'lucide-react';

export default function ApplicantDashboard() {
  const widgets = [
    {
      title: 'Какая специальность твоя?',
      description: 'Пройди тест и узнай, какое направление подходит именно тебе',
      icon: <ClipboardList className="text-orange-500" size={32} />,
      href: '/applicant/test',
      color: 'hover:border-orange-200 hover:bg-orange-50'
    },
    {
      title: 'Специальности',
      description: 'Изучи доступные направления подготовки и бюджетные места',
      icon: <GraduationCap className="text-blue-500" size={32} />,
      href: '/applicant/specialties',
      color: 'hover:border-blue-200 hover:bg-blue-50'
    },
    {
      title: 'Документы',
      description: 'Все, что нужно для подачи заявления в колледж',
      icon: <FileText className="text-indigo-500" size={32} />,
      href: '/applicant/documents',
      color: 'hover:border-indigo-200 hover:bg-indigo-50'
    },
    {
      title: 'Рейтинг поступающих',
      description: 'Списки подавших документы и твои шансы на поступление',
      icon: <ListOrdered className="text-emerald-500" size={32} />,
      href: '/applicant/rating',
      color: 'hover:border-emerald-200 hover:bg-emerald-50'
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <ApplicantTourModal />
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 md:p-16 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-indigo-100 text-sm font-semibold mb-6 border border-white/10">
              <Rocket size={16} />
              <span>Приемная кампания 2026</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1]">
              Поступай в НАТК — <br />
              <span className="text-indigo-200">стань профессионалом!</span>
            </h1>
            <p className="text-indigo-100 text-lg md:text-xl mb-8 font-medium opacity-90">
              Начни свой путь в авиации и IT вместе с ведущим колледжем региона. 
              Современные лаборатории, опытные наставники и яркая студенческая жизнь.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link 
                href="/applicant/test"
                className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
              >
                Начать тест
                <ArrowRight size={20} />
              </Link>
              <Link 
                href="/applicant/specialties"
                className="px-8 py-4 bg-indigo-500/30 text-white border border-indigo-400/30 rounded-2xl font-bold hover:bg-indigo-500/50 transition-all backdrop-blur-sm"
              >
                Все специальности
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:block relative">
            <div className="w-80 h-80 bg-white/10 rounded-full blur-3xl absolute -top-10 -right-10 animate-pulse"></div>
            <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[3rem] shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
               <div className="flex flex-col gap-4">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
                     <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold"># {i}</div>
                     <div className="h-4 w-32 bg-white/20 rounded-full"></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-400 rounded-full blur-[100px] opacity-30"></div>
      </section>

      {/* Widgets Grid */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-bold text-slate-800">Быстрый доступ</h2>
          <span className="text-slate-400 text-sm font-medium">Выберите интересующий раздел</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {widgets.map((widget, index) => (
            <Link 
              key={index}
              href={widget.href}
              className={`group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${widget.color}`}
            >
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl w-fit group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                {widget.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-xl mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                {widget.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                {widget.description}
              </p>
              <div className="flex items-center text-indigo-600 font-bold text-sm gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                Перейти <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
