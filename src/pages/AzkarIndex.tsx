import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sun, 
  Moon, 
  Bed, 
  ChevronRight, 
  BookOpen, 
  Flame, 
  Bell, 
  BellOff, 
  Calendar, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Plane,
  Utensils,
  HeartPulse,
  Star,
  Heart,
  AlignJustify,
  Sunrise
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CustomTasbih } from '../components/features/CustomTasbih';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const AzkarIndex: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'custom'>('daily');
  
  // Streak States
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [completionLog, setCompletionLog] = useState<string[]>([]);
  
  // Notification States
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load Streaks and notifications preferences
  useEffect(() => {
    const savedStreak = Number(localStorage.getItem('azkar_streak_count') || '0');
    const savedMax = Number(localStorage.getItem('azkar_max_streak') || '0');
    const savedTotal = Number(localStorage.getItem('azkar_completions_count') || '0');
    const savedLog = JSON.parse(localStorage.getItem('azkar_completion_log') || '[]') as string[];

    setCurrentStreak(savedStreak);
    setMaxStreak(savedMax);
    setTotalCompletions(savedTotal);
    setCompletionLog(savedLog);

    const enabled = localStorage.getItem('azkar_reminders_enabled') === 'true';
    if (enabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else {
        localStorage.setItem('azkar_reminders_enabled', 'false');
      }
    }
  }, []);

  // Request & Toggle Notifications
  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error(isRtl ? 'إشعارات المتصفح غير مدعومة في جهازك' : 'Browser notifications not supported');
      return;
    }

    if (notificationsEnabled) {
      localStorage.setItem('azkar_reminders_enabled', 'false');
      setNotificationsEnabled(false);
      toast.success(isRtl ? 'تم إلغاء التنبيهات' : 'Reminders disabled');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('azkar_reminders_enabled', 'true');
        setNotificationsEnabled(true);
        toast.success(t('azkar.notificationGranted'));
        new Notification(isRtl ? 'صدقة جارية' : 'Sadaka Jariyah', {
          body: isRtl ? 'تم تفعيل منبه الأذكار بنجاح!' : 'Azkar daily reminders successfully configured!',
          icon: '/favicon.ico'
        });
      } else {
        toast.error(t('azkar.notificationDenied'));
      }
    }
  };

  type CategoryId = 'morning' | 'evening' | 'sleep' | 'wakeup' | 'travel' | 'mosque' | 'eating' | 'illness' | 'istikhara' | 'general' | 'prayer';

  interface AzkarCategory {
    type: CategoryId;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    hoverGlow: string;
    isNew?: boolean;
  }

  const primaryCategories: AzkarCategory[] = [
    {
      type: 'morning',
      title: t('azkar.morning'),
      description: t('azkar.morningDesc'),
      icon: <Sun className="w-7 h-7 text-amber-500 animate-spin-slow" />,
      gradient: 'from-amber-500/10 via-teal-500/5 to-transparent border-amber-500/20',
      hoverGlow: 'group-hover:shadow-amber-500/10'
    },
    {
      type: 'evening',
      title: t('azkar.evening'),
      description: t('azkar.eveningDesc'),
      icon: <Moon className="w-7 h-7 text-indigo-400" />,
      gradient: 'from-indigo-500/10 via-teal-500/5 to-transparent border-indigo-500/20',
      hoverGlow: 'group-hover:shadow-indigo-500/10'
    },
    {
      type: 'sleep',
      title: t('azkar.sleep'),
      description: t('azkar.sleepDesc'),
      icon: <Bed className="w-7 h-7 text-emerald-400" />,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20',
      hoverGlow: 'group-hover:shadow-emerald-500/10'
    },
    {
      type: 'wakeup',
      title: isRtl ? 'أذكار الاستيقاظ' : 'Wakeup Azkar',
      description: isRtl ? 'أذكار وأدعية بعد الاستيقاظ من النوم' : 'Duas and remembrances upon waking from sleep',
      icon: <Sunrise className="w-7 h-7 text-orange-400" />,
      gradient: 'from-orange-500/10 via-rose-500/5 to-transparent border-orange-500/20',
      hoverGlow: 'group-hover:shadow-orange-500/10',
      isNew: true
    }
  ];

  const secondaryCategories: AzkarCategory[] = [
    {
      type: 'travel',
      title: isRtl ? 'أذكار السفر' : 'Travel Duas',
      description: isRtl ? 'أدعية التنقل والرحلات والسفر' : 'Duas for travel, journeys, and commuting',
      icon: <Plane className="w-6 h-6 text-sky-500" />,
      gradient: 'from-sky-500/10 to-transparent border-sky-500/20',
      hoverGlow: 'group-hover:shadow-sky-500/10',
      isNew: true
    },
    {
      type: 'mosque',
      title: isRtl ? 'أذكار المسجد' : 'Mosque Duas',
      description: isRtl ? 'أدعية دخول وخروج المسجد' : 'Duas for entering and leaving the mosque',
      icon: <Star className="w-6 h-6 text-teal-500" />,
      gradient: 'from-teal-500/10 to-transparent border-teal-500/20',
      hoverGlow: 'group-hover:shadow-teal-500/10',
      isNew: true
    },
    {
      type: 'eating',
      title: isRtl ? 'أذكار الطعام والشراب' : 'Food & Drink Duas',
      description: isRtl ? 'أدعية قبل وبعد تناول الطعام' : 'Duas before and after eating',
      icon: <Utensils className="w-6 h-6 text-green-500" />,
      gradient: 'from-green-500/10 to-transparent border-green-500/20',
      hoverGlow: 'group-hover:shadow-green-500/10',
      isNew: true
    },
    {
      type: 'illness',
      title: isRtl ? 'أدعية المرض والشفاء' : 'Illness & Healing Duas',
      description: isRtl ? 'أدعية للمريض وطلب الشفاء' : 'Duas for the sick and seeking healing',
      icon: <HeartPulse className="w-6 h-6 text-rose-500" />,
      gradient: 'from-rose-500/10 to-transparent border-rose-500/20',
      hoverGlow: 'group-hover:shadow-rose-500/10',
      isNew: true
    },
    {
      type: 'istikhara',
      title: isRtl ? 'دعاء الاستخارة' : 'Istikhara Dua',
      description: isRtl ? 'دعاء صلاة الاستخارة لطلب الخيرة' : 'Supplication of Istikhara prayer',
      icon: <Heart className="w-6 h-6 text-purple-500" />,
      gradient: 'from-purple-500/10 to-transparent border-purple-500/20',
      hoverGlow: 'group-hover:shadow-purple-500/10',
      isNew: true
    },
    {
      type: 'general',
      title: isRtl ? 'أدعية عامة مأثورة' : 'General Daily Duas',
      description: isRtl ? 'أدعية ومأثورات يومية مختارة' : 'Selected daily supplications and remembrances',
      icon: <AlignJustify className="w-6 h-6 text-amber-600" />,
      gradient: 'from-amber-600/10 to-transparent border-amber-600/20',
      hoverGlow: 'group-hover:shadow-amber-600/10',
      isNew: true
    },
    {
      type: 'prayer',
      title: isRtl ? 'أذكار الوضوء والصلاة' : 'Prayer & Wudhu Azkar',
      description: isRtl ? 'أذكار ما قبل وبعد الصلاة المكتوبة' : 'Remembrances before and after prayer',
      icon: <BookOpen className="w-6 h-6 text-cyan-500" />,
      gradient: 'from-cyan-500/10 to-transparent border-cyan-500/20',
      hoverGlow: 'group-hover:shadow-cyan-500/10',
      isNew: true
    }
  ];

  // Helper to check if a specific day (offset from today) was completed
  const getDayStatus = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dateStr = d.toISOString().split('T')[0];
    return completionLog.includes(dateStr);
  };

  const getWeekdayName = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    return d.toLocaleDateString(i18n.language, options);
  };

  const CategoryCard = ({ cat }: { cat: AzkarCategory }) => (
    <Card
      onClick={() => navigate(`/azkar/${cat.type}`)}
      className={`group cursor-pointer bg-card overflow-hidden border border-border bg-gradient-to-b ${cat.gradient} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cat.hoverGlow} rounded-[28px] relative`}
    >
      {cat.isNew && (
        <span className="absolute top-3 left-3 text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wide shadow">
          {isRtl ? 'جديد' : 'New'}
        </span>
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5">
        <div className="p-2.5 bg-background rounded-2xl border border-border/50 group-hover:scale-110 transition-transform duration-300">
          {cat.icon}
        </div>
        <ChevronRight className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-300 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
      </CardHeader>
      <CardContent className="pt-1 pb-5">
        <CardTitle className="text-base md:text-lg font-bold font-amiri text-foreground mb-1.5 group-hover:text-primary transition-colors leading-tight">
          {cat.title}
        </CardTitle>
        <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">
          {cat.description}
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isRtl ? 'ابدأ الذكر الآن' : 'Start dhikr now'}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 w-full bg-background transition-colors duration-300 py-8 px-4 md:px-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <section className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-amiri font-bold text-xl mx-auto mb-4">
          📿
        </div>
        <h1 className="text-3xl md:text-4xl font-amiri font-bold text-foreground mb-2 leading-relaxed">
          {t('azkar.title')}
        </h1>
        <p className="max-w-xl mx-auto text-xs md:text-sm text-muted-foreground leading-relaxed">
          {isRtl 
            ? 'أذكار وأدعية شاملة مأخوذة من حصن المسلم، ومسبحة ذكية لكل وقت وحال.'
            : 'Comprehensive supplications from Hisn al-Muslim, with a smart Tasbih for every time and circumstance.'}
        </p>
      </section>

      {/* Tab Segment bar */}
      <div className="flex bg-muted/40 p-1 border border-border rounded-full items-center gap-1 w-full max-w-sm mx-auto shrink-0 shadow-sm">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            activeSubTab === 'daily'
              ? 'bg-primary text-white shadow-md font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {isRtl ? 'الأذكار والأدعية' : 'Azkar & Duas'}
        </button>
        <button
          onClick={() => setActiveSubTab('custom')}
          className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            activeSubTab === 'custom'
              ? 'bg-primary text-white shadow-md font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {isRtl ? 'المسبحة الحرة' : 'Free Tasbih'}
        </button>
      </div>

      {/* Content Renderer */}
      {activeSubTab === 'daily' ? (
        <div className="flex flex-col gap-10 animate-fade-in">

          {/* Primary Categories (Morning, Evening, Sleep, Wakeup) */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full block" />
              {isRtl ? 'الأذكار الأساسية اليومية' : 'Core Daily Azkar'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {primaryCategories.map((cat) => (
                <CategoryCard key={cat.type} cat={cat} />
              ))}
            </div>
          </div>

          {/* Secondary Categories (8 new) */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-amber-500 rounded-full block" />
              {isRtl ? 'أذكار وأدعية متنوعة' : 'Situational Duas & Remembrances'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {secondaryCategories.map((cat) => (
                <CategoryCard key={cat.type} cat={cat} />
              ))}
            </div>
          </div>

          {/* Habit Streak Log & Notifications Panels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Streak Tracker Card */}
            <div className="lg:col-span-7 bg-card border border-border rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-1 border-b border-border/60 pb-3 mb-4">
                <h3 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t('azkar.streakTitle')}
                </h3>
                <span className="text-[10px] md:text-xs text-muted-foreground leading-normal">
                  {t('azkar.streakDesc')}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-muted/30 border border-border/40 p-3 rounded-2xl text-center flex flex-col items-center">
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse mb-1" />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase">اليومية</span>
                  <span className="text-lg font-sans font-bold text-foreground">{currentStreak}</span>
                  <span className="text-[9px] text-muted-foreground">{isRtl ? 'يوم' : 'days'}</span>
                </div>
                <div className="bg-muted/30 border border-border/40 p-3 rounded-2xl text-center flex flex-col items-center">
                  <Award className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase">الأفضل</span>
                  <span className="text-lg font-sans font-bold text-foreground">{maxStreak}</span>
                  <span className="text-[9px] text-muted-foreground">{isRtl ? 'يوم' : 'days'}</span>
                </div>
                <div className="bg-muted/30 border border-border/40 p-3 rounded-2xl text-center flex flex-col items-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase">الكلية</span>
                  <span className="text-lg font-sans font-bold text-foreground">{totalCompletions}</span>
                  <span className="text-[9px] text-muted-foreground">{isRtl ? 'مرة' : 'times'}</span>
                </div>
              </div>

              {/* 7-Day Grid */}
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground mb-2.5 uppercase tracking-wider">
                  {isRtl ? 'الأيام السبعة الماضية:' : 'Last 7 Days:'}
                </h4>
                <div className="grid grid-cols-7 gap-1.5">
                  {[6, 5, 4, 3, 2, 1, 0].map((dayOffset) => {
                    const isCompleted = getDayStatus(dayOffset);
                    const dayLabel = getWeekdayName(dayOffset);
                    return (
                      <div 
                        key={dayOffset} 
                        className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                          dayOffset === 0 
                            ? 'border-primary bg-primary/5 shadow-inner' 
                            : 'border-border bg-muted/10'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-muted-foreground mb-1">{dayLabel}</span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground/25" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notifications Panel */}
            <div className="lg:col-span-5 bg-card border border-border rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 border-b border-border/60 pb-3">
                  <h3 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
                    {notificationsEnabled ? (
                      <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
                    ) : (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    {t('azkar.notificationTitle')}
                  </h3>
                  <span className="text-[10px] md:text-xs text-muted-foreground leading-normal">
                    {t('azkar.notificationDesc')}
                  </span>
                </div>

                <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground">
                  {isRtl 
                    ? 'عند تفعيل التنبيهات، سيرسل لك الموقع إشعاراً لتذكيرك بقراءة أذكار الصباح والمساء كعمل تطوعي مبارك لروح الفقيد.'
                    : 'Once activated, your browser will send alerts prompting you to recite Morning and Evening Azkar as an ongoing charity.'}
                </div>
              </div>

              <Button
                onClick={handleToggleNotifications}
                variant={notificationsEnabled ? 'secondary' : 'default'}
                className="w-full h-11 rounded-xl font-bold text-xs md:text-sm mt-6 gap-2"
              >
                {notificationsEnabled ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>{t('azkar.notificationBtnDisable')}</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>{t('azkar.notificationBtnEnable')}</span>
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <CustomTasbih />
        </div>
      )}
    </div>
  );
};
