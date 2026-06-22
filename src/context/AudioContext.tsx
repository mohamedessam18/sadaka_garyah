import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Surah } from '../services/quranService';
import { toast } from 'sonner';

export interface AudioReciter {
  id: string;
  nameAr: string;
  nameEn: string;
}

export const RECITERS: AudioReciter[] = [
  { id: 'ar.alafasy', nameAr: 'مشاري العفاسي', nameEn: 'Mishary Alafasy' },
  { id: 'ar.mahermuaiqly', nameAr: 'ماهر المعيقلي', nameEn: 'Maher Al-Muaiqly' },
  { id: 'ar.abdulbasitmurattal', nameAr: 'عبد الباسط عبد الصمد', nameEn: 'Abdul Basit' },
  { id: 'ar.minshawimujawwad', nameAr: 'محمد صديق المنشاوي', nameEn: 'Muhammad Al-Minshawi' }
];

const EDITION_MAPPING: Record<string, string> = {
  ar: 'ar.muyassar',
  en: 'en.asad',
  id: 'id.indonesian',
  es: 'es.cortes'
};

export interface AyahPlayInfo {
  number: number;
  text: string;
  audio: string;
  translation: string;
}

interface AudioContextType {
  activeSurah: Surah | null;
  selectedReciter: string;
  isPlaying: boolean;
  currentAyahIdx: number;
  ayahsList: AyahPlayInfo[];
  volume: number;
  muted: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isExpanded: boolean;
  playSurah: (surah: Surah, reciterId?: string) => Promise<void>;
  togglePlay: () => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  skipAyah: (direction: 'next' | 'prev') => void;
  changeReciter: (reciterId: string) => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setCurrentTime: (time: number) => void;
  setIsExpanded: (expanded: boolean) => void;
  resetAudio: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [activeSurah, setActiveSurah] = useState<Surah | null>(null);
  const [selectedReciter, setSelectedReciter] = useState<string>('ar.alafasy');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAyahIdx, setCurrentAyahIdx] = useState<number>(0);
  const [ayahsList, setAyahsList] = useState<AyahPlayInfo[]>([]);
  const [volume, setVolume] = useState<number>(0.8);
  const [muted, setMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleAudioError = (e: any) => {
      console.error('Audio playback error', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleAudioError);

    // Load volume and mute state from localStorage if exists
    const savedVol = localStorage.getItem('global-quran-volume');
    if (savedVol !== null) {
      const v = parseFloat(savedVol);
      setVolume(v);
      audio.volume = v;
    } else {
      audio.volume = 0.8;
    }

    const savedMuted = localStorage.getItem('global-quran-muted');
    if (savedMuted === 'true') {
      setMuted(true);
      audio.muted = true;
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleAudioError);
      audioRef.current = null;
    };
  }, []);

  // Update volume
  const changeVolume = (v: number) => {
    setVolume(v);
    localStorage.setItem('global-quran-volume', String(v));
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  // Update mute state
  const changeMuted = (m: boolean) => {
    setMuted(m);
    localStorage.setItem('global-quran-muted', String(m));
    if (audioRef.current) {
      audioRef.current.muted = m;
    }
  };

  // Update currentTime (seeking)
  const seekTime = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Play a Surah
  const playSurah = async (surah: Surah, reciterId: string = selectedReciter) => {
    setIsLoading(true);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const translationEdition = EDITION_MAPPING[i18n.language] || 'en.asad';
      
      // Fetch both detailed text (translation + arabic text) and the audio files
      const [detailRes, audioRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-simple,${translationEdition}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${reciterId}`)
      ]);

      const detailData = await detailRes.json();
      const audioData = await audioRes.json();

      if (
        detailData.code === 200 &&
        audioData.code === 200 &&
        detailData.data &&
        audioData.data &&
        audioData.data.ayahs
      ) {
        // detailData.data is an array of two editions: [quran-simple, translation]
        const arabicAyahs = detailData.data[0].ayahs;
        const translationAyahs = detailData.data[1].ayahs;
        const audioAyahs = audioData.data.ayahs;

        const merged: AyahPlayInfo[] = audioAyahs.map((a: any, idx: number) => ({
          number: a.numberInSurah,
          text: arabicAyahs[idx]?.text || a.text || '',
          audio: a.audio,
          translation: translationAyahs[idx]?.text || ''
        }));

        setAyahsList(merged);
        setActiveSurah(surah);
        setSelectedReciter(reciterId);
        setCurrentAyahIdx(0);
        setIsPlaying(true);
        setCurrentTime(0);

        if (audioRef.current) {
          audioRef.current.src = merged[0].audio;
          audioRef.current.volume = volume;
          audioRef.current.muted = muted;
          audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));

          // Setended handler
          audioRef.current.onended = () => {
            handleAyahEnded(merged, 0);
          };
        }

        toast.success(
          isRtl
            ? `جاري تشغيل ${surah.name} بصوت القارئ ${RECITERS.find(r => r.id === reciterId)?.nameAr}`
            : `Playing ${surah.englishName} recited by ${RECITERS.find(r => r.id === reciterId)?.nameEn}`
        );
      }
    } catch (err) {
      console.error('Error fetching Surah details/audio', err);
      toast.error(isRtl ? 'تعذر جلب ملفات الصوت لهذه السورة' : 'Could not fetch audio files for this Surah');
    } finally {
      setIsLoading(false);
    }
  };

  // Skip to next or previous Ayah
  const skipAyah = (direction: 'next' | 'prev') => {
    if (ayahsList.length === 0 || !audioRef.current) return;
    
    let nextIdx = direction === 'next' ? currentAyahIdx + 1 : currentAyahIdx - 1;
    if (nextIdx >= 0 && nextIdx < ayahsList.length) {
      setCurrentAyahIdx(nextIdx);
      setCurrentTime(0);
      audioRef.current.src = ayahsList[nextIdx].audio;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Play error', e));
      }
      audioRef.current.onended = () => {
        handleAyahEnded(ayahsList, nextIdx);
      };
    } else if (nextIdx >= ayahsList.length) {
      // Completed Surah
      setIsPlaying(false);
      toast.success(isRtl ? 'اكتمل تشغيل السورة.' : 'Surah playback completed.');
    }
  };

  const handleAyahEnded = (list: AyahPlayInfo[], currentIdx: number) => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < list.length) {
      setCurrentAyahIdx(nextIdx);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.src = list[nextIdx].audio;
        audioRef.current.play().catch(e => console.log('Play failed', e));
        audioRef.current.onended = () => {
          handleAyahEnded(list, nextIdx);
        };
      }
    } else {
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

  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeAudio = () => {
    if (audioRef.current && !isPlaying && activeSurah) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Change reciter and fetch/resume playing from the current ayah
  const changeReciter = async (reciterId: string) => {
    setSelectedReciter(reciterId);
    if (!activeSurah) return;

    setIsLoading(true);
    const savedIdx = currentAyahIdx;
    const savedPlayState = isPlaying;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${activeSurah.number}/${reciterId}`);
      const data = await response.json();

      if (data.code === 200 && data.data && data.data.ayahs) {
        const audioAyahs = data.data.ayahs;
        
        // Merge audio to existing list
        const updatedList = ayahsList.map((ayah, idx) => ({
          ...ayah,
          audio: audioAyahs[idx]?.audio || ayah.audio
        }));

        setAyahsList(updatedList);
        setCurrentTime(0);

        if (audioRef.current) {
          audioRef.current.src = updatedList[savedIdx].audio;
          if (savedPlayState) {
            audioRef.current.play().catch(e => console.log('Play blocked', e));
            setIsPlaying(true);
          }

          audioRef.current.onended = () => {
            handleAyahEnded(updatedList, savedIdx);
          };
        }
      }
    } catch (err) {
      console.error('Error changing reciter', err);
      toast.error(isRtl ? 'فشل تغيير القارئ' : 'Failed to change reciter');
    } finally {
      setIsLoading(false);
    }
  };

  // Update translation text when language changes, if a Surah is loaded
  useEffect(() => {
    if (!activeSurah) return;
    
    const updateTranslations = async () => {
      try {
        const translationEdition = EDITION_MAPPING[i18n.language] || 'en.asad';
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${activeSurah.number}/editions/quran-simple,${translationEdition}`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
          const translationAyahs = data.data[1].ayahs;
          setAyahsList(prev => prev.map((ayah, idx) => ({
            ...ayah,
            translation: translationAyahs[idx]?.text || ''
          })));
        }
      } catch (err) {
        console.warn('Silent translation update failed', err);
      }
    };
    updateTranslations();
  }, [i18n.language]);
  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setActiveSurah(null);
    setIsPlaying(false);
    setAyahsList([]);
    setCurrentAyahIdx(0);
    setCurrentTime(0);
    setDuration(0);
    setIsExpanded(false);
  };

  return (
    <AudioContext.Provider
      value={{
        activeSurah,
        selectedReciter,
        isPlaying,
        currentAyahIdx,
        ayahsList,
        volume,
        muted,
        isLoading,
        currentTime,
        duration,
        isExpanded,
        playSurah,
        togglePlay,
        pauseAudio,
        resumeAudio,
        skipAyah,
        changeReciter,
        setVolume: changeVolume,
        setMuted: changeMuted,
        setCurrentTime: seekTime,
        setIsExpanded,
        resetAudio,
        audioRef
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
