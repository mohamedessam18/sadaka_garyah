import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Star, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RemembranceStat {
  id: string;
  label: string;
  count: number;
  icon: typeof Flame;
  color: string;
}

export const GlobalRemembrances: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Seeded base values for the collective memorial counters
  const [stats, setStats] = useState<RemembranceStat[]>([
    { id: 'tasbih', label: isRtl ? 'تسبيح وتحميد' : 'Tasbih & Tahmeed', count: 184020, icon: Sparkles, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'salawat', label: isRtl ? 'صلاة على النبي' : 'Salawat', count: 245910, icon: Heart, color: 'text-rose-500 bg-rose-500/10' },
    { id: 'istighfar', label: isRtl ? 'استغفار وتوبة' : 'Istighfar', count: 129480, icon: Star, color: 'text-teal-500 bg-teal-500/10' },
  ]);

  const [activeDhikr, setActiveDhikr] = useState<string>(isRtl ? 'سبحان الله وبحمده' : 'Subhan Allah wa bihamdih');
  const [sessionCount, setSessionCount] = useState<number>(() => {
    return Number(localStorage.getItem('tasbih_session_count') || '0');
  });

  const dhikrPresets = isRtl 
    ? ['سبحان الله وبحمده', 'الحمد لله رب العالمين', 'أستغفر الله العظيم', 'اللهم صلِّ على محمد', 'لا إله إلا الله', 'لا حول ولا قوة إلا بالله']
    : ['Subhan Allah', 'Alhamdulillah', 'Astaghfirullah', 'Allahumma Salli ala Muhammad', 'La ilaha illa Allah', 'La hawla wala quwwata illa billah'];

  // Simulate other visitors making Tasbih globally
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => prev.map(stat => {
        // Increment each counter by a small random number
        const increment = Math.floor(Math.random() * 4) + 1;
        return { ...stat, count: stat.count + increment };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleTasbihClick = () => {
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    
    // Play a subtle digital tap sound if desired (using Web Audio API so no asset file is required)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.log('Audio feedback error', e);
    }

    const nextSessionCount = sessionCount + 1;
    setSessionCount(nextSessionCount);
    localStorage.setItem('tasbih_session_count', String(nextSessionCount));

    // Update the relevant stat locally
    setStats(prev => prev.map(stat => {
      const activeLower = activeDhikr.toLowerCase();
      if (stat.id === 'tasbih' && (activeDhikr.includes('سبحان') || activeDhikr.includes('الحمد') || activeLower.includes('subhan') || activeLower.includes('alhamd'))) {
        return { ...stat, count: stat.count + 1 };
      }
      if (stat.id === 'salawat' && (activeDhikr.includes('محمد') || activeDhikr.includes('صل') || activeLower.includes('salli'))) {
        return { ...stat, count: stat.count + 1 };
      }
      if (stat.id === 'istighfar' && (activeDhikr.includes('أستغفر') || activeDhikr.includes('استغفار') || activeLower.includes('astaghfir'))) {
        return { ...stat, count: stat.count + 1 };
      }
      // Fallback
      return stat.id === 'tasbih' ? { ...stat, count: stat.count + 1 } : stat;
    }));
  };

  const resetSession = () => {
    setSessionCount(0);
    localStorage.setItem('tasbih_session_count', '0');
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Collective Memorial Dashboard */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-center md:text-right">
          <h2 className="text-lg font-bold font-amiri text-foreground flex items-center gap-2 justify-center md:justify-start">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {isRtl ? 'الأثر الجماعي لزوار الموقع' : 'Collective Visitor Remembrances'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isRtl 
              ? 'إجمالي الاستغفار والأذكار المهداة لروح الفقيد محمد السيد رحمه الله من جميع الزوار:' 
              : 'Aggregate counts of remembrances dedicated to the soul of the deceased Mohamed Elsayed:'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.id} className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-sans">{stat.label}</span>
                  <span className="text-2xl font-bold font-mono tracking-wide text-foreground">
                    {stat.count.toLocaleString()}
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Tasbih Counter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left pane: Preset list */}
        <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold font-sans text-foreground px-1">
            {isRtl ? 'اختر الذكر للبدء بالتسبيح' : 'Select remembrance text'}
          </h3>
          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
            {dhikrPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDhikr(preset)}
                className={`w-full text-right md:text-right px-4 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center justify-between ${
                  activeDhikr === preset
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-muted/10 border-border hover:bg-muted/35 text-muted-foreground'
                }`}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <span>{preset}</span>
                {activeDhikr === preset && <Sparkles className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right pane: Glow click counter */}
        <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between min-h-[340px] relative overflow-hidden">
          
          <div className="text-center z-10 w-full">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {isRtl ? 'عداد التسبيح الفردي' : 'Personal Session Tasbih'}
            </span>
            <h4 className="text-lg font-amiri font-bold text-foreground mt-3 h-8 flex items-center justify-center">
              {activeDhikr}
            </h4>
          </div>

          {/* Large Glowing Clicker Button */}
          <div className="relative my-6 z-10">
            <button
              onClick={handleTasbihClick}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex flex-col items-center justify-center shadow-lg transition-all duration-150 active:scale-95 hover:shadow-emerald-500/25 hover:shadow-2xl border-4 border-card outline-none relative group"
            >
              {/* Outer pulse animation */}
              <span className="absolute inset-[-8px] rounded-full border-2 border-emerald-500/35 animate-ping opacity-45 pointer-events-none group-hover:animate-none" />
              
              <span className="text-4xl font-bold font-mono tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                {sessionCount}
              </span>
              <span className="text-[10px] opacity-75 font-sans mt-1 uppercase tracking-wider">
                {isRtl ? 'اضغط هنا' : 'TAP HERE'}
              </span>
            </button>
          </div>

          <div className="z-10 flex gap-4 w-full justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSession}
              disabled={sessionCount === 0}
              className="rounded-full px-5 text-xs text-muted-foreground hover:text-foreground border-border hover:bg-muted/40 h-8"
            >
              {isRtl ? 'إعادة تعيين العداد' : 'Reset Counter'}
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
};
