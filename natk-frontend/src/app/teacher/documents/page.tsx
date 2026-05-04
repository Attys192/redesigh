'use client';

import React, { useEffect, useState } from 'react';
import { IDocument } from '@/types';

const CATEGORY_MAP: Record<string, string> = {
  'GENERAL': 'Общие документы',
  'PAID_EDU': 'Платные образовательные услуги',
  'STANDARDS': 'Образовательные стандарты',
  'GRANTS': 'Стипендии и меры поддержки',
  'ADMISSION': 'Документы для поступления',
};

export default function TeacherDocumentsPage() {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005'}/api/documents`)
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка сети');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка загрузки документов:', err);
        setLoading(false);
      });
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || doc.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(documents.map(d => d.category.name)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gradient-to-r from-amber-500 to-orange-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-amber-200 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-4 text-white">Документы</h1>
          <p className="text-amber-100 text-lg max-w-2xl leading-relaxed">
            Официальные документы колледжа, локальные акты, стандарты и информация о платных услугах.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-amber-300/20 rounded-full blur-2xl"></div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="w-full">
          <input
            type="text"
            placeholder="Поиск по названию документа..."
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all text-slate-700 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {CATEGORY_MAP[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <a
            key={doc.id}
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </div>
              <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                {doc.fileUrl.split('.').pop()?.toUpperCase() || 'DOC'}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-slate-800 font-bold leading-snug group-hover:text-amber-600 transition-colors line-clamp-3">
                {doc.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {CATEGORY_MAP[doc.category.name] || doc.category.name}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-amber-600 font-bold text-sm">
              <span>Открыть файл</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </a>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <h3 className="text-xl font-bold text-slate-400">Документы не найдены</h3>
          <p className="text-slate-400 mt-2">Попробуйте изменить параметры поиска или фильтры</p>
        </div>
      )}
    </div>
  );
}
