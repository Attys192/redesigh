'use client';

import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  const selectRole = (role: 'student' | 'applicant' | 'teacher') => {
    localStorage.setItem('user-role', role);
    router.push(`/${role}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Добро пожаловать в НАТК
        </h1>
        <p className="text-blue-100 dark:text-slate-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
          Выберите ваш статус, чтобы мы подготовили для вас подходящий контент и актуальную информацию
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Студент */}
          <button
            onClick={() => selectRole('student')}
            className="group relative bg-white dark:bg-slate-900/85 rounded-3xl p-8 shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-950/40 transition-all duration-300 transform hover:-translate-y-2 border-4 border-transparent hover:border-blue-400 dark:hover:border-blue-500 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-blue-900 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              </svg>
            </div>
            <div className="bg-blue-100 dark:bg-blue-500/15 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Я Студент</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Расписание занятий, новости колледжа, учебные документы и вакансии для практики
            </p>
          </button>

          {/* Абитуриент */}
          <button
            onClick={() => selectRole('applicant')}
            className="group relative bg-white dark:bg-slate-900/85 rounded-3xl p-8 shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-950/40 transition-all duration-300 transform hover:-translate-y-2 border-4 border-transparent hover:border-blue-400 dark:hover:border-blue-500 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-blue-900 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
            </div>
            <div className="bg-blue-100 dark:bg-blue-500/15 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Я Абитуриент</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Информация о специальностях, правилах приема, вступительных испытаниях и жизни колледжа
            </p>
          </button>

          {/* Преподаватель */}
          <button
            onClick={() => selectRole('teacher')}
            className="group relative bg-white dark:bg-slate-900/85 rounded-3xl p-8 shadow-2xl hover:shadow-amber-500/20 dark:hover:shadow-amber-950/40 transition-all duration-300 transform hover:-translate-y-2 border-4 border-transparent hover:border-amber-400 dark:hover:border-amber-500 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-amber-800 dark:text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.06 15.96 0 13.36 0c-1.46 0-2.67.63-3.56 1.62L8 3.5 6.2 1.62C5.31.63 4.1 0 2.64 0 1.04 0 0 1.06 0 2.64c0 .48.11.92.18 1.36H0v2h20V6z" />
              </svg>
            </div>
            <div className="bg-amber-100 dark:bg-amber-500/15 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-amber-700 dark:text-amber-300 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              {/* Briefcase icon */}
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Я Преподаватель</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Своё расписание, новости колледжа, структура отделов и нормативные документы
            </p>
          </button>
        </div>

        <div className="mt-16 text-blue-200/60 dark:text-slate-500 text-sm">
          Новосибирский авиационный технический колледж имени Б.С. Галущака
        </div>
      </div>
    </main>
  );
}
