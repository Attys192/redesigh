import Link from 'next/link';
import React from 'react';
import { 
  Home, 
  ClipboardList, 
  GraduationCap, 
  FileText, 
  ListOrdered,
  BarChart3,
  LogOut,
  Menu
} from 'lucide-react';

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { title: 'Главная', icon: <Home size={20} />, href: '/applicant' },
    { title: 'Тест: Какая специальность твоя?', icon: <ClipboardList size={20} />, href: '/applicant/test' },
    { title: 'Специальности', icon: <GraduationCap size={20} />, href: '/applicant/specialties' },
    { title: 'Конкурс и заявления', icon: <BarChart3 size={20} />, href: '/applicant/admission' },
    { title: 'Документы для поступления', icon: <FileText size={20} />, href: '/applicant/documents' },
    { title: 'Списки поступающих (Рейтинг)', icon: <ListOrdered size={20} />, href: '/applicant/rating' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
              Н
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Абитуриент</h1>
              <p className="text-xs text-slate-400 font-medium">Твой старт в НАТК</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
              <span className="text-sm">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Вернуться назад</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-6 md:hidden">
           <div className="flex items-center gap-2">
             <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">Н</div>
             <span className="font-bold text-slate-800">Абитуриент</span>
           </div>
           <button className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
             <Menu size={24} />
           </button>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
