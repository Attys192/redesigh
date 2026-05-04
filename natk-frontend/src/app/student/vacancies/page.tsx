'use client';

import { useState, useEffect } from 'react';
import { IVacancy } from '@/types';
import { Briefcase, Building2, Phone, Mail, ExternalLink, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<IVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVacancies, setExpandedVacancies] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const response = await fetch('/api/vacancies');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке вакансий');
        }
        const data = await response.json();
        setVacancies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchVacancies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Вакансии для студентов</h1>
        <p className="text-slate-600 text-lg">
          Актуальные предложения о работе и практике от наших партнеров
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-xl p-3">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{vacancies.length}</div>
            <div className="text-blue-100">активных вакансий</div>
          </div>
        </div>
      </div>

      {/* Vacancies Grid */}
      {vacancies.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-12 text-center">
          <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Вакансий пока нет</h3>
          <p className="text-slate-500">
            Следите за обновлениями - новые вакансии появятся скоро
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.map((vacancy) => {
            const isExpanded = expandedVacancies.has(vacancy.id);
            const cleanContacts = vacancy.company.contacts
              ? vacancy.company.contacts
                  .replace(/document\.getElementById.*?\<\/a\>/g, '')
                  .replace(/;[\s\S]*$/, '')
                  .trim()
              : '';
            const hasLongDescription = Boolean(vacancy.descriptionHtml && vacancy.descriptionHtml.length > 200);

            return (
            <div
              key={vacancy.id}
              className={`bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group flex flex-col self-start ${
                isExpanded ? 'h-auto' : 'h-[27rem]'
              }`}
            >
              {/* Company Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2 group-hover:bg-blue-600 transition-colors">
                    <Building2 size={20} className="text-blue-700 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {vacancy.company.name}
                    </h3>
                    {cleanContacts && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {cleanContacts}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vacancy Title */}
              <h4 className="text-lg font-semibold text-slate-900 mb-3 line-clamp-2">
                {vacancy.title}
              </h4>

              {/* Salary */}
              <div className="mb-4 min-h-8">
                {vacancy.salary && (
                  <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-medium inline-block">
                    {vacancy.salary}
                  </div>
                )}
              </div>

              {/* Description */}
              {vacancy.descriptionHtml && (
                <div className={`mb-4 ${isExpanded ? '' : 'min-h-[6.5rem]'}`}>
                  <div 
                    className={`text-slate-700 text-sm transition-all duration-300 ${
                      isExpanded ? '' : 'line-clamp-3'
                    }`}
                    dangerouslySetInnerHTML={{ __html: vacancy.descriptionHtml }}
                  />
                  {hasLongDescription && (
                    <button
                      onClick={() => {
                        setExpandedVacancies((current) => {
                          const next = new Set(current);
                          if (next.has(vacancy.id)) {
                            next.delete(vacancy.id);
                          } else {
                            next.add(vacancy.id);
                          }
                          return next;
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={16} />
                          Свернуть
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          Подробнее
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Contact Button */}
              <button
                onClick={() => {
                  if (cleanContacts) {
                    navigator.clipboard.writeText(cleanContacts);
                    // Show success feedback
                    const button = event?.target as HTMLButtonElement;
                    const originalText = button.textContent;
                    button.textContent = 'Контакты скопированы!';
                    button.classList.add('bg-green-600', 'text-white');
                    setTimeout(() => {
                      button.textContent = originalText;
                      button.classList.remove('bg-green-600', 'text-white');
                    }, 2000);
                  }
                }}
                className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group"
              >
                <Phone size={18} />
                <span>Связаться</span>
                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
