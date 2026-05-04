import Link from 'next/link';
import React from 'react';
import { 
  ExternalLink, 
  Briefcase, 
  Home, 
  Calendar, 
  Rss, 
  Building2, 
  FolderOpen,
  LogOut
} from 'lucide-react';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { title: 'Главная', icon: Home, href: '/teacher' },
    { title: 'Моё расписание', icon: Calendar, href: '/teacher/schedule' },
    { title: 'Новости колледжа', icon: Rss, href: '/teacher/news' },
    { title: 'Структура и отделы', icon: Building2, href: '/teacher/structure' },
    { title: 'Документы (ПО и стандарты)', icon: FolderOpen, href: '/teacher/documents' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-amber-200">
              Н
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Личный кабинет</h1>
              <p className="text-xs text-slate-400 font-medium">Преподаватель НАТК</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-all font-medium group"
              >
                <IconComponent size={20} className="group-hover:scale-110 transition-transform" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* Moodle Link */}
          <a
            href="https://do.natk.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all font-medium group shadow-lg shadow-amber-200/50"
          >
            <Briefcase size={20} className="group-hover:scale-110 transition-transform" />
            <span className="flex-1">Личный кабинет (Moodle)</span>
            <ExternalLink size={16} className="opacity-70" />
          </a>

          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 rounded-xl transition-all font-medium group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span>Выйти</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-8 md:hidden">
          <div className="bg-amber-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">Н</div>
          <button className="text-slate-600 text-2xl">☰</button>
        </header>
        <div className="p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
