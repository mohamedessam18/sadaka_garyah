import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, Home, BookOpen, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutoDhikr } from '../hooks/useAutoDhikr';

const languages = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'id', label: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' }
];

const LANG_LABELS: Record<string, string> = {
  ar: 'عربي',
  en: 'EN',
  id: 'ID',
  es: 'ES'
};

export const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // Initialize Global Auto-Dhikr Reminders
  useAutoDhikr();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('quran-dark-mode') === 'true';
  });

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('quran-dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('quran-dark-mode', 'false');
    }
  }, [darkMode]);

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];
  const isRtl = currentLang.dir === 'rtl';

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Cycle to the next language
  const cycleLanguage = () => {
    const currentIndex = languages.findIndex(lang => lang.code === i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLang = languages[nextIndex];
    i18n.changeLanguage(nextLang.code);
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 font-sans pb-16"
    >
      <div className="grain-overlay" />
      
      {/* Main Outlet Container */}
      <main className="flex-1 flex flex-col relative w-full">
        <Outlet />
      </main>

      {/* Footer (shown above bottom navbar due to pb-16) */}
      <footer className="py-8 border-t border-border bg-card text-card-foreground">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-amiri text-primary font-bold">
            {t('landing.title')} — {t('landing.subtitle')} {t('landing.name')} (رحمه الله)
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
            {t('landing.dua')}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-4 tracking-widest uppercase">
            {t('quran.dedicationShort')}
          </p>
        </div>
      </footer>

      {/* Bottom Sticky Navigation Header */}
      <header className="fixed bottom-0 left-0 right-0 z-40 w-full border-t border-border bg-background/90 backdrop-blur-md shadow-lg h-16 flex items-center justify-center">
        
        {/* Desktop Bottom Bar Layout */}
        <div className="hidden md:flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo / Dedication */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-amiri font-bold text-lg">
                🕌
              </div>
              <span className="font-amiri text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                {t('landing.title')}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="flex items-center gap-8 h-full">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary flex items-center h-full border-t-2 ${
                  isActive ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/azkar"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary flex items-center h-full border-t-2 ${
                  isActive ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'
                }`
              }
            >
              {t('nav.azkar')}
            </NavLink>
            <NavLink
              to="/quran"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary flex items-center h-full border-t-2 ${
                  isActive ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'
                }`
              }
            >
              {t('nav.quran')}
            </NavLink>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Language Switcher (Cycles on click) */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cycleLanguage} 
              className="rounded-full gap-1.5 text-xs h-9 px-4 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Globe className="w-4 h-4" />
              <span>{LANG_LABELS[i18n.language] || 'AR'}</span>
            </Button>

            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full w-9 h-9">
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Sticky Tab Bar Layout */}
        <div className="flex md:hidden w-full h-full items-center justify-around px-2">
          
          {/* Home Tab */}
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 ${
                isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-sans font-medium">{t('nav.home')}</span>
          </NavLink>

          {/* Azkar Tab */}
          <NavLink
            to="/azkar"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 ${
                isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground'
              }`
            }
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-sans font-medium">{t('nav.azkar')}</span>
          </NavLink>

          {/* Quran Tab */}
          <NavLink
            to="/quran"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 ${
                isActive ? 'text-primary font-bold scale-105' : 'text-muted-foreground'
              }`
            }
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-sans font-medium">{t('nav.quran')}</span>
          </NavLink>

          {/* Dark Mode Toggle Tab */}
          <button
            onClick={toggleDarkMode}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-muted-foreground hover:text-primary transition-all duration-200"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            <span className="text-[10px] font-sans font-medium">{t('home.settings') || 'المظهر'}</span>
          </button>

          {/* Language Cycle Toggle Tab */}
          <button
            onClick={cycleLanguage}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-full text-muted-foreground hover:text-primary transition-all duration-200"
          >
            <Globe className="w-5 h-5" />
            <span className="text-[10px] font-sans font-bold">{LANG_LABELS[i18n.language] || 'AR'}</span>
          </button>

        </div>
      </header>
    </div>
  );
};
