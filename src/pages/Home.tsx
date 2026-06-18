import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// Types
interface Ayah {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  juz: number;
  page: number;
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

// Reciters list (copied from App.tsx)
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
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoModeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const versePanelRef = useRef<HTMLDivElement>(null);
  const verseTextRef = useRef<HTMLParagraphElement>(null);
  const [versePanelHeightPx, setVersePanelHeightPx] = useState<number>(240);

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

    // Load initial ayah if welcome already seen
    if (hasSeenWelcome) {
      fetchRandomAyah();
    }
  }, []);
  
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
      
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}`);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        const ayah: Ayah = {
          number: data.data.number,
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

  // Fit the ايه placeholder height
  useEffect(() => {
    if (!currentAyah) return;
    if (!verseTextRef.current) return;

    const base = fontSize === 'small' ? 200 : fontSize === 'large' ? 280 : 240;
    const min = 180;
    const max = 560;

    let cancelled = false;

    const runFit = () => {
      if (cancelled) return;

      const textEl = verseTextRef.current;
      const panelEl = versePanelRef.current;
      if (!textEl || !panelEl) return;

      const needed = textEl.scrollHeight;
      const next = Math.max(min, Math.min(max, Math.ceil(needed + 24)));
      setVersePanelHeightPx(next);
    };

    const fontsReady = (document as any).fonts?.ready;
    if (fontsReady && typeof fontsReady.then === 'function') {
      void fontsReady.then(runFit);
    } else {
      runFit();
    }

    setVersePanelHeightPx(base);

    const onResize = () => {
      setVersePanelHeightPx(base);
      runFit();
    };

    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
  }, [currentAyah?.number, fontSize, quranFont]);

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
  
  // Handle audio error - fallback to another reciter
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
      return;
    }

    setAudioErrorMessage(t('home.loadingAyah'));
    toast.error(t('home.loadingAyah'));
  }, [audioError, currentAyah, currentReciter.identifier, resolveAudioSource, t]);
  
  // Auto mode effect
  useEffect(() => {
    if (autoMode) {
      autoModeRef.current = setInterval(() => {
        fetchRandomAyah();
      }, autoInterval * 1000);
    } else {
      if (autoModeRef.current) {
        clearInterval(autoModeRef.current);
        autoModeRef.current = null;
      }
    }
    
    return () => {
      if (autoModeRef.current) {
        clearInterval(autoModeRef.current);
      }
    };
  }, [autoMode, autoInterval, fetchRandomAyah]);
  
  // Audio ended handler
  const handleAudioEnded = () => {
    if (autoMode) {
      fetchRandomAyah();
    }
  };
  
  // Toggle favorite
  const toggleFavorite = () => {
    if (!currentAyah) return;
    
    const exists = favorites.some(f => f.ayah.number === currentAyah.number);
    
    if (exists) {
      setFavorites(prev => prev.filter(f => f.ayah.number !== currentAyah.number));
      toast.success(isRtl ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
    } else {
      setFavorites(prev => [...prev, { ayah: currentAyah, timestamp: Date.now() }]);
      toast.success(isRtl ? 'تمت الإضافة إلى المفضلة' : 'Added to favorites');
    }
  };
  
  const isFavorite = currentAyah ? favorites.some(f => f.ayah.number === currentAyah.number) : false;
  
  // Share functions
  const shareText = currentAyah 
    ? `${currentAyah.text}\n\n${currentAyah.surah.name} - الآية ${currentAyah.number}\n#SadakaJariyah`
    : '';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success(t('home.copied'));
    });
  };

  const getAyahShareText = (ayah: Ayah) =>
    `${ayah.text}\n\n${ayah.surah.name} - الآية ${ayah.number}\n#SadakaJariyah`;

  const shareFavorite = async (fav: Favorite) => {
    const text = getAyahShareText(fav.ayah);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Quran Ayah',
          text,
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      toast.success(t('home.copied'));
    } catch {
      toast.error(isRtl ? 'تعذر مشاركة الآية' : 'Could not share ayah');
    }
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
      setUsedReciters((prev) => [...prev, resolvedAudio.reciter.identifier]);
      setAudioUrl(resolvedAudio.url);

      setTimeout(() => {
        if (audioRef.current && !muted) {
          audioRef.current.play().catch(() => {});
        }
      }, 400);
    },
    [resolveAudioSource, currentReciter, muted, t]
  );
  
  // Generate ayah image
  const generateAyahImage = () => {
    if (!currentAyah || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 1080;
    canvas.height = 1920;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#115e59'); // deep teal
    gradient.addColorStop(1, '#064e3b'); // deep emerald
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.arc(540, 400, 300, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(540, 400, 250, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '500 32px "Noto Sans Arabic"';
    ctx.textAlign = 'center';
    ctx.fillText('آية من القرآن الكريم', 540, 200);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 48px "${quranFont === 'amiri' ? 'Amiri' : 'Scheherazade New'}"`;
    
    const words = currentAyah.text.split(' ');
    let line = '';
    let y = 500;
    const lineHeight = 80;
    const maxWidth = 900;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, 540, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 540, y);
    
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '500 36px "Noto Sans Arabic"';
    ctx.fillText(`${currentAyah.surah.name} - الآية ${currentAyah.number}`, 540, y + 100);
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 28px "Inter"';
    ctx.fillText('Sadaka Jariyah - Mohamed Elsayed Memorial', 540, 1800);
    
    const link = document.createElement('a');
    link.download = `ayah-${currentAyah.number}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    toast.success(isRtl ? 'تم تحميل الصورة' : 'Image downloaded');
  };
  
  // Get tafsir (Uses dynamic translation or simple Arabic Tafsir)
  const getTafsir = () => {
    if (!currentAyah) return t('home.loadingAyah');
    return isRtl 
      ? `تفسير الآية ${currentAyah.number} من سورة ${currentAyah.surah.name}. هذه الآية تحمل معانٍ عميقة في القرآن الكريم، ويُستحسن الرجوع إلى كتب التفسير المعتمدة مثل تفسير ابن كثير أو تفسير السعدي للمزيد من التفاصيل.`
      : `Tafsir of Ayah ${currentAyah.number} from Surah ${currentAyah.surah.englishName}. This verse carries profound spiritual reminders, encouraging believers to seek guidance, perform good deeds, and trust in Allah's limitless mercy.`;
  };
  
  // Font size classes
  const fontSizeClasses = {
    small: 'text-lg md:text-xl',
    medium: 'text-xl md:text-2xl lg:text-3xl',
    large: 'text-2xl md:text-3xl lg:text-4xl',
  };
  
  // Remove from favorites
  const removeFromFavorites = (ayahNumber: number) => {
    setFavorites(prev => prev.filter(f => f.ayah.number !== ayahNumber));
    toast.success(isRtl ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
  };

  return (
    <div className="flex-1 w-full bg-background transition-colors duration-300 relative py-12 px-4 md:px-8">
      {/* Hidden canvas for image generation */}
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
      
      {/* Main Content Layout */}
      {!showWelcomeModal && (
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Header Description */}
          <section className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-amiri text-foreground mb-3 leading-relaxed font-bold">
              {t('home.title')}
            </h1>
            <p className="max-w-xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
              {t('home.description')}
            </p>
          </section>

          {/* Random Ayah Card */}
          <div className="w-full bg-card rounded-[28px] card-shadow p-6 md:p-10 border border-border">
            {/* Ayah Verse Panel */}
            <div
              ref={versePanelRef}
              className="mb-6 mx-auto w-full rounded-2xl border border-border bg-muted/30 shadow-inner backdrop-blur-sm px-4 py-6 md:px-6 md:py-8 flex flex-col justify-between"
              style={{ minHeight: versePanelHeightPx }}
            >
              <div className="flex items-start justify-between mb-2">
                {currentAyah ? (
                  <span className="text-xs text-muted-foreground arabic-ui">
                    {currentAyah.surah.name} : {currentAyah.number}
                  </span>
                ) : <span />}
                {currentAyah ? (
                  <span className="text-xs text-muted-foreground font-sans">
                    Juz {currentAyah.juz} — Page {currentAyah.page}
                  </span>
                ) : null}
              </div>

              <div className="flex-1 flex items-center justify-center my-4">
                {currentAyah ? (
                  <p
                    ref={verseTextRef}
                    className={`${fontSizeClasses[fontSize]} ${
                      quranFont === 'amiri' ? 'font-amiri' : 'font-scheherazade'
                    } text-foreground leading-[2.1] text-center`}
                  >
                    {currentAyah.text}
                  </p>
                ) : (
                  <p className="text-muted-foreground arabic-ui">{t('home.loadingAyah')}</p>
                )}
              </div>
            </div>
            
            {/* Reciter Info */}
            {currentAyah && (
              <p className="text-center text-xs md:text-sm text-muted-foreground mb-6 arabic-ui">
                {t('home.reciter')}: <span className="font-semibold text-primary">{currentReciter.name}</span>
              </p>
            )}
            
            {/* Audio Player */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                muted={muted}
                className="w-full mb-6 accent-primary bg-muted/40 rounded-full"
                controls
              />
            )}
            {audioErrorMessage && (
              <p className="text-center text-xs text-destructive mb-6 arabic-ui">
                {audioErrorMessage}
              </p>
            )}
            
            {/* Main Controls Grid */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <Button
                onClick={fetchRandomAyah}
                disabled={isLoading}
                className="btn-pill bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md hover:shadow-lg rounded-full flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('home.newAyah')}
              </Button>
              
              {currentAyah && (
                <>
                  <Button
                    onClick={toggleFavorite}
                    variant="outline"
                    className={`btn-pill rounded-full gap-2 ${
                      isFavorite ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:border-red-500/30' : ''
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                    {isFavorite ? t('home.saved') : t('home.save')}
                  </Button>
                  
                  <Button
                    onClick={() => setShowFavorites(true)}
                    variant="outline"
                    className="btn-pill rounded-full gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    {t('home.favorites')} ({favorites.length})
                  </Button>
                </>
              )}

              {/* Settings Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="rounded-full w-12 h-12"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Secondary Option Toggles */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-border">
              {/* Auto Mode Switch */}
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border rounded-full">
                <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-medium">{t('home.auto')}</span>
                <Switch checked={autoMode} onCheckedChange={setAutoMode} />
              </div>
              
              {/* Tafsir Trigger */}
              {currentAyah && (
                <Button
                  onClick={() => setShowTafsir(!showTafsir)}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 ml-1 mr-1" />
                  {t('home.tafsir')}
                  {showTafsir ? <ChevronUp className="w-3 h-3 ml-1 mr-1" /> : <ChevronDown className="w-3 h-3 ml-1 mr-1" />}
                </Button>
              )}
              
              {/* Translation Trigger */}
              {currentAyah && (
                <Button
                  onClick={() => setShowTranslation(!showTranslation)}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                >
                  <Globe className="w-3.5 h-3.5 ml-1 mr-1" />
                  {t('home.translation')}
                  {showTranslation ? <ChevronUp className="w-3 h-3 ml-1 mr-1" /> : <ChevronDown className="w-3 h-3 ml-1 mr-1" />}
                </Button>
              )}
              
              {/* Copy Clipboard */}
              {currentAyah && (
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                >
                  <Copy className="w-3.5 h-3.5 ml-1 mr-1" />
                  {t('home.copy')}
                </Button>
              )}
              
              {/* Generate Image */}
              {currentAyah && (
                <Button
                  onClick={generateAyahImage}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 ml-1 mr-1" />
                  {t('home.image')}
                </Button>
              )}

              {/* Mute toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted(!muted)}
                className="rounded-full w-9 h-9"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Tafsir Box */}
            {showTafsir && currentAyah && (
              <div className="mt-6 p-5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-2xl animate-fade-in">
                <h3 className="text-teal-800 dark:text-teal-300 font-semibold mb-2 arabic-ui text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {t('home.tafsir')}
                </h3>
                <p className="text-foreground/80 arabic-ui text-sm leading-relaxed">
                  {getTafsir()}
                </p>
              </div>
            )}
            
            {/* Translation Box */}
            {showTranslation && translation && (
              <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl animate-fade-in">
                <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-2 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('home.translation')}
                </h3>
                <p className="text-[10px] text-blue-500/80 mb-2 font-mono">
                  {t('home.translatedTo')}: {currentLanguage.toUpperCase()} ({LANGUAGE_EDITIONS[currentLanguage] || 'en.sahih'})
                </p>
                <p className="text-foreground/80 text-sm leading-relaxed">
                  {translation.text}
                </p>
              </div>
            )}
            
            {/* Reflection Prompt Box */}
            {currentAyah && currentPrompt && (
              <div className="mt-6 p-5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl">
                <p className="text-purple-700 dark:text-purple-400 text-xs font-semibold mb-1 arabic-ui uppercase tracking-wide">
                  {t('home.reflection')}
                </p>
                <p className="text-foreground/90 arabic-ui text-base leading-relaxed">
                  {currentPrompt}
                </p>
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
