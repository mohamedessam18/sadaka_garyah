import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Play, Pause, SkipForward, SkipBack, Volume2, Music, VolumeX } from 'lucide-react';
import { quranService, type Surah } from '../../services/quranService';
import { toast } from 'sonner';

interface AudioReciter {
  id: string;
  nameAr: string;
  nameEn: string;
}

const RECITERS: AudioReciter[] = [
  { id: 'ar.alafasy', nameAr: 'مشاري العفاسي', nameEn: 'Mishary Alafasy' },
  { id: 'ar.mahermuaiqly', nameAr: 'ماهر المعيقلي', nameEn: 'Maher Al-Muaiqly' },
  { id: 'ar.abdulbasitmurattal', nameAr: 'عبد الباسط عبد الصمد', nameEn: 'Abdul Basit' },
  { id: 'ar.minshawimujawwad', nameAr: 'محمد صديق المنشاوي', nameEn: 'Muhammad Al-Minshawi' }
];

export const QuranAudioHub: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReciter, setSelectedReciter] = useState<string>('ar.alafasy');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Playback state
  const [activeSurah, setActiveSurah] = useState<Surah | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAyahIdx, setCurrentAyahIdx] = useState<number>(0);
  const [ayahsList, setAyahsList] = useState<Array<{ number: number; text: string; audio: string }>>([]);
  const [muted, setMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch Surah list on mount
  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const list = await quranService.getSurahs();
        setSurahs(list);
      } catch (err) {
        console.error('Error loading surahs list', err);
        toast.error(isRtl ? 'فشل تحميل فهرس السور' : 'Failed to load Surahs list');
      }
    };
    loadSurahs();
  }, [isRtl]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSurah = async (surah: Surah) => {
    setIsLoading(true);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${selectedReciter}`);
      const data = await response.json();

      if (data.code === 200 && data.data && data.data.ayahs) {
        const list = data.data.ayahs.map((a: any) => ({
          number: a.numberInSurah,
          text: a.text,
          audio: a.audio
        }));

        setAyahsList(list);
        setActiveSurah(surah);
        setCurrentAyahIdx(0);
        setIsPlaying(true);

        // Initialize audio
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = list[0].audio;
        audioRef.current.volume = volume;
        audioRef.current.muted = muted;
        audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));

        // Event hooks
        audioRef.current.onended = () => {
          handleAyahEnded(list, 0);
        };
        audioRef.current.onerror = () => {
          toast.error(isRtl ? 'حدث خطأ أثناء تشغيل الآية' : 'Error playing Ayah audio');
          setIsPlaying(false);
        };

        toast.success(
          isRtl 
            ? `جاري تشغيل ${surah.name} بصوت القارئ ${RECITERS.find(r => r.id === selectedReciter)?.nameAr}` 
            : `Playing ${surah.englishName} recited by ${RECITERS.find(r => r.id === selectedReciter)?.nameEn}`
        );
      }
    } catch (err) {
      console.error('Error fetching Surah audio details', err);
      toast.error(isRtl ? 'تعذر جلب ملفات الصوت لهذه السورة' : 'Could not fetch audio files for this Surah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAyahEnded = (list: typeof ayahsList, currentIdx: number) => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < list.length) {
      setCurrentAyahIdx(nextIdx);
      if (audioRef.current) {
        audioRef.current.src = list[nextIdx].audio;
        audioRef.current.play().catch(e => console.log('Play failed', e));
        audioRef.current.onended = () => {
          handleAyahEnded(list, nextIdx);
        };
      }
    } else {
      // Completed Surah
      setIsPlaying(false);
      toast.success(isRtl ? 'اكتمل تشغيل السورة.' : 'Surah playback completed.');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !activeSurah) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const skipSurah = (direction: 'next' | 'prev') => {
    if (!activeSurah || surahs.length === 0) return;
    const currentNum = activeSurah.number;
    let nextNum = direction === 'next' ? currentNum + 1 : currentNum - 1;
    if (nextNum > 114) nextNum = 1;
    if (nextNum < 1) nextNum = 114;

    const nextSurah = surahs.find(s => s.number === nextNum);
    if (nextSurah) {
      playSurah(nextSurah);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    if (audioRef.current) {
      audioRef.current.muted = m;
    }
  };

  // Filter Surahs
  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString() === searchQuery
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in relative pb-32">
      
      {/* Search and Reciter Settings */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Reciter Selector */}
        <div className="w-full md:w-1/3 flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
            {isRtl ? 'القارئ' : 'Reciter'}
          </label>
          <select
            value={selectedReciter}
            onChange={(e) => {
              setSelectedReciter(e.target.value);
              if (activeSurah) {
                // If a Surah is playing, replay with the new reciter
                const active = activeSurah;
                setTimeout(() => playSurah(active), 100);
              }
            }}
            className="w-full bg-muted/30 border border-border hover:border-border-hover focus:border-primary outline-none rounded-2xl py-2.5 px-4 text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            {RECITERS.map(r => (
              <option key={r.id} value={r.id}>
                {isRtl ? r.nameAr : r.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Surah Search */}
        <div className="w-full md:w-2/3 flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
            {isRtl ? 'ابحث عن سورة' : 'Search Surah'}
          </label>
          <div className="relative w-full">
            <Search className="absolute right-4 top-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isRtl ? 'اكتب اسم السورة أو رقمها...' : 'Enter Surah name or number...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/30 border border-border hover:border-border-hover focus:border-primary outline-none rounded-2xl py-2.5 pr-11 pl-4 text-xs font-semibold text-foreground transition-colors"
            />
          </div>
        </div>

      </div>

      {/* Surahs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredSurahs.map(s => {
          const isActive = activeSurah?.number === s.number;
          return (
            <div
              key={s.number}
              onClick={() => !isLoading && playSurah(s)}
              className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 cursor-pointer select-none ${
                isActive
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-card border-border hover:border-border-hover hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                  isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {s.number}
                </span>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {isRtl ? s.name : s.englishName}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {s.numberOfAyahs} {isRtl ? 'آيات' : 'Ayahs'} • {isRtl ? (s.revelationType === 'Meccan' ? 'مكية' : 'مدنية') : s.revelationType}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                {isActive && isPlaying ? (
                  <Pause className="w-4 h-4 text-primary animate-pulse" />
                ) : (
                  <Play className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Sticky Media Controller */}
      {activeSurah && (
        <div className="fixed bottom-6 left-4 right-4 md:left-8 md:right-8 max-w-5xl mx-auto bg-card/95 backdrop-blur border border-border/80 shadow-card rounded-[2rem] p-4 z-40 flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up">
          
          {/* Track Info */}
          <div className="flex items-center gap-3 w-full md:w-1/3 text-right md:text-right" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-bold text-foreground truncate">
                {isRtl ? activeSurah.name : activeSurah.englishName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {isRtl ? 'الآية' : 'Ayah'} {currentAyahIdx + 1} / {ayahsList.length} • {RECITERS.find(r => r.id === selectedReciter)?.[isRtl ? 'nameAr' : 'nameEn']}
              </span>
            </div>
          </div>

          {/* Quranic Text Display inside player */}
          {ayahsList[currentAyahIdx] && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-md px-4 border-x border-border/40">
              <p className="font-amiri text-sm font-semibold text-primary truncate leading-relaxed text-center" dir="rtl">
                {ayahsList[currentAyahIdx].text}
              </p>
            </div>
          )}

          {/* Controls & Volume */}
          <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => skipSurah('prev')}
                className="p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center active:scale-95 transition-all shadow-sm shadow-primary/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-[1px]" />}
              </button>

              <button
                onClick={() => skipSurah('next')}
                className="p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume controls */}
            <div className="flex items-center gap-2 border-l border-border/40 pl-4">
              <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
