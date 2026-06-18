import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { azkarService } from '../services/azkarService';
import type { DhikrItem } from '../services/azkarService';
import { toast } from 'sonner';

export const AzkarFocus: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [items, setItems] = useState<DhikrItem[]>([]);
  const [currentCounts, setCurrentCounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Azkar
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await azkarService.getAzkar();
        const categoryItems = data[type as 'morning' | 'evening' | 'sleep'] || [];
        setItems(categoryItems);
        setCurrentCounts(categoryItems.map(item => item.count));
      } catch (error) {
        console.error('Error loading Azkar:', error);
        toast.error('حدث خطأ أثناء تحميل الأذكار');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [type]);

  const handleDecrement = (index: number) => {
    if (currentCounts[index] > 0) {
      const updated = [...currentCounts];
      updated[index] -= 1;
      setCurrentCounts(updated);
      
      // Play a subtle click sound using web audio API for standard feedback
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(updated[index] === 0 ? 800 : 600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // audio context blocked or not supported
      }

      if (updated[index] === 0) {
        toast.success(isRtl ? 'اكتمل الذكر' : 'Dhikr completed', { duration: 1500 });
      }
    }
  };

  const handleReset = () => {
    setCurrentCounts(items.map(item => item.count));
    toast.success(isRtl ? 'تمت إعادة تعيين الأذكار' : 'Dhikr counters reset');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground text-sm arabic-ui">{isRtl ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  // Calculate progress metrics
  const completedCount = currentCounts.filter(c => c === 0).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isFinished = totalCount > 0 && completedCount === totalCount;

  // Title for display
  const pageTitle = type === 'morning' 
    ? t('azkar.morning') 
    : type === 'evening' 
    ? t('azkar.evening') 
    : t('azkar.sleep');

  return (
    <div className="flex-1 w-full bg-background pb-20 relative">
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/azkar')}
              className="rounded-full gap-1 px-3 text-xs md:text-sm"
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              {t('azkar.back')}
            </Button>

            {/* Title */}
            <h2 className="font-amiri font-bold text-lg md:text-xl text-primary">
              {pageTitle}
            </h2>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="rounded-full gap-1 text-xs px-3"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('azkar.reset')}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 mt-1">
            <Progress value={progressPercent} className="h-2 flex-1 bg-muted accent-primary" />
            <span className="text-xs font-semibold font-mono text-muted-foreground whitespace-nowrap">
              {completedCount} / {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main focused reading section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {isFinished ? (
          <div className="text-center py-16 px-6 bg-card border border-primary/20 rounded-[2rem] card-shadow animate-fade-in my-8">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold font-amiri text-primary mb-2">
              {t('azkar.congratulations')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mt-4">
              {isRtl 
                ? '«اللهم أعني على ذكرك وشكرك وحسن عبادتك»'
                : '“O Allah, help me to remember You, give thanks to You, and worship You in the best way.”'}
            </p>
            <Button
              onClick={() => navigate('/azkar')}
              className="btn-pill bg-primary hover:bg-primary/95 text-white mt-8 rounded-full"
            >
              {isRtl ? 'العودة للأذكار' : 'Back to Azkar Index'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, index) => {
              const currentVal = currentCounts[index];
              const isDone = currentVal === 0;

              return (
                <div
                  key={index}
                  onClick={() => !isDone && handleDecrement(index)}
                  className={`group relative p-6 md:p-8 bg-card border transition-all duration-300 rounded-[2rem] shadow-sm select-none ${
                    isDone
                      ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                      : 'border-border hover:border-primary/30 hover:shadow-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
                  }`}
                >
                  {/* Top corner count badge */}
                  <div className="absolute top-4 right-4 left-4 flex justify-between items-center pointer-events-none">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground/50">
                      {isRtl ? 'الذكر' : 'Dhikr'} {index + 1}
                    </span>
                    <span className={`text-xs font-bold font-mono px-2 py-1 rounded-full ${
                      isDone ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'
                    }`}>
                      {isDone ? t('azkar.done').toUpperCase() : `${currentVal} / ${item.count}`}
                    </span>
                  </div>

                  {/* Dhikr Arabic Text */}
                  <div className="my-8 text-center">
                    <p className={`font-amiri text-lg md:text-xl lg:text-2xl text-foreground leading-[2.1] font-medium break-words`}>
                      {item.text}
                    </p>
                  </div>

                  {/* Benefit / Description */}
                  {item.description && (
                    <div className="border-t border-border/40 pt-4 text-center">
                      <p className="text-xs md:text-sm text-muted-foreground arabic-ui italic leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* Counter decrementor trigger visual helper */}
                  {!isDone && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-10 h-10 rounded-full bg-primary/5 group-hover:bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm transition-all duration-200">
                        {currentVal}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
