'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

const TRANSITION_DURATION_MS = 650;

function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = localStorage.getItem('natk-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('natk-theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);
  const [transitionTheme, setTransitionTheme] = useState<ThemeMode | null>(null);

  useEffect(() => {
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTransitionTheme(nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);

    window.setTimeout(() => {
      setTransitionTheme(null);
    }, TRANSITION_DURATION_MS);
  };

  return (
    <>
      {transitionTheme && (
        <div
          aria-hidden="true"
          className={`theme-transition-overlay ${
            transitionTheme === 'dark'
              ? 'theme-transition-overlay-dark'
              : 'theme-transition-overlay-light'
          }`}
        />
      )}

      <button
        type="button"
        onClick={toggleTheme}
        className={`theme-toggle ${mounted ? 'theme-toggle-mounted' : ''}`}
        aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
        title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
      >
        <span className="theme-toggle-track">
          <span className={`theme-toggle-thumb ${theme === 'dark' ? 'theme-toggle-thumb-dark' : ''}`}>
            {theme === 'light' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-white" />
            )}
          </span>
        </span>
      </button>
    </>
  );
}
