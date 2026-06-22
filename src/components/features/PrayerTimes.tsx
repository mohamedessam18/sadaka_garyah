import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Volume2, VolumeX, Bell, Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface Timings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const PRAYER_KEYS: (keyof Timings)[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Default timings for Cairo
const DEFAULT_TIMINGS: Timings = {
  Fajr: '04:15',
  Sunrise: '05:55',
  Dhuhr: '12:00',
  Asr: '15:30',
  Maghrib: '18:50',
  Isha: '20:15',
};

const ADHAN_AUDIO_URL = 'https://raw.githubusercontent.com/sk-tariq/Azan-Notification/master/src/sound/azan.mp3';

export const PrayerTimes: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [timings, setTimings] = useState<Timings>(DEFAULT_TIMINGS);
  const [loading, setLoading] = useState(false);
  const [activePrayer, setActivePrayer] = useState<keyof Timings>('Fajr');
  const [nextPrayer, setNextPrayer] = useState<keyof Timings>('Sunrise');
  const [countdown, setCountdown] = useState<string>('00:00:00');
  
  // Adhan sound settings
  const [adhanEnabled, setAdhanEnabled] = useState<boolean>(() => {
    return localStorage.getItem('adhan-enabled') === 'true';
  });
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('adhan-volume');
    return saved ? Number(saved) : 80;
  });
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load locations and fetch from Aladhan API
  useEffect(() => {
    setLoading(true);
    const fetchTimings = async (lat: number, lng: number) => {
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        // Fetch timings for Egypt method (5) or auto
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=5`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.data?.timings) {
            const raw = data.data.timings;
            setTimings({
              Fajr: raw.Fajr.split(' ')[0],
              Sunrise: raw.Sunrise.split(' ')[0],
              Dhuhr: raw.Dhuhr.split(' ')[0],
              Asr: raw.Asr.split(' ')[0],
              Maghrib: raw.Maghrib.split(' ')[0],
              Isha: raw.Isha.split(' ')[0],
            });
          }
        }
      } catch (err) {
        console.error('Error fetching prayer timings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchTimings(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // IP fallback
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              if (data.latitude && data.longitude) {
                fetchTimings(data.latitude, data.longitude);
              } else {
                setLoading(false);
              }
            })
            .catch(() => setLoading(false));
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  // Save adhan preferences
  useEffect(() => {
    localStorage.setItem('adhan-enabled', String(adhanEnabled));
  }, [adhanEnabled]);

  useEffect(() => {
    localStorage.setItem('adhan-volume', String(volume));
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio(ADHAN_AUDIO_URL);
    audioRef.current.volume = volume / 100;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Timer scheduling loop for countdown and active prayer tracking
  useEffect(() => {
    const parseTimeToDate = (timeStr: string, addDays = 0) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (addDays > 0) {
        d.setDate(d.getDate() + addDays);
      }
      return d;
    };

    const updateTimer = () => {
      const now = new Date();
      const prayerDates = PRAYER_KEYS.map((key) => ({
        key,
        date: parseTimeToDate(timings[key]),
      }));

      // Find active and next prayer
      // If we are before Fajr, the active is Isha (yesterday), next is Fajr (today)
      // Else find the first prayer that is in the future
      let nextIndex = prayerDates.findIndex((p) => p.date > now);
      let activeIdx = 0;
      let nextP = nextPrayer;
      let activeP = activePrayer;

      if (nextIndex === -1) {
        // All prayers today have passed, next is Fajr tomorrow
        nextP = 'Fajr';
        activeP = 'Isha';
      } else {
        nextP = prayerDates[nextIndex].key;
        activeIdx = nextIndex === 0 ? PRAYER_KEYS.length - 1 : nextIndex - 1;
        activeP = PRAYER_KEYS[activeIdx];
      }

      setActivePrayer(activeP);
      setNextPrayer(nextP);

      // Countdown calculation
      let targetDate = parseTimeToDate(timings[nextP]);
      if (nextP === 'Fajr' && nextIndex === -1) {
        targetDate = parseTimeToDate(timings.Fajr, 1); // tomorrow's Fajr
      }

      const diffMs = targetDate.getTime() - now.getTime();
      
      // Auto Adhan Trigger
      // If time matches exactly to a minute (diff between 0 and 1000ms), play Adhan
      if (adhanEnabled && diffMs >= 0 && diffMs < 1000 && nextP !== 'Sunrise') {
        playAdhan(nextP);
      }

      if (diffMs <= 0) {
        setCountdown('00:00:00');
        return;
      }

      const hrs = Math.floor(diffMs / (60 * 60 * 1000));
      const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((diffMs % (60 * 1000)) / 1000);

      const pad = (n: number) => String(n).padStart(2, '0');
      setCountdown(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timings, adhanEnabled, activePrayer, nextPrayer]);

  // Play Adhan
  const playAdhan = (prayerName: keyof Timings) => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      toast.info(t('features.prayer.nowAdhan', { name: getLocalizedPrayerName(prayerName) }), {
        duration: 10000,
        icon: '🕌',
      });
    } catch (e) {
      console.warn('Audio play blocked by browser policies.', e);
    }
  };

  // Toggle Test Sound
  const toggleTestSound = () => {
    if (!audioRef.current) return;

    if (isTestPlaying) {
      audioRef.current.pause();
      setIsTestPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          setIsTestPlaying(true);
        })
        .catch(() => {
          toast.error(isRtl ? 'اضغط أولاً على الشاشة لتفعيل الصوت' : 'Click on the page first to allow audio');
        });
    }
  };

  const getLocalizedPrayerName = (key: keyof Timings) => {
    const names: Record<keyof Timings, string> = {
      Fajr: t('features.prayer.fajr'),
      Sunrise: t('features.prayer.sunrise'),
      Dhuhr: t('features.prayer.dhuhr'),
      Asr: t('features.prayer.asr'),
      Maghrib: t('features.prayer.maghrib'),
      Isha: t('features.prayer.isha'),
    };
    return names[key];
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-md w-full max-w-sm mx-auto flex flex-col justify-between min-h-[460px] animate-fade-in">
      <div className="text-center w-full">
        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          {t('features.prayer.title')}
        </h3>

        {/* Live countdown badge */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl py-4 px-6 mb-6 inline-flex flex-col items-center justify-center min-w-[200px]">
          <span className="text-xs text-muted-foreground mb-1">
            {t('features.prayer.nextPrayer', { name: getLocalizedPrayerName(nextPrayer) })}
          </span>
          <span className="text-3xl font-mono font-bold text-primary tracking-wider font-sans">
            {countdown}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <span className="text-xs text-muted-foreground">{t('features.prayer.calculating')}</span>
        </div>
      ) : (
        /* Prayers Cards Grid */
        <div className="grid grid-cols-2 gap-2 mb-6">
          {PRAYER_KEYS.map((key) => {
            const isCurrent = activePrayer === key;
            const isNext = nextPrayer === key;
            return (
              <div
                key={key}
                className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between min-h-[72px] ${
                  isCurrent
                    ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300 font-semibold'
                    : isNext
                    ? 'border-primary/45 bg-primary/5'
                    : 'bg-muted/10 border-border/60 hover:bg-muted/20'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs">{getLocalizedPrayerName(key)}</span>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
                  )}
                </div>
                <span className="text-base font-bold font-sans mt-1 text-foreground leading-none">
                  {timings[key]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Adhan Sound Settings Panel */}
      <div className="border-t border-border pt-4 flex flex-col gap-3">
        {/* Adhan switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold">{t('features.prayer.adhanToggle')}</span>
          </div>
          <Switch checked={adhanEnabled} onCheckedChange={setAdhanEnabled} />
        </div>

        {/* Volume controls */}
        {adhanEnabled && (
          <div className="flex items-center gap-3">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-teal-600 shrink-0" />
            )}
            <Slider
              value={[volume]}
              onValueChange={(val) => setVolume(val[0])}
              min={0}
              max={100}
              step={5}
              className="flex-1 accent-primary"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-6 text-right font-sans">
              {volume}%
            </span>
          </div>
        )}

        {/* Audio test buttons */}
        <Button
          onClick={toggleTestSound}
          variant="outline"
          size="sm"
          className="rounded-full w-full h-9 font-semibold text-xs mt-1"
        >
          {isTestPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 ml-1 mr-1 fill-current" />
              {t('features.prayer.stopAdhan')}
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 ml-1 mr-1 fill-current" />
              {t('features.prayer.testAdhan')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
