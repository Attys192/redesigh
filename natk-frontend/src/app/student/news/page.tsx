'use client';

import React, { useEffect, useState } from 'react';
import { INews } from '@/types';

export default function NewsPage() {
  const [news, setNews] = useState<INews[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<INews | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3005/api/news')
      .then((res) => res.json())
      .then((data) => {
        setNews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка загрузки новостей:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedNews) {
      return;
    }

    const { documentElement, body } = document;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [selectedNews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Новости колледжа</h1>
          <p className="text-slate-500 mt-2">Будьте в курсе последних событий НАТК</p>
        </div>
        <div className="text-sm text-slate-400 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
          Всего новостей: {news.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setSelectedNews(item);
              setSelectedImageIndex(null);
            }}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col"
          >
            {/* Image Container */}
            <div className="relative h-52 overflow-hidden bg-slate-200">
              {item.mainImageUrl ? (
                <img
                  src={item.mainImageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  НОВОСТЬ
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center text-xs text-slate-400 mb-3 font-medium">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {item.publishedDate ? new Date(item.publishedDate).toLocaleDateString('ru-RU') : 'Дата не указана'}
              </div>
              <h3 className="text-xl font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-4">
                {item.title}
              </h3>
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center text-blue-600 font-bold text-sm">
                Подробнее
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            {selectedNews.mainImageUrl && (
              <div className="relative h-64 md:h-80 shrink-0">
                <img
                  src={selectedNews.mainImageUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
                <button
                  onClick={() => {
                    setSelectedNews(null);
                    setSelectedImageIndex(null);
                  }}
                  className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="p-8 overflow-y-auto">
              {!selectedNews.mainImageUrl && (
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedNews(null);
                      setSelectedImageIndex(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex items-center text-sm text-blue-600 font-bold mb-4 uppercase tracking-wider">
                {selectedNews.publishedDate ? new Date(selectedNews.publishedDate).toLocaleDateString('ru-RU') : ''}
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-6 leading-tight">
                {selectedNews.title}
              </h2>
              <div 
                className="prose prose-slate max-w-none text-slate-600 leading-relaxed [&_:empty]:hidden [&_p]:my-3 [&_br+br]:hidden"
                dangerouslySetInnerHTML={{ __html: selectedNews.contentHtml || 'Текст новости отсутствует' }}
              />
              
              {selectedNews.images && selectedNews.images.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                        <circle cx="9" cy="9" r="2"></circle>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                      </svg>
                    </span>
                    Галерея изображений
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedNews.images.map((img, index) => (
                      <img
                        key={img.id}
                        src={img.imageUrl}
                        onClick={() => setSelectedImageIndex(index)}
                        className="rounded-2xl h-40 w-full object-cover hover:scale-[1.02] transition-transform cursor-pointer shadow-sm"
                        alt="Галерея"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedImageIndex !== null && selectedNews.images?.[selectedImageIndex] && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4"
              onClick={() => setSelectedImageIndex(null)}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedImageIndex(null);
                }}
                className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-slate-950/85"
                aria-label="Закрыть изображение"
              >
                <span>Закрыть</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {selectedNews.images!.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedImageIndex((current) =>
                      current === null ? 0 : (current - 1 + selectedNews.images!.length) % selectedNews.images!.length
                    );
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-colors hover:bg-white/20"
                  aria-label="Предыдущее изображение"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}

              <div className="max-h-[88vh] max-w-6xl" onClick={(event) => event.stopPropagation()}>
                <img
                  src={selectedNews.images![selectedImageIndex].imageUrl}
                  alt="Галерея"
                  className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
                {selectedNews.images!.length > 1 && (
                  <div className="mt-4 text-center text-sm font-bold text-white/70">
                    {selectedImageIndex + 1} / {selectedNews.images!.length}
                  </div>
                )}
              </div>

              {selectedNews.images!.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedImageIndex((current) =>
                      current === null ? 0 : (current + 1) % selectedNews.images!.length
                    );
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-colors hover:bg-white/20"
                  aria-label="Следующее изображение"
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
