import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Image, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';
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

  // Focus Mode
  const [focusMode, setFocusMode] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  // Audio Player States
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Streak Completion States
  const [loggedCompletion, setLoggedCompletion] = useState(false);

  // Fetch Azkar
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await azkarService.getAzkar();
        type AzkarKey = 'morning' | 'evening' | 'sleep' | 'wakeup' | 'travel' | 'mosque' | 'eating' | 'illness' | 'istikhara' | 'general' | 'prayer';
        const categoryItems = data[type as AzkarKey] || [];
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

  // Set audio URL based on category type
  useEffect(() => {
    let url = '';
    if (type === 'morning') {
      url = 'https://archive.org/download/AZKAR_MICHARY/sabah_for_mobile.mp3';
    } else if (type === 'evening') {
      url = 'https://archive.org/download/AZKAR_MICHARY/masaa_for_mobile.mp3';
    } else if (type === 'sleep') {
      url = 'https://archive.org/download/TvQuran.com__Athkar/TvQuran.com_athkar_11.mp3';
    }
    // Other categories don't have dedicated audio yet
    setAudioUrl(url);

    // Reset audio states
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [type]);

  // Audio Handlers
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Audio play error:', err);
          toast.error(isRtl ? 'تعذر تشغيل الصوت' : 'Could not play audio');
        });
    }
  };

  const handleSpeedChange = () => {
    const nextRate = playbackRate === 1.0 ? 1.2 : playbackRate === 1.2 ? 0.8 : 1.0;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAudioCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatAudioTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDecrement = (index: number) => {
    if (currentCounts[index] > 0) {
      const updated = [...currentCounts];
      const nextVal = updated[index] - 1;
      updated[index] = nextVal;
      setCurrentCounts(updated);
      
      // Play a tactile click sound using web audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(nextVal === 0 ? 800 : 580, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.12);
        oscillator.stop(audioCtx.currentTime + 0.12);
      } catch (e) {
        // audio context blocked
      }

      if (nextVal === 0) {
        toast.success(isRtl ? 'اكتمل الذكر' : 'Dhikr completed', { duration: 1200 });
      }
    }
  };

  const handleReset = () => {
    setCurrentCounts(items.map(item => item.count));
    setFocusIndex(0);
    setLoggedCompletion(false);
    toast.success(isRtl ? 'تمت إعادة تعيين الأذكار' : 'Dhikr counters reset');
  };

  // Navigates to card designer pre-filled with text
  const handleDesignCard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/home', { 
      state: { 
        presetDhikr: text 
      } 
    });
  };

  // Focus Mode click to count down
  const handleFocusModeTap = () => {
    const isDone = currentCounts[focusIndex] === 0;
    if (!isDone) {
      handleDecrement(focusIndex);
      // Auto advance
      if (currentCounts[focusIndex] - 1 === 0) {
        setTimeout(() => {
          if (focusIndex < items.length - 1) {
            setFocusIndex(prev => prev + 1);
          }
        }, 1000);
      }
    }
  };

  // Calculate progress metrics
  const completedCount = currentCounts.filter(c => c === 0).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isFinished = totalCount > 0 && completedCount === totalCount;

  // Streak Completion Recorder Logger
  useEffect(() => {
    if (isFinished && !loggedCompletion && totalCount > 0) {
      setLoggedCompletion(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const savedLog = JSON.parse(localStorage.getItem('azkar_completion_log') || '[]') as string[];
      
      if (!savedLog.includes(todayStr)) {
        const newLog = [todayStr, ...savedLog];
        localStorage.setItem('azkar_completion_log', JSON.stringify(newLog));

        // Calculate streaks
        const prevStreak = Number(localStorage.getItem('azkar_streak_count') || '0');
        let nextStreak = prevStreak + 1;

        // Check if yesterday was completed to keep the streak going
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (prevStreak > 0 && !savedLog.includes(yesterdayStr)) {
          // Streak was broken, reset to 1
          nextStreak = 1;
        }

        localStorage.setItem('azkar_streak_count', String(nextStreak));

        // Update Max Streak
        const prevMax = Number(localStorage.getItem('azkar_max_streak') || '0');
        if (nextStreak > prevMax) {
          localStorage.setItem('azkar_max_streak', String(nextStreak));
        }

        // Update Total Completions
        const prevTotal = Number(localStorage.getItem('azkar_completions_count') || '0');
        localStorage.setItem('azkar_completions_count', String(prevTotal + 1));
        
        toast.success(isRtl 
          ? `تقبل الله! تم إكمال الورد اليومي وتسجيل الالتزام لليوم (${nextStreak} يوم متتالي)`
          : `Acceptance from Allah! Today's commitment recorded (${nextStreak} days streak)`
        );
      }
    }
  }, [isFinished, loggedCompletion, totalCount, isRtl]);

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

  // Title for display
  const categoryTitles: Record<string, string> = {
    morning: t('azkar.morning'),
    evening: t('azkar.evening'),
    sleep: t('azkar.sleep'),
    wakeup: isRtl ? 'أذكار الاستيقاظ' : 'Wakeup Azkar',
    travel: isRtl ? 'أذكار السفر' : 'Travel Duas',
    mosque: isRtl ? 'أذكار المسجد' : 'Mosque Duas',
    eating: isRtl ? 'أذكار الطعام والشراب' : 'Food & Drink Duas',
    illness: isRtl ? 'أدعية المرض والشفاء' : 'Illness & Healing Duas',
    istikhara: isRtl ? 'دعاء الاستخارة' : 'Istikhara Dua',
    general: isRtl ? 'أدعية عامة مأثورة' : 'General Daily Duas',
    prayer: isRtl ? 'أذكار الوضوء والصلاة' : 'Prayer & Wudhu Azkar'
  };
  const pageTitle = categoryTitles[type ?? ''] ?? (isRtl ? 'الأذكار' : 'Azkar');

  return (
    <div className="flex-1 w-full bg-background pb-20 relative flex flex-col items-center">
      {/* HTML5 Audio Tag */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          muted={audioMuted}
          className="hidden"
        />
      )}

      {/* Sticky Header */}
      <div className="sticky top-16 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Pause audio on leave
                if (audioRef.current) audioRef.current.pause();
                navigate('/azkar');
              }}
              className="rounded-full gap-1 px-3 text-xs md:text-sm h-8"
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              {t('azkar.back')}
            </Button>

            {/* Title */}
            <h2 className="font-amiri font-bold text-base md:text-lg text-primary">
              {pageTitle}
            </h2>

            {/* Config controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant={focusMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="rounded-full gap-1 text-[10px] h-8 px-2.5"
              >
                {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{t('azkar.focusMode')}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="rounded-full gap-1 text-[10px] h-8 px-2.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('azkar.reset')}</span>
              </Button>
            </div>
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

      {/* Full-Length Recitation Audio Player Row */}
      {audioUrl && (
        <div className="w-full max-w-xl mx-auto px-4 mt-6 animate-fade-in">
          <div className="bg-card border border-border/80 shadow-sm rounded-3xl p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={togglePlayAudio}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors text-white ${
                  isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/95'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-foreground font-amiri leading-tight">
                  {t('azkar.audioTitle')}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {t('azkar.audioTitle') ? 'Mishary Alafasy audio recitation' : ''}
                </span>
              </div>
            </div>

            {/* Seek Timeline */}
            <div className="flex-1 flex items-center gap-2 w-full">
              <span className="text-[10px] font-mono text-muted-foreground">{formatAudioTime(audioCurrentTime)}</span>
              <input
                type="range"
                min={0}
                max={audioDuration || 100}
                value={audioCurrentTime}
                onChange={handleAudioSeek}
                className="w-full accent-primary h-1 rounded-lg bg-muted appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-mono text-muted-foreground">{formatAudioTime(audioDuration)}</span>
            </div>

            {/* Quick Controllers */}
            <div className="flex items-center gap-1">
              {/* Playback speed controller */}
              <button
                onClick={handleSpeedChange}
                className="px-2 py-1 border border-border rounded-lg text-[9px] font-bold font-mono text-muted-foreground hover:text-foreground hover:bg-muted/30"
              >
                {playbackRate}x
              </button>
              {/* Mute controller */}
              <button
                onClick={() => setAudioMuted(!audioMuted)}
                className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-muted/20"
              >
                {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main focused reading section */}
      <div className="w-full max-w-2xl px-4 py-8">
        {isFinished ? (
          <div className="text-center py-16 px-6 bg-card border border-primary/20 rounded-[2.5rem] card-shadow animate-fade-in my-8">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold font-amiri text-primary mb-2">
              {t('azkar.congratulations')}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mt-4">
              {isRtl 
                ? '«اللهم أعني على ذكرك وشكرك وحسن عبادتك»'
                : '“O Allah, help me to remember You, give thanks to You, and worship You in the best way.”'}
            </p>
            <Button
              onClick={() => navigate('/azkar')}
              className="btn-pill bg-primary hover:bg-primary/95 text-white mt-8 rounded-full h-10 px-6 font-bold text-xs"
            >
              {isRtl ? 'العودة للأذكار' : 'Back to Azkar Index'}
            </Button>
          </div>
        ) : focusMode ? (
          /* Focus Mode card view */
          <div className="flex flex-col items-center gap-6 mt-4 animate-fade-in">
            <div 
              onClick={handleFocusModeTap}
              className={`w-full min-h-[350px] p-8 bg-card border border-primary/10 rounded-[2.5rem] shadow-md flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 relative select-none hover:shadow-lg ${
                currentCounts[focusIndex] === 0 ? 'bg-emerald-500/5 border-emerald-500/25' : ''
              }`}
            >
              {/* Top corners */}
              <div className="flex justify-between items-center w-full text-xs font-semibold text-muted-foreground border-b border-border/40 pb-4">
                <span className="font-mono tracking-widest text-[9px] uppercase">
                  {isRtl ? 'الذكر' : 'Dhikr'} {focusIndex + 1} / {items.length}
                </span>
                <span className={`text-[10px] font-bold font-sans px-2.5 py-1 rounded-full ${
                  currentCounts[focusIndex] === 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'
                }`}>
                  {currentCounts[focusIndex] === 0 ? t('azkar.done').toUpperCase() : `${currentCounts[focusIndex]} / ${items[focusIndex].count}`}
                </span>
              </div>

              {/* Main Text */}
              <div className="my-10 px-2 flex-1 flex items-center justify-center">
                <p className="font-amiri text-xl md:text-2xl leading-[2.1] text-foreground font-bold break-words">
                  {items[focusIndex].text}
                </p>
              </div>

              {/* Benefit footer info */}
              <div className="w-full flex flex-col gap-4">
                {items[focusIndex].description && (
                  <p className="text-[11px] text-muted-foreground arabic-ui italic leading-relaxed border-t border-border/40 pt-4">
                    {items[focusIndex].description}
                  </p>
                )}

                {/* Exporter and Tap buttons */}
                <div className="flex justify-between items-center flex-row-reverse border-t border-border/30 pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDesignCard(items[focusIndex].text, e)}
                    className="rounded-xl h-8 px-2.5 gap-1.5 text-[10px] text-primary"
                  >
                    <Image className="w-3.5 h-3.5" />
                    {t('azkar.designCard')}
                  </Button>

                  <span className="text-[9px] text-muted-foreground flex items-center gap-1 select-none">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {isRtl ? 'انقر في أي مكان للعد' : 'Tap card to count'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigators */}
            <div className="flex items-center gap-4 w-full max-w-xs justify-between">
              <Button
                variant="outline"
                size="icon"
                disabled={focusIndex === 0}
                onClick={() => setFocusIndex(prev => prev - 1)}
                className="rounded-full w-10 h-10"
              >
                <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
              <span className="text-xs font-bold font-sans text-muted-foreground">
                {focusIndex + 1} / {items.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={focusIndex === items.length - 1}
                onClick={() => setFocusIndex(prev => prev + 1)}
                className="rounded-full w-10 h-10"
              >
                <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        ) : (
          /* Standard Checklist view */
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
                    <span className={`text-[10px] font-bold font-sans px-2 py-0.5 rounded-full ${
                      isDone ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'
                    }`}>
                      {isDone ? t('azkar.done').toUpperCase() : `${currentVal} / ${item.count}`}
                    </span>
                  </div>

                  {/* Dhikr Arabic Text */}
                  <div className="my-8 text-center">
                    <p className="font-amiri text-lg md:text-xl lg:text-2xl text-foreground leading-[2.1] font-bold break-words">
                      {item.text}
                    </p>
                  </div>

                  {/* Benefit / Description */}
                  {item.description && (
                    <div className="border-t border-border/40 pt-4 text-center">
                      <p className="text-[11px] text-muted-foreground arabic-ui italic leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* Exporter Button footer panel */}
                  <div className="border-t border-border/30 mt-4 pt-3 flex items-center justify-between flex-row-reverse">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDesignCard(item.text, e)}
                      className="rounded-xl h-8 px-2.5 gap-1.5 text-[10px] text-primary"
                    >
                      <Image className="w-3.5 h-3.5" />
                      {t('azkar.designCard')}
                    </Button>
                    
                    {!isDone ? (
                      <div className="w-7 h-7 rounded-full bg-primary/5 group-hover:bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-xs transition-all duration-200">
                        {currentVal}
                      </div>
                    ) : (
                      <span className="w-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
