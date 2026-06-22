import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  Heart,
  Copy,
  Settings,
  Volume2,
  VolumeX,
  RefreshCw,
  BookOpen,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  Image as ImageIcon,
  Trash2,
  Share2,
  Play,
  Sparkles,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// Import Feature Components
import { MemorialDua } from '../components/features/MemorialDua';
import { QiblaFinder } from '../components/features/QiblaFinder';
import { PrayerTimes } from '../components/features/PrayerTimes';
import { AutoDhikrSettings } from '../components/features/AutoDhikrSettings';
import { GlobalRemembrances } from '../components/features/GlobalRemembrances';
import { HisnMuslim } from '../components/features/HisnMuslim';
import { SharedKhatmah } from '../components/features/SharedKhatmah';
import { QuranAudioHub } from '../components/features/QuranAudioHub';
import { HadithDesigner } from '../components/features/HadithDesigner';

// Types
interface Ayah {
  number: number;
  numberInSurah?: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  juz: number;
  page: number;
  reference?: string;
}

interface Reciter {
  identifier: string;
  name: string;
  language: string;
}

interface Favorite {
  ayah: Ayah;
  timestamp: number;
}

interface Translation {
  text: string;
  language: string;
}

const RECITERS: Reciter[] = [
  { identifier: 'ar.alafasy', name: 'مشاري العفاسي', language: 'ar' },
  { identifier: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد (مرتل)', language: 'ar' },
  { identifier: 'ar.abdullahbasfar', name: 'عبد الله بصفر', language: 'ar' },
  { identifier: 'ar.abdurrahmaansudais', name: 'عبد الرحمن السديس', language: 'ar' },
  { identifier: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي', language: 'ar' },
  { identifier: 'ar.ahmedneana', name: 'أحمد نعينع', language: 'ar' },
  { identifier: 'ar.akhdar', name: 'إبراهيم الأخضر', language: 'ar' },
  { identifier: 'ar.aymanswoaid', name: 'أيمن سويد', language: 'ar' },
  { identifier: 'ar.banna', name: 'محمود علي البنا', language: 'ar' },
  { identifier: 'ar.bukhatir', name: 'صلاح بو خاطر', language: 'ar' },
  { identifier: 'ar.faresabbad', name: 'فارس عباد', language: 'ar' },
  { identifier: 'ar.ghamadi', name: 'سعد الغامدي', language: 'ar' },
  { identifier: 'ar.haniarrifai', name: 'هاني الرفاعي', language: 'ar' },
  { identifier: 'ar.hudhaify', name: 'علي الحذيفي', language: 'ar' },
  { identifier: 'ar.husary', name: 'محمود خليل الحصري', language: 'ar' },
  { identifier: 'ar.jazairi', name: 'خلف الجزائري', language: 'ar' },
  { identifier: 'ar.juhany', name: 'عبد الله الجهني', language: 'ar' },
  { identifier: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', language: 'ar' },
  { identifier: 'ar.matroud', name: 'عبد الله المطرود', language: 'ar' },
  { identifier: 'ar.minshawi', name: 'محمد صديق المنشاوي', language: 'ar' },
  { identifier: 'ar.mohsinharthi', name: 'محسن الحارثي', language: 'ar' },
  { identifier: 'ar.muammar', name: 'ياسر الدوسري', language: 'ar' },
];

const REFLECTION_PROMPTS_BY_LANGUAGE: Record<string, string[]> = {
  ar: [
    'ماذا تفهم من هذه الآية؟',
    'كيف تطبق هذه الآية في حياتك؟',
    'ما الدرس الذي يمكنك استخلاصه من هذه الآية؟',
    'كيف تؤثر هذه الآية في قلبك؟',
  ],
  en: [
    'What do you understand from this ayah?',
    'How can you apply this ayah in your life?',
    'What lesson do you take from this ayah?',
    'How does this ayah move your heart?',
  ],
  id: [
    'Apa yang kamu pahami dari ayat ini?',
    'Bagaimana kamu menerapkan ayat ini dalam hidupmu?',
    'Pelajaran apa yang kamu ambil dari ayat ini?',
    'Bagaimana ayat ini menyentuh hatimu?',
  ],
  es: [
    '¿Qué entiendes de esta aleya?',
    '¿Cómo puedes aplicar esta aleya en tu vida?',
    '¿Qué enseñanza tomas de esta aleya?',
    '¿Cómo toca esta aleya tu corazón?',
  ],
};

const LANGUAGE_EDITIONS: Record<string, string> = {
  ar: 'ar.muyassar',
  en: 'en.sahih',
  id: 'id.indonesian',
  es: 'es.cortes'
};

export const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRtl = currentLanguage === 'ar';
  const location = useLocation();

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState<'ayah' | 'dua' | 'prayer' | 'khatmah' | 'dhikr'>('ayah');
  const [remembranceSubTab, setRemembranceSubTab] = useState<'hisn' | 'deceased' | 'settings'>('hisn');

  // State
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null);
  const [currentReciter, setCurrentReciter] = useState<Reciter>(RECITERS[0]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [audioErrorMessage, setAudioErrorMessage] = useState('');
  
  // Feature states
  const [autoMode, setAutoMode] = useState(false);
  const [autoInterval, setAutoInterval] = useState(15);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [quranFont, setQuranFont] = useState<'amiri' | 'scheherazade'>('amiri');
  const [showTafsir, setShowTafsir] = useState(false);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [muted, setMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [usedReciters, setUsedReciters] = useState<string[]>([]);

  // Live Card Designer States
  const [cardTextColor, setCardTextColor] = useState<string>('#ffffff');
  const [cardTextSize, setCardTextSize] = useState<number>(36);
  const [cardLayout, setCardLayout] = useState<'story' | 'instagram-portrait' | 'square'>('story');
  const [designerMode, setDesignerMode] = useState<'ayah' | 'hadith'>('ayah');
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoModeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const versePanelRef = useRef<HTMLDivElement>(null);
  const verseTextRef = useRef<HTMLParagraphElement>(null);

  // Load preferences from localStorage
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('quran-welcome-seen');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
    
    const savedFontSize = localStorage.getItem('quran-font-size');
    if (savedFontSize) {
      setFontSize(savedFontSize as 'small' | 'medium' | 'large');
    }
    
    const savedFont = localStorage.getItem('quran-font');
    if (savedFont) {
      setQuranFont(savedFont as 'amiri' | 'scheherazade');
    }
    
    const savedFavorites = localStorage.getItem('quran-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error parsing favorites:', e);
      }
    }
    
    const savedAutoInterval = localStorage.getItem('quran-auto-interval');
    if (savedAutoInterval) {
      setAutoInterval(Number(savedAutoInterval));
    }

    // Load initial ayah if welcome already seen and no presetDhikr in navigation state
    const state = location.state as { presetDhikr?: string } | null;
    if (hasSeenWelcome && !state?.presetDhikr) {
      fetchRandomAyah();
    }
  }, []);

  // ── Handle presetDhikr/presetAyahs from navigation ──
  useEffect(() => {
    const state = location.state as { 
      presetDhikr?: string; 
      presetAyahs?: Array<{ text: string; numberInSurah: number; surahName: string }> 
    } | null;
    
    if (state?.presetDhikr || state?.presetAyahs) {
      // Switch to the ayah tab and set designer mode to hadith (custom text)
      setActiveTab('ayah');
      setDesignerMode('hadith');
      
      let text = '';
      let surahName = 'ذكر';
      let reference = 'حصن المسلم';
      
      if (state.presetDhikr) {
        text = state.presetDhikr;
        surahName = 'ذكر';
        reference = 'حصن المسلم';
      } else if (state.presetAyahs && state.presetAyahs.length > 0) {
        const toArabicNumber = (num: number): string => {
          return String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
        };
        text = state.presetAyahs.map(a => `${a.text} ﴿${toArabicNumber(a.numberInSurah)}﴾`).join(' ');
        
        const uniqueSurahs = Array.from(new Set(state.presetAyahs.map(a => a.surahName)));
        if (uniqueSurahs.length === 1) {
          surahName = uniqueSurahs[0];
          const numbers = state.presetAyahs.map(a => a.numberInSurah);
          const min = Math.min(...numbers);
          const max = Math.max(...numbers);
          reference = min === max ? `سورة ${surahName}، آية ${min}` : `سورة ${surahName}، الآيات ${min}-${max}`;
        } else {
          surahName = 'آيات من القرآن الكريم';
          reference = 'سور متعددة من القرآن الكريم';
        }
      }
      
      // Populate the card designer with the loaded text
      setCurrentAyah({
        number: 0,
        text: text,
        surah: {
          number: 0,
          name: surahName,
          englishName: surahName === 'ذكر' ? 'Dhikr' : 'Holy Quran',
        },
        juz: 0,
        page: 0,
        reference: reference
      });
      
      // Scroll into the designer smoothly
      setTimeout(() => {
        versePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      
      // Show toast to tell the user what happened
      toast.success(
        isRtl ? 'تم تحميل النص في مصمم البطاقات 🎨' : 'Text loaded in card designer 🎨',
        { duration: 3000 }
      );
      
      // Clear the state so refresh doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, [location.state]);
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('quran-font-size', fontSize);
  }, [fontSize]);
  
  useEffect(() => {
    localStorage.setItem('quran-font', quranFont);
  }, [quranFont]);
  
  useEffect(() => {
    localStorage.setItem('quran-favorites', JSON.stringify(favorites));
  }, [favorites]);
  
  useEffect(() => {
    localStorage.setItem('quran-auto-interval', String(autoInterval));
  }, [autoInterval]);
  
  // Handle welcome modal close
  const handleWelcomeClose = () => {
    localStorage.setItem('quran-welcome-seen', 'true');
    setShowWelcomeModal(false);
    fetchRandomAyah();
  };

  const getAyahAudioUrl = useCallback(async (ayahNumber: number, reciterId: string) => {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/${reciterId}`);
    if (!response.ok) {
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 200 || !data.data?.audio) {
      throw new Error('VOICE_NOT_FOUND');
    }

    return data.data.audio as string;
  }, []);

  const fetchTranslation = useCallback(async (ayahNumber: number, language: string) => {
    const edition = LANGUAGE_EDITIONS[language] || 'en.sahih';
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/${edition}`);
    if (!response.ok) {
      throw new Error(`TRANSLATION_ERROR_${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 200 || !data.data?.text) {
      throw new Error('TRANSLATION_NOT_FOUND');
    }

    return {
      text: data.data.text as string,
      language,
    };
  }, []);

  const resolveAudioSource = useCallback(async (ayahNumber: number, preferredReciter?: Reciter, excludedReciterId?: string) => {
    const remaining = RECITERS.filter(
      (reciter) =>
        reciter.identifier !== preferredReciter?.identifier &&
        reciter.identifier !== excludedReciterId
    );
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    const orderedReciters = preferredReciter && preferredReciter.identifier !== excludedReciterId
      ? [preferredReciter, ...shuffled]
      : shuffled;

    for (const reciter of orderedReciters) {
      try {
        const url = await getAyahAudioUrl(ayahNumber, reciter.identifier);
        return { url, reciter };
      } catch {
        continue;
      }
    }

    return null;
  }, [getAyahAudioUrl]);
  
  // Fetch random ayah
  const fetchRandomAyah = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setAudioError(false);
    setAudioErrorMessage('');
    
    try {
      const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;
      
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/quran-simple`);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        const ayah: Ayah = {
          number: data.data.number,
          numberInSurah: data.data.numberInSurah,
          text: data.data.text,
          surah: {
            number: data.data.surah.number,
            name: data.data.surah.name,
            englishName: data.data.surah.englishName,
          },
          juz: data.data.juz,
          page: data.data.page,
        };
        
        setCurrentAyah(ayah);
        
        let availableReciters = RECITERS.filter(r => !usedReciters.includes(r.identifier));
        if (availableReciters.length === 0) {
          setUsedReciters([]);
          availableReciters = RECITERS;
        }
        const randomReciter = availableReciters[Math.floor(Math.random() * availableReciters.length)];
        const resolvedAudio = await resolveAudioSource(ayah.number, randomReciter);
        if (resolvedAudio) {
          setCurrentReciter(resolvedAudio.reciter);
          setUsedReciters(prev => [...prev, resolvedAudio.reciter.identifier]);
          setAudioUrl(resolvedAudio.url);
          setAudioError(false);
          setAudioErrorMessage('');
        } else {
          setAudioUrl('');
          setAudioError(true);
          setAudioErrorMessage(t('home.loadingAyah'));
          toast.error(t('home.loadingAyah'));
        }
        
        try {
          const nextTranslation = await fetchTranslation(randomAyahNumber, currentLanguage);
          setTranslation(nextTranslation);
        } catch {
          setTranslation(null);
        }
        
        const prompts = REFLECTION_PROMPTS_BY_LANGUAGE[currentLanguage] ?? REFLECTION_PROMPTS_BY_LANGUAGE['ar'];
        setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
        
        setTimeout(() => {
          if (audioRef.current && !muted && resolvedAudio) {
            audioRef.current.play().catch(() => {});
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching ayah:', error);
      toast.error(t('home.loadingAyah'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchTranslation, isLoading, muted, resolveAudioSource, currentLanguage, usedReciters, t]);

  useEffect(() => {
    if (!currentAyah) return;

    let cancelled = false;

    const loadTranslation = async () => {
      try {
        const nextTranslation = await fetchTranslation(currentAyah.number, currentLanguage);
        if (!cancelled) {
          setTranslation(nextTranslation);
        }
      } catch {
        if (!cancelled) {
          setTranslation(null);
        }
      }
    };

    void loadTranslation();

    return () => {
      cancelled = true;
    };
  }, [currentAyah, fetchTranslation, currentLanguage]);

  useEffect(() => {
    if (!currentAyah) return;
    const prompts = REFLECTION_PROMPTS_BY_LANGUAGE[currentLanguage] ?? REFLECTION_PROMPTS_BY_LANGUAGE['ar'];
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, [currentAyah, currentLanguage]);
  
  // Handle audio error - fallback
  const handleAudioError = useCallback(async () => {
    if (!currentAyah || audioError) return;
    
    setAudioError(true);
    setAudioErrorMessage('');

    const fallbackAudio = await resolveAudioSource(currentAyah.number, undefined, currentReciter.identifier);
    if (fallbackAudio) {
      setCurrentReciter(fallbackAudio.reciter);
      setAudioUrl(fallbackAudio.url);
      setAudioError(false);
      setAudioErrorMessage('');
      toast.success(`تم التبديل إلى ${fallbackAudio.reciter.name}`);
      setTimeout(() => {
        if (audioRef.current && !muted) {
          audioRef.current.play().catch(() => {});
        }
      }, 400);
    }
  }, [resolveAudioSource, currentReciter, muted, t, currentAyah, audioError]);

  const handleAudioEnded = () => {
    if (autoMode) {
      setTimeout(() => {
        if (autoMode) {
          void fetchRandomAyah();
        }
      }, autoInterval * 1000);
    }
  };

  // Auto Mode interval runner
  useEffect(() => {
    if (autoMode) {
      toast.success(
        isRtl 
          ? `تم تفعيل التشغيل التلقائي كل ${autoInterval} ثانية` 
          : `Auto mode enabled: updates every ${autoInterval} seconds`
      );
    }
    return () => {
      if (autoModeRef.current) {
        clearInterval(autoModeRef.current);
      }
    };
  }, [autoMode, autoInterval, isRtl]);

  const toggleFavorite = () => {
    if (!currentAyah) return;
    const isFav = favorites.some(f => f.ayah.number === currentAyah.number);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.ayah.number !== currentAyah.number));
      toast.success(isRtl ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
    } else {
      const newFav: Favorite = {
        ayah: currentAyah,
        timestamp: Date.now()
      };
      setFavorites(prev => [...prev, newFav]);
      toast.success(isRtl ? 'تم الحفظ في المفضلة' : 'Saved to favorites');
    }
  };

  const isFavorite = currentAyah && favorites.some(f => f.ayah.number === currentAyah.number);

  const copyToClipboard = () => {
    if (!currentAyah) return;
    const text = `${currentAyah.text}\n\n${currentAyah.surah.name} - الآية ${currentAyah.numberInSurah || currentAyah.number}\nصدقة جارية لروح محمد السيد`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('home.copied'));
    }).catch(() => {
      toast.error(isRtl ? 'فشل نسخ الآية' : 'Could not copy ayah');
    });
  };

  const playFavorite = useCallback(
    async (fav: Favorite) => {
      const ayah = fav.ayah;

      setAudioError(false);
      setAudioErrorMessage('');
      setCurrentAyah(ayah);

      const resolvedAudio = await resolveAudioSource(ayah.number, currentReciter);
      if (!resolvedAudio) {
        setAudioError(true);
        setAudioErrorMessage(t('home.loadingAyah'));
        toast.error(t('home.loadingAyah'));
        return;
      }

      setCurrentReciter(resolvedAudio.reciter);
      setAudioUrl(resolvedAudio.url);
      setTimeout(() => {
        if (audioRef.current && !muted) {
          audioRef.current.play().catch(() => {});
        }
      }, 400);
    },
    [resolveAudioSource, currentReciter, muted, t]
  );

  const shareFavorite = async (fav: Favorite) => {
    try {
      const text = `${fav.ayah.text}\n\n${fav.ayah.surah.name} - الآية ${fav.ayah.numberInSurah || fav.ayah.number}\nصدقة جارية لروح محمد السيد`;
      await navigator.share({
        title: fav.ayah.surah.name,
        text: text,
      });
      toast.success(t('home.copied'));
    } catch {
      toast.error(isRtl ? 'تعذر مشاركة الآية' : 'Could not share ayah');
    }
  };

  // Helper to format and avoid duplicate "سورة" in Surah names
  const formatSurahName = (name: string) => {
    if (!name) return '';
    if (
      name === 'حديث شريف' ||
      name.startsWith('حديث') ||
      name === 'ذكر' ||
      name === 'أذكار' ||
      name.toLowerCase().includes('dhikr') ||
      name.toLowerCase().includes('custom')
    ) {
      return name;
    }
    const cleanName = name.replace(/[\u064B-\u065F]/g, '').trim();
    if (cleanName.startsWith('سورة') || cleanName.startsWith('سُورَة')) {
      return name;
    }
    return `سورة ${name}`;
  };

  // Generate Custom Ayah Image via Canvas Designer
  const generateAyahImage = () => {
    if (!currentAyah || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = 1080;
    
    // Set temp width to measure font wrapping
    canvas.width = width;
    ctx.font = `${cardTextSize}px "Amiri", "UthmanicHafs", serif`;
    
    // Compute wrapped lines
    const words = currentAyah.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = width - 240; // safe padding
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine.trim());
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());
    
    const lineHeight = cardTextSize * 1.75;
    const totalTextHeight = lines.length * lineHeight;
    
    // Set Dimensions based on layout setting
    if (cardLayout === 'story') {
      canvas.width = 1080;
      canvas.height = 1920;
    } else if (cardLayout === 'instagram-portrait') {
      canvas.width = 1080;
      canvas.height = 1350;
    } else {
      // Square layout with dynamic vertical expansion
      canvas.width = 1080;
      const requiredHeight = 320 + totalTextHeight + 360;
      canvas.height = Math.max(1080, requiredHeight);
    }
    
    const toastId = toast.loading(isRtl ? 'جاري تحميل خلفية التصدير وتجهيز البطاقة...' : 'Loading template and rendering card...');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const baseUrl = import.meta.env.BASE_URL || '/';
    img.src = `${baseUrl}خلفية التصدير.png`.replace(/\/+/g, '/');
    
    img.onload = () => {
      // Calculate contain/cover coordinates
      let dx = 0;
      let dy = 0;
      let dWidth = canvas.width;
      let dHeight = canvas.height;
      
      const strategy = (cardLayout === 'story') ? 'cover' : 'contain';
      
      if (strategy === 'cover') {
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        dWidth = img.width * scale;
        dHeight = img.height * scale;
        dx = (canvas.width - dWidth) / 2;
        dy = (canvas.height - dHeight) / 2;
      } else {
        // Center background and scale by width to cover horizontal boundaries
        const scale = canvas.width / img.width;
        dWidth = img.width * scale;
        dHeight = img.height * scale;
        dx = 0;
        dy = (canvas.height - dHeight) / 2;
      }

      const renderCanvas = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Sample background color from pixel (10, 10) to fill padding area
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCanvas.width = 1;
          tempCanvas.height = 1;
          tempCtx.drawImage(img, 10, 10, 1, 1, 0, 0, 1, 1);
          const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
          ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        } else {
          ctx.fillStyle = '#022c22'; // fallback dark green
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background template image
        ctx.drawImage(img, dx, dy, dWidth, dHeight);
        
        // Setup Text Shadow for perfect readability and high contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
        
        // 1. TOP HEADER: Centered inside top decorative banner
        ctx.fillStyle = cardTextColor === '#ffffff' ? '#ffffff' : '#d4af37'; // White or Soft Gold
        ctx.font = 'bold 36px "Amiri", "UthmanicHafs", serif';
        ctx.textAlign = 'center';
        
        const surahNameText = formatSurahName(currentAyah.surah.name);
        const headerY = Math.max(dy + dHeight * 0.10, 100);
        ctx.fillText(surahNameText, canvas.width / 2, headerY);
        
        // 2. MAIN CONTENT AREA: Centered Arabic Ayah text
        ctx.fillStyle = '#ffffff'; // Always clean white for Quranic text
        ctx.font = `${cardTextSize}px "Amiri", "UthmanicHafs", serif`;
        ctx.textAlign = 'center';
        
        const centerY = dy + dHeight / 2;
        const textCenterY = cardLayout === 'square' ? canvas.height / 2 : centerY;
        let currentY = textCenterY - (totalTextHeight / 2) + (lineHeight / 2);
        
        lines.forEach((lineText) => {
          ctx.fillText(lineText, canvas.width / 2, currentY);
          currentY += lineHeight;
        });
        
        // 3. AYAH METADATA: Below the ayah text
        ctx.fillStyle = '#d4af37'; // Soft Gold
        ctx.font = '500 26px "Noto Sans Arabic", sans-serif';
        
        const isCustomOrHadith = currentAyah.surah.number === 0;
        const metadataText = isCustomOrHadith
          ? (currentAyah.reference || (currentAyah.surah.name === 'حديث شريف' ? 'حديث صحيح' : 'حصن المسلم'))
          : `الآية ${currentAyah.numberInSurah || currentAyah.number}`;
        const metadataY = currentY - (lineHeight / 2) + 60;
        ctx.fillText(metadataText, canvas.width / 2, metadataY);
        
        // 4. FOOTER AREA: Inside the bottom section
        ctx.shadowBlur = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '500 20px "Noto Sans Arabic", sans-serif';
        
        const footerY1 = cardLayout === 'square' 
          ? canvas.height - 180 
          : dy + dHeight * 0.79;
        ctx.fillText('صدقة جارية على روح', canvas.width / 2, footerY1);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 24px "Amiri", "UthmanicHafs", serif';
        const footerY2 = cardLayout === 'square' 
          ? canvas.height - 140 
          : dy + dHeight * 0.83;
        ctx.fillText('محمد السيد رحمه الله', canvas.width / 2, footerY2);
        
        // Trigger download
        try {
          const link = document.createElement('a');
          const fileSuffix = isCustomOrHadith ? (currentAyah.surah.name === 'حديث شريف' ? 'hadith' : 'dhikr') : `ayah-${currentAyah.numberInSurah || currentAyah.number}`;
          link.download = `sadaka-garyah-${fileSuffix}.png`;
          link.href = canvas.toDataURL();
          link.click();
          toast.dismiss(toastId);
          toast.success(t('features.designer.toastSuccess'));
        } catch (err) {
          console.error('Canvas export error:', err);
          toast.dismiss(toastId);
          toast.error(isRtl ? 'فشل تصدير الصورة بسبب سياسة أمان المتصفح' : 'Failed to export image due to security policies');
        }
      };

      const fontsReady = (document as any).fonts?.ready;
      if (fontsReady && typeof fontsReady.then === 'function') {
        fontsReady.then(renderCanvas);
      } else {
        renderCanvas();
      }
    };
    
    img.onerror = () => {
      toast.dismiss(toastId);
      toast.error(isRtl ? 'تعذر تحميل قالب الخلفية خلفية التصدير.png' : 'Failed to load background template خلفية التصدير.png');
    };
  };
  
  const getTafsir = () => {
    if (!currentAyah) return t('home.loadingAyah');
    const ayahNo = currentAyah.numberInSurah || currentAyah.number;
    return isRtl 
      ? `تفسير الآية ${ayahNo} من ${formatSurahName(currentAyah.surah.name)}. هذه الآية تحمل معانٍ عميقة في القرآن الكريم، ويُستحسن الرجوع إلى كتب التفسير المعتمدة مثل تفسير ابن كثير أو تفسير السعدي للمزيد من التفاصيل.`
      : `Tafsir of Ayah ${ayahNo} from Surah ${currentAyah.surah.englishName}. This verse carries profound spiritual reminders, encouraging believers to seek guidance, perform good deeds, and trust in Allah's limitless mercy.`;
  };
  

  const removeFromFavorites = (ayahNumber: number) => {
    setFavorites(prev => prev.filter(f => f.ayah.number !== ayahNumber));
    toast.success(isRtl ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
  };

  return (
    <div className="flex-1 w-full bg-background transition-colors duration-300 relative py-6 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Hidden canvas for image designer */}
      <canvas ref={canvasRef} className="hidden" />
      <Toaster position="top-center" richColors />
      
      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-card border-0 rounded-3xl shadow-card">
          <div className="text-center py-8">
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full glow-ring animate-pulse-ring" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#3F7D7B" strokeWidth="2" />
                <circle cx="100" cy="100" r="75" fill="none" stroke="#3F7D7B" strokeWidth="1" strokeOpacity="0.5" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-teal-600 dark:text-teal-400 text-6xl font-amiri">ﷺ</span>
              </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-amiri text-foreground mb-4 leading-relaxed font-bold">
              صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ
            </h2>
            
            <p className="arabic-ui text-muted-foreground mb-8 text-sm px-4">
              {t('home.allowAudio')}
            </p>
            
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={handleWelcomeClose} className="btn-pill bg-teal-600 hover:bg-teal-700 text-white w-full rounded-full">
                {t('home.start')}
              </Button>
              <Button variant="ghost" onClick={handleWelcomeClose} className="text-muted-foreground hover:text-foreground">
                {t('home.later')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sleek Horizontal Tab Bar Menu */}
      {!showWelcomeModal && (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-xl bg-card border border-border rounded-full p-1.5 flex items-center justify-between mb-8 overflow-x-auto gap-1 shadow-sm scrollbar-none">
            {([
              { id: 'ayah', icon: Sparkles, label: t('features.tabs.ayah') },
              { id: 'dua', icon: Heart, label: t('features.tabs.dua') },
              { id: 'prayer', icon: Clock, label: t('features.tabs.prayerQibla') },
              { id: 'khatmah', icon: Calendar, label: t('features.tabs.khatmah') },
              { id: 'dhikr', icon: Volume2, label: t('features.tabs.dhikr') }
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-350 select-none ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="arabic-ui">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Pages Router */}
          <div className="w-full flex justify-center">
            
            {/* Tab 1: Combined Ayah & Hadith Card Designer */}
            {activeTab === 'ayah' && (
              <div className="w-full flex flex-col items-center animate-fade-in">
                {/* Header Description */}
                <section className="mb-6 text-center max-w-xl">
                  <h1 className="text-2xl md:text-3xl font-amiri text-foreground mb-2 font-bold leading-normal">
                    {t('home.title')}
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {t('home.description')}
                  </p>
                </section>

                {/* Designer Mode Selector Toggle */}
                <div className="flex bg-muted/40 p-1 border border-border rounded-full items-center gap-1 w-full max-w-xs mb-6 shrink-0">
                  <button
                    onClick={() => {
                      setDesignerMode('ayah');
                      if (currentAyah?.surah.number === 0) {
                        fetchRandomAyah();
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      designerMode === 'ayah'
                        ? 'bg-card border border-border shadow-sm text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isRtl ? 'تصميم آية قرآنية' : 'Design Ayah'}
                  </button>
                  <button
                    onClick={() => {
                      setDesignerMode('hadith');
                      setCurrentAyah({
                        number: 0,
                        text: 'إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ: إِلَّا مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ.',
                        surah: {
                          number: 0,
                          name: 'حديث شريف',
                          englishName: 'Prophetic Hadith',
                        },
                        juz: 0,
                        page: 0,
                        reference: 'رواه مسلم'
                      });
                    }}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      designerMode === 'hadith'
                        ? 'bg-card border border-border shadow-sm text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isRtl ? 'تصميم حديث شريف' : 'Design Hadith'}
                  </button>
                </div>

                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Live Preview Card (takes 7 cols on lg) */}
                  <div className="lg:col-span-7 flex flex-col gap-4 w-full">
                    <div 
                      ref={versePanelRef}
                      className="w-full rounded-[28px] border border-border shadow-md transition-all duration-300 relative text-white overflow-hidden select-none bg-[#022c22] flex flex-col justify-between items-center py-16 px-6"
                      style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}خلفية التصدير.png)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        aspectRatio: cardLayout === 'story' ? '9/16' : cardLayout === 'instagram-portrait' ? '4/5' : undefined,
                        minHeight: cardLayout === 'story' ? '600px' : cardLayout === 'instagram-portrait' ? '500px' : '450px',
                        height: cardLayout === 'square' ? 'auto' : undefined,
                      }}
                    >
                      {/* Top Header Area: Centered Surah Name inside top banner */}
                      <div className="relative w-full text-center mt-2 mb-6">
                        <span 
                          className="font-amiri text-base md:text-lg font-bold bg-black/15 backdrop-blur-[0.5px] px-3 py-1 rounded-full border border-white/5" 
                          style={{ color: cardTextColor === '#ffffff' ? '#ffffff' : '#d4af37' }}
                        >
                          {currentAyah ? formatSurahName(currentAyah.surah.name) : ''}
                        </span>
                      </div>

                      {/* Main Content Area: Centered Ayah text & Metadata */}
                      <div className="relative flex-1 flex flex-col items-center justify-center z-10 text-center w-full my-auto px-4">
                        {currentAyah ? (
                          <div className="flex flex-col gap-3 w-full">
                            <p
                              ref={verseTextRef}
                              className="leading-[1.75] text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                              style={{ 
                                fontFamily: '"Amiri", "UthmanicHafs", serif',
                                fontSize: `${cardTextSize * 0.65}px`, 
                                color: '#ffffff' 
                              }}
                            >
                              {currentAyah.text}
                            </p>
                            
                            {/* Ayah Metadata */}
                            <span 
                              className="text-xs md:text-sm font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-sans" 
                              style={{ color: '#d4af37' }}
                            >
                              {currentAyah.surah.number === 0
                                ? (currentAyah.reference || 'حصن المسلم')
                                : `الآية ${currentAyah.numberInSurah || currentAyah.number}`}
                            </span>
                          </div>
                        ) : (
                          <p className="opacity-70 arabic-ui">{t('home.loadingAyah')}</p>
                        )}
                      </div>

                      {/* Footer Area: Bottom Dedication */}
                      <div className="relative w-full text-center mt-6 mb-2 flex flex-col gap-0.5">
                        <p className="text-[9px] md:text-[10px] opacity-75 font-sans">صدقة جارية على روح</p>
                        <p 
                          className="font-amiri text-xs md:text-sm font-bold opacity-90" 
                          style={{ color: '#ffffff' }}
                        >
                          محمد السيد رحمه الله
                        </p>
                      </div>
                    </div>

                    {/* Conditional Panel Rendering depending on designerMode */}
                    {designerMode === 'hadith' ? (
                      <HadithDesigner 
                        onSelectHadith={(h) => setCurrentAyah(h)} 
                        selectedText={currentAyah?.text} 
                      />
                    ) : (
                      <>
                        {/* Audio Player and Secondary Controls */}
                        {currentAyah && (
                          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
                            {audioUrl && (
                              <audio
                                ref={audioRef}
                                src={audioUrl}
                                onEnded={handleAudioEnded}
                                onError={handleAudioError}
                                muted={muted}
                                className="w-full mb-4 accent-primary bg-muted/30 rounded-full"
                                controls
                              />
                            )}

                            {audioErrorMessage && (
                              <p className="text-center text-xs text-destructive mb-4 arabic-ui">
                                {audioErrorMessage}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <Button
                                onClick={fetchRandomAyah}
                                disabled={isLoading}
                                className="btn-pill bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white rounded-full flex items-center gap-2 text-xs md:text-sm h-10 px-5"
                              >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {t('home.newAyah')}
                              </Button>
                              
                              <Button
                                onClick={toggleFavorite}
                                variant="outline"
                                className={`btn-pill rounded-full text-xs h-10 px-4 gap-1.5 ${
                                  isFavorite ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10' : ''
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                                {isFavorite ? t('home.saved') : t('home.save')}
                              </Button>

                              <Button
                                onClick={() => setShowFavorites(true)}
                                variant="outline"
                                className="btn-pill rounded-full text-xs h-10 px-4 gap-1.5"
                              >
                                <BookOpen className="w-4 h-4" />
                                {t('home.favorites')} ({favorites.length})
                              </Button>

                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowSettings(true)}
                                className="rounded-full w-10 h-10 shrink-0"
                              >
                                <Settings className="w-4.5 h-4.5" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Secondary Toggles (Tafsir, Translation, Copy, etc) */}
                        {currentAyah && (
                          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-card border border-border p-3 rounded-2xl">
                            {/* Auto Mode Toggle */}
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/40 border border-border/60 rounded-full text-xs">
                              <Zap className="w-3.5 h-3.5 text-teal-600" />
                              <span className="font-semibold">{t('home.auto')}</span>
                              <Switch checked={autoMode} onCheckedChange={setAutoMode} className="scale-75" />
                            </div>
                            
                            <Button
                              onClick={() => setShowTafsir(!showTafsir)}
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs h-8 px-3"
                            >
                              <BookOpen className="w-3.5 h-3.5 ml-1 mr-1" />
                              {t('home.tafsir')}
                              {showTafsir ? <ChevronUp className="w-3.5 h-3.5 ml-1 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 mr-1" />}
                            </Button>
                            
                            <Button
                              onClick={() => setShowTranslation(!showTranslation)}
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs h-8 px-3"
                            >
                              <Globe className="w-3.5 h-3.5 ml-1 mr-1" />
                              {t('home.translation')}
                              {showTranslation ? <ChevronUp className="w-3.5 h-3.5 ml-1 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 mr-1" />}
                            </Button>
                            
                            <Button
                              onClick={copyToClipboard}
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs h-8 px-3"
                            >
                              <Copy className="w-3.5 h-3.5 ml-1 mr-1" />
                              {t('home.copy')}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMuted(!muted)}
                              className="rounded-full w-8 h-8 text-muted-foreground"
                            >
                              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        )}

                        {/* Tafsir Box */}
                        {showTafsir && currentAyah && (
                          <div className="p-5 bg-teal-500/5 border border-teal-500/10 rounded-2xl animate-fade-in text-right">
                            <h4 className="text-teal-600 dark:text-teal-400 font-semibold mb-1.5 arabic-ui text-sm flex items-center gap-1.5 justify-end">
                              {t('home.tafsir')}
                              <BookOpen className="w-4 h-4" />
                            </h4>
                            <p className="text-foreground/80 arabic-ui text-xs md:text-sm leading-relaxed">
                              {getTafsir()}
                            </p>
                          </div>
                        )}
                        
                        {/* Translation Box */}
                        {showTranslation && translation && (
                          <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl animate-fade-in text-left">
                            <h4 className="text-blue-600 dark:text-blue-400 font-semibold mb-1 flex items-center gap-1.5">
                              <Globe className="w-4 h-4" />
                              {t('home.translation')}
                            </h4>
                            <p className="text-[10px] text-blue-500/80 mb-2 font-mono">
                              {t('home.translatedTo')}: {currentLanguage.toUpperCase()}
                            </p>
                            <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">
                              {translation.text}
                            </p>
                          </div>
                        )}
                        
                        {/* Reflection Prompt Box */}
                        {currentAyah && currentPrompt && (
                          <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-center">
                            <p className="text-purple-600 dark:text-purple-400 text-[10px] font-semibold mb-1.5 uppercase tracking-wide">
                              {t('home.reflection')}
                            </p>
                            <p className="text-foreground/90 arabic-ui text-sm leading-relaxed">
                              {currentPrompt}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right Column: Live Card Designer Controls (takes 5 cols on lg) */}
                  <div className="lg:col-span-5 w-full bg-card border border-border rounded-[28px] p-6 shadow-md flex flex-col gap-6">
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-1.5">
                        <ImageIcon className="w-4.5 h-4.5 text-primary" />
                        {t('features.designer.title')}
                      </h3>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Customize borders, gradients, pattern overlays, and scale font sizes before downloading.
                      </p>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-border/60">
                      
                      {/* Card Layout style */}
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2.5 block">{t('features.designer.cardLayout')}</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {([
                            { id: 'story', label: t('features.designer.portrait') + ' (1080 × 1920)' },
                            { id: 'instagram-portrait', label: 'Instagram Portrait (1080 × 1350)' },
                            { id: 'square', label: t('features.designer.square') + ' (1080 × 1080)' }
                          ] as const).map((lay) => (
                            <button
                              key={lay.id}
                              onClick={() => setCardLayout(lay.id)}
                              className={`py-2.5 px-4 rounded-xl border text-xs font-medium text-right transition-all flex justify-between items-center ${
                                cardLayout === lay.id
                                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                                  : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                              }`}
                            >
                              <span className="arabic-ui">{lay.label}</span>
                              {cardLayout === lay.id && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text Color Picker */}
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('features.designer.textColor')}</Label>
                        <div className="flex gap-3">
                          {[
                            { value: '#ffffff', name: 'أبيض' },
                            { value: '#d4af37', name: 'ذهبي هادئ' }
                          ].map((col) => (
                            <button
                              key={col.value}
                              onClick={() => setCardTextColor(col.value)}
                              className={`px-4 py-2 rounded-xl border text-xs font-semibold font-sans transition-all flex items-center justify-center gap-1.5 ${
                                cardTextColor === col.value 
                                  ? 'border-primary bg-primary/10 text-primary' 
                                  : 'border-border bg-muted/10 text-muted-foreground hover:bg-muted/20'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: col.value === '#d4af37' ? '#d4af37' : '#ffffff' }} />
                              <span className="arabic-ui">{col.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Size Sliders */}
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          {t('features.designer.textSize')}: {cardTextSize}px
                        </Label>
                        <Slider
                          value={[cardTextSize]}
                          onValueChange={(val) => setCardTextSize(val[0])}
                          min={24}
                          max={60}
                          step={2}
                          className="accent-primary"
                        />
                      </div>

                      {/* Exporter button */}
                      <Button
                        onClick={generateAyahImage}
                        disabled={!currentAyah}
                        className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white rounded-2xl font-bold text-xs md:text-sm gap-2 mt-4 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>{t('features.designer.btnDownload')}</span>
                      </Button>

                    </div>
                  </div>

                </div>
              </div>
            )}
            
            {/* Tab 2: Remembrances Hub (Global Dashboard, HisnMuslim, MemorialDua, AutoDhikrSettings) */}
            {activeTab === 'dua' && (
              <div className="w-full flex flex-col gap-6 items-center animate-fade-in max-w-4xl mx-auto">
                <GlobalRemembrances />
                
                {/* Hub Segment bar */}
                <div className="flex bg-muted/30 p-1 border border-border rounded-full items-center gap-1 w-full max-w-md shrink-0">
                  <button
                    onClick={() => setRemembranceSubTab('hisn')}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      remembranceSubTab === 'hisn'
                        ? 'bg-card border border-border shadow-sm text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isRtl ? 'أذكار حصن المسلم' : 'Hisn al-Muslim'}
                  </button>
                  <button
                    onClick={() => setRemembranceSubTab('deceased')}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      remembranceSubTab === 'deceased'
                        ? 'bg-card border border-border shadow-sm text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isRtl ? 'أدعية الفقيد' : 'Memorial Dua'}
                  </button>
                  <button
                    onClick={() => setRemembranceSubTab('settings')}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      remembranceSubTab === 'settings'
                        ? 'bg-card border border-border shadow-sm text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isRtl ? 'الأذكار الصوتية' : 'Auto Reminders'}
                  </button>
                </div>

                <div className="w-full mt-2">
                  {remembranceSubTab === 'hisn' && <HisnMuslim />}
                  {remembranceSubTab === 'deceased' && <MemorialDua />}
                  {remembranceSubTab === 'settings' && <AutoDhikrSettings />}
                </div>
              </div>
            )}
            
            {/* Tab 3: Khatmah communal and personal */}
            {activeTab === 'khatmah' && <SharedKhatmah />}

            {/* Tab 4: Multi-Reciter Quran Audio Hub */}
            {activeTab === 'dhikr' && <QuranAudioHub />}
            
            {/* Tab 5: Qibla & Prayer Times */}
            {activeTab === 'prayer' && (
              <div className="w-full flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
                <PrayerTimes />
                <QiblaFinder />
              </div>
            )}

          </div>
        </div>
      )}
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="arabic-ui font-bold text-lg text-foreground">
              {t('home.settings')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Font Size Option */}
            <div>
              <Label className="mb-2 block text-xs md:text-sm font-semibold">{t('home.fontSize')}</Label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    onClick={() => setFontSize(size)}
                    variant={fontSize === size ? 'default' : 'outline'}
                    className="flex-1 rounded-xl text-xs md:text-sm h-10"
                  >
                    {size === 'small' && t('home.fontSmall')}
                    {size === 'medium' && t('home.fontMedium')}
                    {size === 'large' && t('home.fontLarge')}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Quran Font Family Option */}
            <div>
              <Label className="mb-2 block text-xs md:text-sm font-semibold">{t('home.quranFont')}</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setQuranFont('amiri')}
                  variant={quranFont === 'amiri' ? 'default' : 'outline'}
                  className="flex-1 font-amiri rounded-xl text-sm h-10"
                >
                  Amiri (الأميري)
                </Button>
                <Button
                  onClick={() => setQuranFont('scheherazade')}
                  variant={quranFont === 'scheherazade' ? 'default' : 'outline'}
                  className="flex-1 font-scheherazade rounded-xl text-sm h-10"
                >
                  Scheherazade (شهرزاد)
                </Button>
              </div>
            </div>
            
            {/* Auto Interval Slider */}
            <div>
              <Label className="mb-2 block text-xs md:text-sm font-semibold">
                {t('home.autoInterval')}: {autoInterval} {t('home.seconds')}
              </Label>
              <Slider
                value={[autoInterval]}
                onValueChange={(v) => setAutoInterval(v[0])}
                min={10}
                max={60}
                step={5}
                className="accent-primary"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Favorites Dialog */}
      <Dialog open={showFavorites} onOpenChange={setShowFavorites}>
        <DialogContent className="sm:max-w-lg bg-card border border-border rounded-3xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="arabic-ui font-bold text-lg border-b border-border pb-3 text-foreground">
              {t('home.savedAyat')}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-2 mt-4 overflow-y-auto">
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {t('home.noFavorites')}
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map((fav) => (
                  <div
                    key={fav.ayah.number}
                    className="p-4 bg-muted/30 border border-border rounded-2xl flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs text-primary font-semibold arabic-ui">
                        {fav.ayah.surah.name} ({fav.ayah.surah.englishName}) — الآية {fav.ayah.number}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(fav.timestamp).toLocaleDateString()}
                      </span>
                    </div>
 
                    <p className={`${quranFont === 'amiri' ? 'font-amiri' : 'font-scheherazade'} text-lg md:text-xl text-foreground leading-relaxed text-center`}>
                      {fav.ayah.text}
                    </p>
 
                    <div className="flex justify-end gap-1.5 pt-2">
                      {/* Play */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          playFavorite(fav);
                          setShowFavorites(false);
                        }}
                        className="rounded-full h-8 px-3 text-xs gap-1 hover:bg-teal-500/10 hover:text-teal-600"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {t('home.play')}
                      </Button>
 
                      {/* Share */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => shareFavorite(fav)}
                        className="rounded-full h-8 px-3 text-xs gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {t('home.share')}
                      </Button>
 
                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromFavorites(fav.ayah.number)}
                        className="rounded-full h-8 px-3 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('home.remove')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
