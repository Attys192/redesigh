'use client';

import React from 'react';
import { Clock3, History, Mail, MapPin, Phone, User } from 'lucide-react';
import collegeInfo from '@/data/college-info.json';

export default function AboutCollegePage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Сведения об образовательной организации
          </h1>
          <p className="text-blue-100 text-lg max-w-3xl opacity-90 leading-relaxed">
            Полная и актуальная информация о ГБПОУ НСО «НАТК им. Б.С. Галущака» в соответствии с государственными стандартами.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <span className="bg-blue-600 w-2 h-8 rounded-full"></span>
              Общая информация
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Полное наименование</h3>
                <p className="text-slate-800 font-bold leading-relaxed text-lg">{collegeInfo.general.fullName}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Дата создания</h3>
                  <p className="text-slate-800 font-semibold">{collegeInfo.general.dateOfCreation}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Сайт</h3>
                  <a
                    href={`https://${collegeInfo.general.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {collegeInfo.general.website}
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Юридический адрес</h3>
                <p className="text-slate-800 font-medium">{collegeInfo.general.address}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <span className="bg-blue-600 w-2 h-8 rounded-full"></span>
              Учредители
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {collegeInfo.founders.map((founder, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                  <h3 className="font-black text-slate-800 mb-2">{founder.name}</h3>
                  <p className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <User size={16} className="shrink-0 text-blue-600" />
                    <span>{founder.head}</span>
                  </p>
                  <div className="grid gap-4 text-xs md:grid-cols-2">
                    <p className="flex items-start gap-2 text-slate-500">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-blue-600" />
                      <span>{founder.address}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-500">
                      <Phone size={14} className="shrink-0 text-blue-600" />
                      <span>{founder.phone}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <span className="bg-blue-600 w-2 h-8 rounded-full"></span>
              Места обучения
            </h2>
            <ul className="space-y-4">
              {collegeInfo.educationalLocations.map((loc, idx) => (
                <li key={idx} className="flex gap-4 items-start text-slate-700">
                  <span className="text-blue-600 font-black">0{idx + 1}.</span>
                  <span className="font-medium leading-relaxed">{loc}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 sticky top-8">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Phone size={20} className="shrink-0 text-blue-600" />
              Контакты
            </h2>
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Приемная</h3>
                <p className="text-blue-900 font-black text-lg">{collegeInfo.general.contactPhone}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</h3>
                <p className="flex items-center gap-2 font-bold text-slate-800">
                  <Mail size={16} className="shrink-0 text-blue-600" />
                  <span>{collegeInfo.general.email}</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Режим работы</h3>
                <p className="flex items-start gap-2 text-sm font-medium leading-relaxed text-slate-800">
                  <Clock3 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>{collegeInfo.general.workingHours}</span>
                </p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <History size={20} className="shrink-0 text-blue-600" />
                История
              </h2>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Правопредшественники</h3>
                {collegeInfo.predecessors.map((p, idx) => (
                  <p key={idx} className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
              {collegeInfo.additionalInfo}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
