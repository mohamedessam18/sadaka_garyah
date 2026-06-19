import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Eye, Settings, Globe, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { quranService } from '../services/quranService';
import { toast } from 'sonner';

interface CombinedAyah {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
  audio: string;
  juz: number;
  page: number;
}

const EDITION_MAPPING: Record<string, string> = {
  ar: 'ar.muyassar',
  en: 'en.asad',
  id: 'id.indonesian',
  es: 'es.cortes'
};

export const QuranReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const surahId = Number(id) || 1;

  // State
  const [surahMeta, setSurahMeta] = useState<{ name: string; englishName: string; numberOfAyahs: number } | null>(null);
  const [ayahs, setAyahs] = useState<CombinedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audio playback state
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioMuted = false;
  
  // Reading UI settings
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [readingMode, setReadingMode] = useState<'bilingual' | 'arabicOnly'>('arabicOnly');
  const [showSettings, setShowSettings] = useState(false);
  const [activePageNumber, setActivePageNumber] = useState<number>(1);
  const [immersiveMode, setImmersiveMode] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  // Audio elements ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Touch swipe gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Pages in the current Surah
  const pagesInSurah = Array.from(new Set(ayahs.map(ayah => ayah.page))).sort((a, b) => a - b);
  const currentPageIndex = pagesInSurah.indexOf(activePageNumber) !== -1 ? pagesInSurah.indexOf(activePageNumber) : 0;
  const totalPages = pagesInSurah.length;

  // Filter ayahs to display only the ones on the active page
  const currentPageAyahs = ayahs.filter(ayah => ayah.page === activePageNumber);

  // Enable immersive mode by default on mobile screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setImmersiveMode(true);
    }
  }, []);

  // Scroll to top of the page when the page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePageNumber]);

  // Turn off immersive mode if user switches to bilingual layout
  useEffect(() => {
    if (readingMode === 'bilingual') {
      setImmersiveMode(false);
    }
  }, [readingMode]);

  // Touch handlers for page swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      touchEndX.current === null ||
      touchEndY.current === null
    ) {
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const swipeThreshold = 50;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        // Swipe Left -> Next Page (in RTL page swipe, dragging left goes to next page)
        if (currentPageIndex < totalPages - 1) {
          setActivePageNumber(pagesInSurah[currentPageIndex + 1]);
        }
      } else {
        // Swipe Right -> Previous Page
        if (currentPageIndex > 0) {
          setActivePageNumber(pagesInSurah[currentPageIndex - 1]);
        }
      }
    }

    // Reset touch variables
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  // Load Surah details & audio URLs
  useEffect(() => {
    const fetchSurahData = async () => {
      setLoading(true);
      setCurrentPlayingIndex(null);
      setIsPlaying(false);
      
      const translationEdition = EDITION_MAPPING[i18n.language] || 'en.asad';
      
      try {
        const [detailData, audioData] = await Promise.all([
          quranService.getSurahDetail(surahId, translationEdition),
          quranService.getSurahAudio(surahId)
        ]);

        const arabicEdition = detailData[0];
        const translationEditionData = detailData[1];

        setSurahMeta({
          name: arabicEdition.name,
          englishName: arabicEdition.englishName,
          numberOfAyahs: arabicEdition.numberOfAyahs
        });

        // Merge Arabic text, translation text, and Alafasy audio url for each Ayah
        const mergedAyahs: CombinedAyah[] = arabicEdition.ayahs.map((ayah, idx) => {
          let textCleaned = ayah.text;
          
          // Clean the Bismillah prefix from the text if it's not Surah Al-Fatihah (surah 1) or Surah At-Tawbah (surah 9)
          if (surahId !== 1 && surahId !== 9 && idx === 0) {
            const bismillahPrefix = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
            const alternatePrefix = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
            if (textCleaned.startsWith(bismillahPrefix)) {
              textCleaned = textCleaned.substring(bismillahPrefix.length).trim();
            } else if (textCleaned.startsWith(alternatePrefix)) {
              textCleaned = textCleaned.substring(alternatePrefix.length).trim();
            }
          }

          return {
            number: ayah.number,
            numberInSurah: ayah.numberInSurah,
            text: textCleaned,
            translation: translationEditionData.ayahs[idx]?.text || '',
            audio: audioData.ayahs[idx]?.audio || '',
            juz: ayah.juz,
            page: ayah.page
          };
        });

        setAyahs(mergedAyahs);
        const pages = Array.from(new Set(mergedAyahs.map(ayah => ayah.page))).sort((a, b) => a - b);
        if (pages.length > 0) {
          setActivePageNumber(pages[0]);
        }
      } catch (error) {
        console.error('Error fetching Surah data:', error);
        toast.error(isRtl ? 'حدث خطأ في تحميل السورة' : 'Error loading Surah');
      } finally {
        setLoading(false);
      }
    };

    fetchSurahData();
  }, [surahId, i18n.language]);

  // Audio ended listener - auto advance to next ayah
  const handleAudioEnded = () => {
    if (currentPlayingIndex !== null) {
      if (currentPlayingIndex < ayahs.length - 1) {
        setCurrentPlayingIndex(currentPlayingIndex + 1);
      } else {
        // finished last ayah
        setIsPlaying(false);
        setCurrentPlayingIndex(null);
        toast.success(isRtl ? 'اكتمل الاستماع للسورة' : 'Finished listening to the Surah');
      }
    }
  };

  // Playback handlers
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (currentPlayingIndex !== null) {
      const activeAyah = ayahs[currentPlayingIndex];
      if (activeAyah && activeAyah.audio) {
        audioRef.current.src = activeAyah.audio;
        
        if (isPlaying) {
          audioRef.current.play().catch((err) => {
            console.error('Audio playback failed:', err);
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentPlayingIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      if (currentPlayingIndex === null) {
        setCurrentPlayingIndex(0);
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Scroll active playing ayah into view
  useEffect(() => {
    if (currentPlayingIndex !== null) {
      const el = document.getElementById(`ayah-${currentPlayingIndex + 1}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPlayingIndex]);

  // Synchronize page turns when audio advances to an ayah on another page
  useEffect(() => {
    if (currentPlayingIndex !== null) {
      const activePlayAyah = ayahs[currentPlayingIndex];
      if (activePlayAyah && activePlayAyah.page !== activePageNumber) {
        setActivePageNumber(activePlayAyah.page);
      }
    }
  }, [currentPlayingIndex, ayahs, activePageNumber]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextAyah = () => {
    if (currentPlayingIndex === null) {
      setCurrentPlayingIndex(0);
      setIsPlaying(true);
    } else if (currentPlayingIndex < ayahs.length - 1) {
      setCurrentPlayingIndex(currentPlayingIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevAyah = () => {
    if (currentPlayingIndex !== null && currentPlayingIndex > 0) {
      setCurrentPlayingIndex(currentPlayingIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleAyahClick = (index: number) => {
    if (currentPlayingIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlayingIndex(index);
      setIsPlaying(true);
    }
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

  const activePlayingAyah = currentPlayingIndex !== null ? ayahs[currentPlayingIndex] : null;

  const fontSizeClasses = {
    small: 'text-lg md:text-xl leading-[2.1]',
    medium: 'text-xl md:text-2xl lg:text-3xl leading-[2.2]',
    large: 'text-2xl md:text-3xl lg:text-4xl leading-[2.3]'
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (immersiveMode) {
          setShowOverlays(prev => !prev);
        }
      }}
      className={`flex-1 w-full pb-24 relative flex flex-col items-center select-none transition-colors duration-300 ${
        immersiveMode 
          ? 'fixed inset-0 z-[45] bg-[#FAF6EE] dark:bg-[#080B0D] overflow-y-auto pt-24 pb-28 px-3' 
          : 'bg-background'
      }`}
    >
      {/* Invisible audio node */}
      <audio
        ref={(el) => {
          audioRef.current = el;
          if (el) {
            el.onended = handleAudioEnded;
            el.muted = audioMuted;
          }
        }}
      />

      {/* Reader Header Bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`${
          immersiveMode 
            ? 'fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md shadow-md transition-all duration-300' 
            : 'sticky top-16 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-sm'
        } ${immersiveMode && !showOverlays ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quran')}
            className="rounded-full gap-1 px-3 text-xs md:text-sm"
          >
            <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            {t('quran.back')}
          </Button>

          {/* Surah Name Meta */}
          {surahMeta && (
            <div className="text-center">
              <h2 className="font-amiri font-bold text-lg md:text-xl text-primary leading-tight">
                {surahMeta.name}
              </h2>
              <span className="text-[10px] text-muted-foreground font-sans block uppercase tracking-wider">
                {surahMeta.englishName} ({surahMeta.numberOfAyahs} ayahs)
              </span>
            </div>
          )}

          {/* Sticky Player Controls */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPlayingIndex === 0}
              onClick={isRtl ? handleNextAyah : handlePrevAyah}
              className="rounded-full w-9 h-9"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handlePlayPause}
              variant="default"
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/95 text-white w-10 h-10 shadow-sm"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              disabled={currentPlayingIndex === ayahs.length - 1}
              onClick={isRtl ? handlePrevAyah : handleNextAyah}
              className="rounded-full w-9 h-9"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Immersive/Mushaf Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              disabled={readingMode === 'bilingual'}
              onClick={() => {
                setImmersiveMode(!immersiveMode);
                setShowOverlays(true);
              }}
              className={`rounded-full w-9 h-9 ${immersiveMode ? 'bg-primary/10 text-primary' : ''} ${readingMode === 'bilingual' ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={immersiveMode ? t('quran.exitMushafMode') : t('quran.mushafMode')}
            >
              <BookOpen className="w-4 h-4" />
            </Button>

            {/* Quick settings gear */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-full w-9 h-9 ${showSettings ? 'bg-primary/10 text-primary' : ''}`}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Settings Bar (Collapsible) */}
        {showSettings && (
          <div className="border-t border-border/60 bg-muted/20 px-4 py-3 animate-fade-in">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
              
              {/* Font Size Settings */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">{t('home.fontSize')}:</span>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    onClick={() => setFontSize(size)}
                    variant={fontSize === size ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2.5 rounded-lg text-[10px]"
                  >
                    {size === 'small' && t('home.fontSmall')}
                    {size === 'medium' && t('home.fontMedium')}
                    {size === 'large' && t('home.fontLarge')}
                  </Button>
                ))}
              </div>

              {/* Bilingual / Arabic Mode */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">{t('quran.readingMode')}:</span>
                <Button
                  onClick={() => setReadingMode('bilingual')}
                  variant={readingMode === 'bilingual' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 px-3 rounded-lg text-[10px] gap-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {t('quran.bilingual')}
                </Button>
                <Button
                  onClick={() => setReadingMode('arabicOnly')}
                  variant={readingMode === 'arabicOnly' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 px-3 rounded-lg text-[10px] gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t('quran.arabicOnly')}
                </Button>
              </div>

              {/* Active Playing Info */}
              {activePlayingAyah && (
                <div className="flex items-center gap-1.5 text-primary font-semibold font-mono">
                  <span>{t('quran.activeAyah')}:</span>
                  <span>{activePlayingAyah.numberInSurah} / {ayahs.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reader Layout Container */}
      <div 
        className={`${
          immersiveMode 
            ? 'w-full max-w-2xl px-1.5 md:px-0 my-auto animate-fade-in' 
            : 'max-w-4xl w-full px-4 py-8'
        }`}
      >
        {immersiveMode ? (
          /* Real Mushaf Immersive Card */
          <div 
            onClick={(e) => {
              // Click inside margins/padding toggles overlays
              e.stopPropagation();
              setShowOverlays(prev => !prev);
            }}
            className="mushaf-card text-right w-full cursor-pointer"
          >
            <div className="mushaf-border-lines">
              {/* Mushaf Header (Juz & Surah) */}
              <div className="mushaf-header select-none">
                <span>{t('quran.juz')} {currentPageAyahs[0]?.juz || 1}</span>
                <span>{surahMeta?.name}</span>
              </div>

              {/* Bismillah Frame inside Mushaf */}
              {surahId !== 9 && currentPageAyahs.some(ayah => ayah.numberInSurah === 1) && (
                <div className="bismillah-frame select-none">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              {/* Mushaf Text Area */}
              <div 
                dir="rtl" 
                className={`font-hafs text-justify select-none ${
                  fontSize === 'small' 
                    ? 'text-lg md:text-xl' 
                    : fontSize === 'large' 
                    ? 'text-2xl md:text-3xl lg:text-4xl' 
                    : 'text-xl md:text-2xl lg:text-3xl'
                }`}
                style={{ 
                  lineHeight: fontSize === 'small' ? '2.8' : fontSize === 'large' ? '3.5' : '3.1',
                  textAlignLast: currentPageAyahs.length < 5 ? 'center' : 'justify'
                }}
              >
                {currentPageAyahs.map((ayah) => {
                  const globalIndex = ayahs.indexOf(ayah);
                  const isPlayingThis = currentPlayingIndex === globalIndex;
                  return (
                    <span
                      key={ayah.numberInSurah}
                      id={`ayah-${ayah.numberInSurah}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop click from toggling controls
                        handleAyahClick(globalIndex);
                      }}
                      className={`inline cursor-pointer transition-all duration-300 px-1 py-0.5 rounded-lg mx-0.5 ${
                        isPlayingThis
                          ? 'bg-primary/20 text-primary font-bold shadow-sm border-b-2 border-primary/60'
                          : 'hover:bg-primary/10'
                      }`}
                    >
                      {ayah.text}
                      {/* Ayah End Sign */}
                      <span className="text-primary text-[10px] md:text-xs font-bold inline-block mr-1 opacity-90 select-none font-sans">
                        ﴿{ayah.numberInSurah}﴾
                      </span>
                    </span>
                  );
                })}
              </div>

              {/* Mushaf Footer (Page Number) */}
              <div className="mushaf-footer select-none">
                <span>{activePageNumber}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Normal View (Not Immersive) */
          <>
            {/* Render beautiful Bismillah calligraphy at top, if not Surah At-Tawbah (Surah 9) */}
            {surahId !== 9 && (
              <div className="text-center my-8 select-none">
                <p className="font-hafs text-3xl md:text-4xl text-foreground/90 font-bold leading-loose">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto mt-4" />
              </div>
            )}

            {readingMode === 'arabicOnly' ? (
              /* Continuous paragraph layout (Mushaf Style) */
              <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 card-shadow text-right">
                <div 
                  dir="rtl" 
                  className={`font-hafs ${
                    fontSize === 'small' 
                      ? 'text-lg md:text-xl' 
                      : fontSize === 'large' 
                      ? 'text-2xl md:text-3xl lg:text-4xl' 
                      : 'text-xl md:text-2xl lg:text-3xl'
                  } text-foreground text-justify select-none`}
                  style={{ lineHeight: fontSize === 'small' ? '3.2' : fontSize === 'large' ? '3.8' : '3.5' }}
                >
                  {currentPageAyahs.map((ayah) => {
                    const globalIndex = ayahs.indexOf(ayah);
                    const isPlayingThis = currentPlayingIndex === globalIndex;
                    return (
                      <span
                        key={ayah.numberInSurah}
                        id={`ayah-${ayah.numberInSurah}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAyahClick(globalIndex);
                        }}
                        className={`inline cursor-pointer transition-all duration-300 px-1.5 py-1 rounded-xl mx-0.5 ${
                          isPlayingThis
                            ? 'bg-primary/20 text-primary font-bold shadow-sm border-b-2 border-primary/60'
                            : 'hover:bg-primary/10'
                        }`}
                      >
                        {ayah.text}
                        {/* Ayah End Sign */}
                        <span className="text-primary text-xs md:text-sm font-bold inline-block mr-1 opacity-90 select-none font-sans">
                          ﴿{ayah.numberInSurah}﴾
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* List of Ayahs (Bilingual Card Style) */
              <div className="space-y-6">
                {currentPageAyahs.map((ayah) => {
                  const globalIndex = ayahs.indexOf(ayah);
                  const isPlayingThis = currentPlayingIndex === globalIndex;
                  
                  return (
                    <div
                      key={ayah.numberInSurah}
                      id={`ayah-${ayah.numberInSurah}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAyahClick(globalIndex);
                      }}
                      className={`group p-6 md:p-8 bg-card border rounded-[2rem] transition-all duration-300 relative cursor-pointer select-none ${
                        isPlayingThis
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-border hover:border-primary/20 hover:shadow-sm'
                      }`}
                    >
                      {/* Ayah Meta Badge */}
                      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4 pointer-events-none text-muted-foreground/60">
                        <span className="text-[10px] font-bold font-mono tracking-widest bg-muted/80 px-2 py-0.5 rounded-full">
                          {surahId}:{ayah.numberInSurah}
                        </span>
                        
                        {/* juz & page info */}
                        <span className="text-[9px] font-mono tracking-wider font-sans">
                          JUZ {ayah.juz} • PAGE {ayah.page}
                        </span>
                      </div>

                      {/* Arabic Text */}
                      <div className="text-right my-4">
                        <p
                          className={`font-hafs ${fontSizeClasses[fontSize]} text-foreground leading-[2.1] font-medium text-balance`}
                        >
                          {ayah.text}
                          {/* Ayah End Ornamental Sign */}
                          <span className="text-primary text-sm md:text-base inline-block mr-2 select-none relative -top-1 font-bold font-sans">
                            ﴿{ayah.numberInSurah}﴾
                          </span>
                        </p>
                      </div>

                      {/* Translation / Interpretation Text */}
                      <div className="border-t border-border/40 pt-4 mt-4 text-left pointer-events-none">
                        <p className="text-xs text-primary font-mono mb-1.5 tracking-wider uppercase opacity-75">
                          {t('quran.translationTitle')}
                        </p>
                        <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                          {ayah.translation}
                        </p>
                      </div>
                      
                      {/* Playing visual indicator */}
                      {isPlayingThis && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 select-none pointer-events-none">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                          <span className="text-[9px] font-bold uppercase text-primary tracking-widest">{t('quran.activeAyah')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`${
            immersiveMode
              ? 'fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md p-4 shadow-lg transition-all duration-300 flex items-center justify-between'
              : 'max-w-4xl w-full px-4 flex items-center justify-between mt-8 pt-6 border-t border-border'
          } ${immersiveMode && !showOverlays ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentPageIndex === 0}
            onClick={() => setActivePageNumber(pagesInSurah[currentPageIndex - 1])}
            className="rounded-full text-xs font-semibold px-4 py-2"
          >
            {t('quran.prevPage')}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('quran.pageLabel')}</span>
            <select
              value={activePageNumber}
              onChange={(e) => setActivePageNumber(Number(e.target.value))}
              className="bg-card text-foreground border border-border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {pagesInSurah.map((pageNo) => (
                <option key={pageNo} value={pageNo}>
                  {pageNo}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              / {pagesInSurah[pagesInSurah.length - 1]}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPageIndex === totalPages - 1}
            onClick={() => setActivePageNumber(pagesInSurah[currentPageIndex + 1])}
            className="rounded-full text-xs font-semibold px-4 py-2"
          >
            {t('quran.nextPage')}
          </Button>
        </div>
      )}
    </div>
  );
};
