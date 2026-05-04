'use client';

import { useState, useEffect, useMemo } from 'react';
import { IStaff } from '@/types';
import { Search, User, Award, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';
import StaffAvatar from '@/components/StaffAvatar';

export default function StaffPage() {
  const [staff, setStaff] = useState<IStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch('/api/staff');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке преподавателей');
        }
        const data = await response.json();
        setStaff(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  // Filter staff based on search term
  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staff;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return staff.filter(person => 
      person.fullName.toLowerCase().includes(lowerSearchTerm)
    );
  }, [staff, searchTerm]);

  const cleanTextPreview = (value: string) => {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/\.(jpg|jpeg|png|gif|webp)\S*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const visibleAchievements = (person: IStaff) => {
    return (person.achievements ?? []).filter((achievement) => {
      const value = achievement.trim();
      return value && !/^https?:\/\//i.test(value) && !/\.(jpg|jpeg|png|gif|webp)/i.test(value);
    });
  };

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Преподаватели</h1>
        <p className="text-slate-600 text-lg">
          Наш коллектив преподавателей и сотрудников
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-xl p-3">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{staff.length}</div>
            <div className="text-blue-100">преподавателей и сотрудников</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Поиск по ФИО..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-slate-500">
            Найдено: {filteredStaff.length} человек
          </div>
        )}
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-12 text-center">
          <User size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {searchTerm ? 'Преподаватели не найдены' : 'Преподаватели пока не добавлены'}
          </h3>
          <p className="text-slate-500">
            {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Следите за обновлениями'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((person) => {
            const achievements = visibleAchievements(person);
            const bioPreview = person.bioHtml ? cleanTextPreview(person.bioHtml) : '';

            return (
            <Link
              key={person.id}
              href={`/student/staff/${person.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group block"
            >
              {/* Person Header */}
              <div className="flex items-start gap-4">
                {/* Photo */}
                <div className="relative">
                  <StaffAvatar
                    name={person.fullName}
                    src={person.photoUrl}
                    className="h-24 w-24 rounded-xl"
                  />
                  {person.role === 'CHIEF' && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1">
                      <Award size={12} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-tight text-slate-900 group-hover:text-blue-600 transition-colors break-words">
                    {person.fullName}
                  </h3>
                  <div className="text-sm text-slate-600 mb-2">
                    {person.positions.map(pos => pos.positionName).join(', ')}
                  </div>
                  {achievements.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {achievements.slice(0, 2).map((achievement, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                        >
                          {achievement}
                        </span>
                      ))}
                      {achievements.length > 2 && (
                        <span className="inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                          +{achievements.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio Preview */}
              {bioPreview && (
                <div className="mt-4 text-sm text-slate-600 line-clamp-2">
                  {bioPreview.substring(0, 150)}...
                </div>
              )}

              {/* Link Indicator */}
              <div className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Перейти в профиль</span>
                <ChevronRight size={16} className="ml-1" />
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
