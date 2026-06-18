import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'id', label: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' }
];

export const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('quran-dark-mode') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setMobileMenuOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 font-sans">
      <div className="grain-overlay" />
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo / Dedication */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-amiri font-bold text-lg">
                🕌
              </div>
              <span className="font-amiri text-lg md:text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                {t('landing.title')}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/azkar"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                }`
              }
            >
              {t('nav.azkar')}
            </NavLink>
            <NavLink
              to="/quran"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                }`
              }
            >
              {t('nav.quran')}
            </NavLink>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs">
                  <Globe className="w-4 h-4" />
                  {currentLang.label}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="bg-popover border-border">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`cursor-pointer justify-between ${
                      i18n.language === lang.code ? 'text-primary font-semibold' : ''
                    }`}
                  >
                    <span>{lang.label}</span>
                    {lang.code === 'ar' && <span className="text-xs text-muted-foreground">عربي</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme Toggle for Mobile */}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-lg pt-20 px-6 animate-fade-in">
          <div className="flex flex-col gap-6 text-center text-lg">
            <NavLink
              to="/home"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `py-2 font-medium transition-colors ${isActive ? 'text-primary border-b-2 border-primary self-center px-4' : 'text-muted-foreground'}`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/azkar"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `py-2 font-medium transition-colors ${isActive ? 'text-primary border-b-2 border-primary self-center px-4' : 'text-muted-foreground'}`
              }
            >
              {t('nav.azkar')}
            </NavLink>
            <NavLink
              to="/quran"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `py-2 font-medium transition-colors ${isActive ? 'text-primary border-b-2 border-primary self-center px-4' : 'text-muted-foreground'}`
              }
            >
              {t('nav.quran')}
            </NavLink>
            
            <div className="border-t border-border my-4" />

            <p className="text-sm text-muted-foreground mb-1">{t('nav.language')}</p>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={i18n.language === lang.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLanguageChange(lang.code)}
                  className="rounded-xl"
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Outlet Container */}
      <main className="flex-1 flex flex-col relative w-full">
        <Outlet />
      </main>

      {/* Footer */}
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
    </div>
  );
};
