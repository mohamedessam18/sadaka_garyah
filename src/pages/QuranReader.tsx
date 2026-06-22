import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Play, Pause, SkipForward, SkipBack, Eye, EyeOff, 
  BookOpen, Bookmark, BookmarkCheck, Copy, Image as ImageIcon, Search, X, List, Volume2,
  ChevronRight, ChevronLeft, FileText, LayoutGrid
} from 'lucide-react';
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
  hizbQuarter?: number;
  surah?: {
    number: number;
    name: string;
    englishName: string;
  };
}

interface SelectedAyah {
  number: number;
  numberInSurah: number;
  text: string;
  surahName: string;
}

interface SavedBookmark {
  ayahNo: number;
  numberInSurah: number;
  surahName: string;
  surahNumber: number;
  page: number;
  date: string;
}

interface SavedNote {
  ayahNo: number;
  numberInSurah: number;
  surahName: string;
  page: number;
  text: string;
  date: string;
}

const EDITION_MAPPING: Record<string, string> = {
  ar: 'ar.muyassar',
  en: 'en.asad',
  id: 'id.indonesian',
  es: 'es.cortes'
};

const TAFSIR_EDITIONS = [
  { id: 'ar.muyassar', name: 'تفسير الميسر' },
  { id: 'ar.jalalayn', name: 'تفسير الجلالين' }
];

const SURAH_START_PAGES = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, // 1-10
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312, // 11-20
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, // 21-30
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467, // 31-40
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, // 41-50
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549, // 51-60
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, // 61-70
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585, // 71-80
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594, // 81-90
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599, // 91-100
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603, // 101-110
  603, 604, 604, 604 // 111-114
];

const JUZ_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 221, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

const RECITERS_LIST = [
  { identifier: 'ar.alafasy', name: 'مشاري العفاسي', englishName: 'Mishary Alafasy' },
  { identifier: 'ar.minshawi', name: 'محمد صديق المنشاوي', englishName: 'Siddiq Al-Minshawi' },
  { identifier: 'ar.husary', name: 'محمود خليل الحصري', englishName: 'Mahmoud Al-Husary' },
  { identifier: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد', englishName: 'Abdul Basit' },
  { identifier: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', englishName: 'Maher Al-Muaiqly' },
  { identifier: 'ar.ghamadi', name: 'سعد الغامدي', englishName: 'Saad Al-Ghamdi' }
];

// Helper to convert number to Arabic numerals
const toArabicNumber = (num: number): string => {
  return String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

// Helper to determine Juz of a page
const getJuzOfPage = (page: number): number => {
  for (let i = JUZ_PAGES.length - 1; i >= 0; i--) {
    if (page >= JUZ_PAGES[i]) return i + 1;
  }
  return 1;
};

export const QuranReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const surahIdParam = Number(id);

  // Layout View State ('index' dashboard or 'reader' view)
  const [viewMode, setViewMode] = useState<'index' | 'reader'>('index');

  // Reader Core State
  const [activePageNumber, setActivePageNumber] = useState<number>(1);
  const [surahMeta, setSurahMeta] = useState<{ number: number; name: string; englishName: string; numberOfAyahs: number } | null>(null);
  const [ayahs, setAyahs] = useState<CombinedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Immersive Mode
  const [immersiveMode, setImmersiveMode] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  
  // Custom Themes & Settings
  const [quranTheme, setQuranTheme] = useState<'cream' | 'dark' | 'emerald'>('dark'); // Default dark exactly like screenshot
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [quranFont, setQuranFont] = useState<'amiri' | 'scheherazade' | 'hafs'>('hafs');
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Audio Playback
  const [selectedReciter, setSelectedReciter] = useState<string>('ar.alafasy');
  const [currentPlayingAyahNo, setCurrentPlayingAyahNo] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [currentRepeatIndex, setCurrentRepeatIndex] = useState<number>(0);
  const audioMuted = false;
  const [showPlayerPanel, setShowPlayerPanel] = useState<boolean>(false);

  // Multi-Ayah Selection Mode
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [selectedAyahs, setSelectedAyahs] = useState<SelectedAyah[]>([]);

  // Bookmarks, Notes, and Last Read history
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [lastReadPage, setLastReadPage] = useState<number | null>(null);

  // Index Tab Menu
  const [indexTab, setIndexTab] = useState<'surahs' | 'juz' | 'notes' | 'bookmarks'>('surahs');
  const [surahList, setSurahList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Ayah Action Bottom Sheet & Tafsir
  const [selectedAyahForMenu, setSelectedAyahForMenu] = useState<CombinedAyah | null>(null);
  const [fetchedTafsir, setFetchedTafsir] = useState<string>('');
  const [tafsirEdition, setTafsirEdition] = useState<string>('ar.muyassar');
  const [loadingTafsir, setLoadingTafsir] = useState<boolean>(false);

  // Notes addition form inside menu
  const [noteWritingText, setNoteWritingText] = useState<string>('');
  const [isWritingNote, setIsWritingNote] = useState<boolean>(false);

  // Tajweed mode
  const [showTajweed, setShowTajweed] = useState<boolean>(false);
  // Map: verse_key (e.g. "2:3") -> tajweed HTML string
  const [tajweedMap, setTajweedMap] = useState<Record<string, string>>({});

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayNextPageRef = useRef<boolean>(false);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Touch Swipe Gesture Refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Load preferences, bookmarks, history on mount
  useEffect(() => {
    // Bookmarks
    const savedBookmarks = localStorage.getItem('quran-bookmarks-list');
    if (savedBookmarks) {
      try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) { console.error(e); }
    }
    // Notes
    const savedNotes = localStorage.getItem('quran-notes-list');
    if (savedNotes) {
      try { setNotes(JSON.parse(savedNotes)); } catch (e) { console.error(e); }
    }
    // Last read page
    const savedLastRead = localStorage.getItem('quran-last-read');
    if (savedLastRead) {
      setLastReadPage(Number(savedLastRead));
    }
    // Theme
    const savedTheme = localStorage.getItem('quran-reader-theme');
    if (savedTheme) {
      setQuranTheme(savedTheme as any);
    }
    // Font settings
    const savedFontSize = localStorage.getItem('quran-font-size');
    if (savedFontSize) { setFontSize(savedFontSize as any); }
    const savedFont = localStorage.getItem('quran-font');
    if (savedFont) { setQuranFont(savedFont as any); }

    // Fetch Surah list
    const fetchSurahList = async () => {
      try {
        const list = await quranService.getSurahs();
        setSurahList(list);
      } catch (err) {
        console.error('Error loading Surahs:', err);
      }
    };
    fetchSurahList();
  }, []);

  // Sync Preferences to localStorage
  useEffect(() => {
    localStorage.setItem('quran-reader-theme', quranTheme);
  }, [quranTheme]);

  useEffect(() => {
    localStorage.setItem('quran-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('quran-font', quranFont);
  }, [quranFont]);

  // Handle URL change
  useEffect(() => {
    if (surahIdParam && surahIdParam >= 1 && surahIdParam <= 114) {
      const targetPage = SURAH_START_PAGES[surahIdParam - 1];
      setActivePageNumber(targetPage);
      setViewMode('reader');
    } else {
      const queryParams = new URLSearchParams(window.location.search);
      const pageParam = Number(queryParams.get('page'));
      if (pageParam && pageParam >= 1 && pageParam <= 604) {
        setActivePageNumber(pageParam);
        setViewMode('reader');
      } else {
        setViewMode('index');
      }
    }
  }, [id]);

  // Load Page details & audio based on activePageNumber & Reciter
  useEffect(() => {
    if (viewMode !== 'reader') return;

    const fetchPageData = async () => {
      setLoading(true);
      setCurrentPlayingAyahNo(null);
      setIsPlaying(false);
      
      const translationEdition = EDITION_MAPPING[i18n.language] || 'en.asad';
      
      try {
        const [arabicRes, translationRes, audioRes] = await Promise.all([
          quranService.getPageText(activePageNumber),
          quranService.getPageTranslation(activePageNumber, translationEdition),
          quranService.getPageAudio(activePageNumber)
        ]);

        const pageAyahs = arabicRes.ayahs;
        const translationAyahs = translationRes.ayahs;
        const audioAyahs = audioRes.ayahs;
        
        // Fetch audio for selected reciter if it's not the default Alafasy
        let audioUrls = audioRes.ayahs.map((a: any) => a.audio);
        if (selectedReciter !== 'ar.alafasy') {
          try {
            const pageAudioRes = await quranService.getPageAudio(activePageNumber);
            // Translate default alafasy audio to selected reciter endpoint
            audioUrls = pageAudioRes.ayahs.map((ayah: any) => {
              return ayah.audio.replace('ar.alafasy', selectedReciter);
            });
          } catch (audioErr) {
            console.error('Failed to load custom reciter audio, falling back to Alafasy:', audioErr);
          }
        }

        // Merge Arabic text, translation text, and custom audio url for each Ayah
        const mergedAyahs = pageAyahs.map((ayah: any, idx: number) => {
          let textCleaned = ayah.text;
          
          // Matches any bismillah variant by normalizing: strip diacritics then compare
          if (ayah.surah.number !== 1 && ayah.surah.number !== 9 && ayah.numberInSurah === 1) {
            const stripped = textCleaned.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '').replace(/\s+/g, ' ').trimStart();
            const bismillahBase = 'بسم الله الرحمن الرحيم';
            if (stripped.startsWith(bismillahBase)) {
              let consumedBase = 0;
              let cutIdx = 0;
              for (let ci = 0; ci < textCleaned.length && consumedBase < bismillahBase.length; ci++) {
                const ch = textCleaned[ci];
                const isDiacritic = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/.test(ch);
                if (!isDiacritic) {
                  if (ch === ' ') {
                    if (bismillahBase[consumedBase] === ' ') consumedBase++;
                  } else {
                    consumedBase++;
                  }
                }
                cutIdx = ci + 1;
              }
              textCleaned = textCleaned.substring(cutIdx).trimStart();
            }
          }

          return {
            number: ayah.number,
            numberInSurah: ayah.numberInSurah,
            text: textCleaned,
            translation: translationAyahs[idx]?.text || '',
            audio: audioUrls[idx] || audioAyahs[idx]?.audio || '',
            juz: ayah.juz,
            page: ayah.page,
            hizbQuarter: ayah.hizbQuarter,
            surah: ayah.surah
          };
        });

        setAyahs(mergedAyahs);

        // Find the most prominent Surah on this page
        const firstAyahSurah = pageAyahs[0]?.surah;
        if (firstAyahSurah) {
          setSurahMeta({
            number: firstAyahSurah.number,
            name: firstAyahSurah.name,
            englishName: firstAyahSurah.englishName,
            numberOfAyahs: firstAyahSurah.numberOfAyahs
          });
        }

        // Save Last Read Page
        localStorage.setItem('quran-last-read', String(activePageNumber));
        setLastReadPage(activePageNumber);

        // Fetch Tajweed data in background (non-blocking)
        quranService.getPageTajweed(activePageNumber)
          .then(map => setTajweedMap(map))
          .catch(err => console.warn('Tajweed fetch failed (non-critical):', err));

        // Auto play next page if coming from continuous recitation
        if (autoPlayNextPageRef.current) {
          setCurrentPlayingAyahNo(mergedAyahs[0]?.number);
          setIsPlaying(true);
          autoPlayNextPageRef.current = false;
        }
      } catch (error) {
        console.error('Error fetching page data:', error);
        toast.error(isRtl ? 'حدث خطأ في تحميل الصفحة' : 'Error loading page');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [activePageNumber, selectedReciter, i18n.language, viewMode]);

  // Audio Playback Listener Logic
  const handleAudioEnded = () => {
    if (currentPlayingAyahNo !== null) {
      const currentIndex = ayahs.findIndex(a => a.number === currentPlayingAyahNo);
      
      // Looping repetition helper
      if (currentRepeatIndex < repeatCount - 1) {
        setCurrentRepeatIndex(prev => prev + 1);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
        return;
      }

      // Reset repeat counter
      setCurrentRepeatIndex(0);

      if (currentIndex !== -1 && currentIndex < ayahs.length - 1) {
        // Next Ayah on same page
        setCurrentPlayingAyahNo(ayahs[currentIndex + 1].number);
      } else {
        // Finished last ayah on the current page, go to next page
        if (activePageNumber < 604) {
          autoPlayNextPageRef.current = true;
          setActivePageNumber(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentPlayingAyahNo(null);
          toast.success(isRtl ? 'اكتمل الاستماع للمصحف الشريف 🤲' : 'Completed recitation of the Quran 🤲');
        }
      }
    }
  };

  const handleNextAyah = () => {
    if (currentPlayingAyahNo === null) {
      if (ayahs.length > 0) {
        setCurrentPlayingAyahNo(ayahs[0].number);
        setIsPlaying(true);
      }
    } else {
      const currentIndex = ayahs.findIndex(a => a.number === currentPlayingAyahNo);
      if (currentIndex !== -1 && currentIndex < ayahs.length - 1) {
        setCurrentPlayingAyahNo(ayahs[currentIndex + 1].number);
        setIsPlaying(true);
      } else {
        if (activePageNumber < 604) {
          autoPlayNextPageRef.current = true;
          setActivePageNumber(prev => prev + 1);
        }
      }
    }
  };

  const handlePrevAyah = () => {
    if (currentPlayingAyahNo !== null) {
      const currentIndex = ayahs.findIndex(a => a.number === currentPlayingAyahNo);
      if (currentIndex !== -1 && currentIndex > 0) {
        setCurrentPlayingAyahNo(ayahs[currentIndex - 1].number);
        setIsPlaying(true);
      } else {
        if (activePageNumber > 1) {
          autoPlayNextPageRef.current = true;
          setActivePageNumber(prev => prev - 1);
        }
      }
    }
  };

  // Skip Surah from Header
  const handlePrevSurah = () => {
    if (surahMeta && surahMeta.number > 1) {
      const prevSurahNo = surahMeta.number - 1;
      const targetPage = SURAH_START_PAGES[prevSurahNo - 1];
      setActivePageNumber(targetPage);
      navigate(`/quran/${prevSurahNo}`);
    }
  };

  const handleNextSurah = () => {
    if (surahMeta && surahMeta.number < 114) {
      const nextSurahNo = surahMeta.number + 1;
      const targetPage = SURAH_START_PAGES[nextSurahNo - 1];
      setActivePageNumber(targetPage);
      navigate(`/quran/${nextSurahNo}`);
    }
  };

  // Sync Audio Playback
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (currentPlayingAyahNo !== null) {
      const activeAyah = ayahs.find(a => a.number === currentPlayingAyahNo);
      if (activeAyah && activeAyah.audio) {
        // Resolve audio source URL based on selected reciter
        const audioUrl = activeAyah.audio.replace('ar.alafasy', selectedReciter);
        audioRef.current.src = audioUrl;
        
        if (isPlaying) {
          audioRef.current.play().catch((err) => {
            console.error('Audio play failed:', err);
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentPlayingAyahNo, selectedReciter]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      if (currentPlayingAyahNo === null && ayahs.length > 0) {
        setCurrentPlayingAyahNo(ayahs[0].number);
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Scroll active playing Ayah into view and center it
  useEffect(() => {
    if (currentPlayingAyahNo !== null && !immersiveMode) {
      const el = document.getElementById(`ayah-${currentPlayingAyahNo}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPlayingAyahNo, immersiveMode]);

  // Touch Swipe Handlers (Page navigation)
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
    const swipeThreshold = 60;

    // Swipe horizontally
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        // Swipe Left -> Next Page (in RTL Arabic, swipe left means page increases)
        if (activePageNumber < 604) {
          setActivePageNumber(prev => prev + 1);
        }
      } else {
        // Swipe Right -> Previous Page
        if (activePageNumber > 1) {
          setActivePageNumber(prev => prev - 1);
        }
      }
    }

    // Reset touch variables
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  // Bookmark toggler
  const toggleBookmark = (ayah: CombinedAyah) => {
    const isBookmarked = bookmarks.some(b => b.ayahNo === ayah.number);
    let updated: SavedBookmark[] = [];
    
    if (isBookmarked) {
      updated = bookmarks.filter(b => b.ayahNo !== ayah.number);
      toast.success(isRtl ? 'تمت إزالة العلامة المرجعية' : 'Bookmark removed');
    } else {
      const newB: SavedBookmark = {
        ayahNo: ayah.number,
        numberInSurah: ayah.numberInSurah,
        surahName: ayah.surah?.name || surahMeta?.name || 'سورة',
        surahNumber: ayah.surah?.number || surahMeta?.number || 1,
        page: ayah.page,
        date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
      };
      updated = [newB, ...bookmarks];
      toast.success(isRtl ? 'تم حفظ العلامة المرجعية' : 'Bookmark saved');
    }
    setBookmarks(updated);
    localStorage.setItem('quran-bookmarks-list', JSON.stringify(updated));
  };

  // Save Note for Ayah
  const saveNote = () => {
    if (!selectedAyahForMenu || !noteWritingText.trim()) return;
    
    const existingIndex = notes.findIndex(n => n.ayahNo === selectedAyahForMenu.number);
    let updated: SavedNote[] = [];
    
    const newNote: SavedNote = {
      ayahNo: selectedAyahForMenu.number,
      numberInSurah: selectedAyahForMenu.numberInSurah,
      surahName: selectedAyahForMenu.surah?.name || surahMeta?.name || 'سورة',
      page: selectedAyahForMenu.page,
      text: noteWritingText,
      date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
    };

    if (existingIndex !== -1) {
      updated = [...notes];
      updated[existingIndex] = newNote;
    } else {
      updated = [newNote, ...notes];
    }
    
    setNotes(updated);
    localStorage.setItem('quran-notes-list', JSON.stringify(updated));
    setIsWritingNote(false);
    toast.success(isRtl ? 'تم حفظ الملاحظة بنجاح 📝' : 'Note saved successfully 📝');
  };

  // Handle Ayah Click in Reader View
  const handleAyahClick = (ayah: CombinedAyah) => {
    if (multiSelectMode) {
      // Toggle selection in multi select mode
      const isSelected = selectedAyahs.some(a => a.number === ayah.number);
      if (isSelected) {
        setSelectedAyahs(prev => prev.filter(a => a.number !== ayah.number));
      } else {
        setSelectedAyahs(prev => [...prev, {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          surahName: ayah.surah?.name || surahMeta?.name || 'سورة'
        }]);
      }
    } else {
      // Open Options Bottom Sheet
      setSelectedAyahForMenu(ayah);
      setFetchedTafsir('');
      setLoadingTafsir(false);
      setIsWritingNote(false);
      
      // Load existing note text if present
      const existingNote = notes.find(n => n.ayahNo === ayah.number);
      setNoteWritingText(existingNote ? existingNote.text : '');
    }
  };

  // Fetch Tafsir on Demand for Bottom Sheet
  const handleFetchTafsir = async (ayahNo: number, edition: string) => {
    setLoadingTafsir(true);
    try {
      const text = await quranService.getAyahTafsir(ayahNo, edition);
      setFetchedTafsir(text);
    } catch (e) {
      console.error(e);
      setFetchedTafsir(isRtl ? 'تعذر جلب التفسير، يرجى المحاولة لاحقاً' : 'Could not load Tafsir');
    } finally {
      setLoadingTafsir(false);
    }
  };

  // Direct Image Exporter (Generates canvas and triggers download without navigating to home)
  const generateAyahImageDirect = (ayahsToExport: SelectedAyah[] | CombinedAyah[]) => {
    if (ayahsToExport.length === 0) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = 1080;
    canvas.width = width;
    
    const cardTextSize = 36;
    ctx.font = `${cardTextSize}px "Amiri", "UthmanicHafs", serif`;
    
    let textToDraw = '';
    let surahName = 'القرآن الكريم';
    let referenceText = '';
    
    if (ayahsToExport.length === 1) {
      const a = ayahsToExport[0];
      textToDraw = `${a.text} ﴿${toArabicNumber(a.numberInSurah)}﴾`;
      surahName = (a as any).surah?.name || (a as any).surahName || surahMeta?.name || 'سورة';
      referenceText = `سورة ${surahName}، آية ${a.numberInSurah}`;
    } else {
      textToDraw = ayahsToExport.map(a => `${a.text} ﴿${toArabicNumber(a.numberInSurah)}﴾`).join(' ');
      const uniqueSurahs = Array.from(new Set(ayahsToExport.map(a => (a as any).surah?.name || (a as any).surahName || '')));
      if (uniqueSurahs.length === 1) {
        surahName = uniqueSurahs[0];
        const numbers = ayahsToExport.map(a => a.numberInSurah);
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        referenceText = `سورة ${surahName}، الآيات ${min}-${max}`;
      } else {
        surahName = 'آيات من القرآن الكريم';
        referenceText = 'سور متعددة من القرآن الكريم';
      }
    }
    
    // Compute wrapped lines
    const words = textToDraw.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = width - 240;
    
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
    
    // Stretch canvas height dynamically
    const requiredHeight = 320 + totalTextHeight + 360;
    canvas.height = Math.max(1080, requiredHeight);
    
    const toastId = toast.loading(isRtl ? 'جاري تحضير وتصدير البطاقة كصورة...' : 'Generating card image...');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const baseUrl = import.meta.env.BASE_URL || '/';
    img.src = `${baseUrl}خلفية التصدير.png`.replace(/\/+/g, '/');
    
    img.onload = () => {
      const scale = canvas.width / img.width;
      const dWidth = img.width * scale;
      const dHeight = img.height * scale;
      const dx = 0;
      const dy = (canvas.height - dHeight) / 2;
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Sample background color
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        tempCtx.drawImage(img, 10, 10, 1, 1, 0, 0, 1, 1);
        const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
        ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      } else {
        ctx.fillStyle = '#022c22';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw template
      ctx.drawImage(img, dx, dy, dWidth, dHeight);
      
      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;
      
      // Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Amiri", "UthmanicHafs", serif';
      ctx.textAlign = 'center';
      
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
      
      const headerY = Math.max(dy + dHeight * 0.10, 100);
      ctx.fillText(formatSurahName(surahName), canvas.width / 2, headerY);
      
      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `${cardTextSize}px "Amiri", "UthmanicHafs", serif`;
      let currentY = (canvas.height / 2) - (totalTextHeight / 2) + (lineHeight / 2);
      
      lines.forEach((lineText) => {
        ctx.fillText(lineText, canvas.width / 2, currentY);
        currentY += lineHeight;
      });
      
      // Reference
      ctx.fillStyle = '#d4af37';
      ctx.font = '500 26px "Noto Sans Arabic", sans-serif';
      const metadataY = currentY - (lineHeight / 2) + 60;
      ctx.fillText(referenceText, canvas.width / 2, metadataY);
      
      // Footer
      ctx.shadowBlur = 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '500 20px "Noto Sans Arabic", sans-serif';
      ctx.fillText('صدقة جارية على روح', canvas.width / 2, canvas.height - 180);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 24px "Amiri", "UthmanicHafs", serif';
      ctx.fillText('محمد السيد رحمه الله', canvas.width / 2, canvas.height - 140);
      
      // Download trigger
      try {
        const link = document.createElement('a');
        const fileSuffix = ayahsToExport.length === 1 ? `ayah-${ayahsToExport[0].number}` : 'multi-ayahs';
        link.download = `sadaka-garyah-quran-${fileSuffix}.png`;
        link.href = canvas.toDataURL();
        link.click();
        toast.dismiss(toastId);
        toast.success(isRtl ? 'تم تصدير وحفظ الصورة بنجاح! 🎨' : 'Image exported successfully! 🎨');
      } catch (err) {
        console.error('Canvas export error:', err);
        toast.dismiss(toastId);
        toast.error(isRtl ? 'فشل تصدير الصورة بسبب قيود أمان المتصفح' : 'Failed to export image due to security policies');
      }
    };
    
    img.onerror = () => {
      toast.dismiss(toastId);
      toast.error(isRtl ? 'تعذر تحميل قالب التصدير' : 'Failed to load background template');
    };
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isRtl ? 'تم نسخ النص المختار' : 'Copied to clipboard');
  };

  // Jump to specific page
  const handleJumpToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= 604) {
      setActivePageNumber(pageNum);
      setViewMode('reader');
    }
  };

  // Index filters
  const filteredSurahs = surahList.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString() === searchQuery
  );

  // CSS themes matching screenshot exactly
  const THEME_CLASSES = {
    cream: {
      bg: 'bg-[#FAF6EE] dark:bg-[#FAF6EE]',
      card: 'bg-[#FAF6EE] text-[#1E1B15] border-amber-900/10 shadow-lg',
      text: 'text-[#1E1B15]',
      border: 'border-amber-900/10',
      activeText: 'text-[#8C6D3F]',
      badge: 'bg-amber-900/5 text-amber-900/80 border-amber-900/10',
      highlight: 'bg-amber-500/15 border-amber-500/30'
    },
    dark: {
      bg: 'bg-[#000000] dark:bg-[#000000]', // Solid pitch black matching screenshot
      card: 'bg-[#000000] text-[#ffffff] border-white/5 shadow-2xl',
      text: 'text-[#ffffff]',
      border: 'border-[#b58d3d]/15',
      activeText: 'text-[#b58d3d]',
      badge: 'bg-[#b58d3d]/10 text-[#b58d3d] border-[#b58d3d]/20',
      highlight: 'bg-[#b58d3d]/15 border-[#b58d3d]/30'
    },
    emerald: {
      bg: 'bg-[#021f1a] dark:bg-[#021f1a]',
      card: 'bg-[#032e26] text-[#EDF7F5] border-emerald-800/20 shadow-2xl',
      text: 'text-[#EDF7F5]',
      border: 'border-emerald-800/20',
      activeText: 'text-[#d4af37]',
      badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/30',
      highlight: 'bg-[#d4af37]/10 border-[#d4af37]/25'
    }
  };

  const selectedTheme = THEME_CLASSES[quranTheme];

  const FONT_SIZE_CLASSES = {
    small: 'text-lg md:text-xl',
    medium: 'text-xl md:text-2xl lg:text-3xl',
    large: 'text-2xl md:text-3xl lg:text-4xl'
  };

  const LEADING_CLASSES = {
    small: 'leading-[1.7]',
    medium: 'leading-[1.8]',
    large: 'leading-[1.95]'
  };

  const selectedFontFamily = quranFont === 'amiri' 
    ? '"Amiri", serif' 
    : quranFont === 'scheherazade' 
      ? '"Scheherazade New", serif' 
      : '"UthmanicHafs", "Amiri", serif';

  // Beautiful Golden Compass End-Of-Verse Ornament matching screenshot
  const renderAyahOrn = (num: number) => {
    const arNum = toArabicNumber(num);
    return (
      <span className="inline-block mx-1.5 align-middle select-none text-[#b58d3d] shrink-0" style={{ width: '28px', height: '28px' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <circle cx="50" cy="50" r="35" fill="none" stroke="#b58d3d" strokeWidth="6" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#b58d3d" strokeWidth="2" strokeDasharray="6 4" />
          <path d="M 50 8 L 50 15 M 50 85 L 50 92 M 8 50 L 15 50 M 85 50 L 92 50" stroke="#b58d3d" strokeWidth="5" />
          <path d="M 20 20 L 25 25 M 80 80 L 75 75 M 20 80 L 25 75 M 80 20 L 75 25" stroke="#b58d3d" strokeWidth="5" />
          <text x="50" y="58" textAnchor="middle" fontSize="28" fontWeight="bold" fill={quranTheme === 'cream' ? '#1E1B15' : '#ffffff'} fontFamily="sans-serif">
            {arNum}
          </text>
        </svg>
      </span>
    );
  };

  return (
    <div 
      ref={readerContainerRef}
      className={`min-h-screen w-full flex flex-col items-center select-none transition-colors duration-300 ${
        viewMode === 'reader' ? selectedTheme.bg : 'bg-[#000000] pb-20' // Solid black index page matching screenshot
      }`}
    >
      {/* Invisible HTML5 Audio Node */}
      <audio
        ref={(el) => {
          audioRef.current = el;
          if (el) {
            el.onended = handleAudioEnded;
            el.muted = audioMuted;
          }
        }}
      />

      {/* ==================== 1. INDEX & DASHBOARD VIEW ==================== */}
      {viewMode === 'index' && (
        <div className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in">
          {/* Page Header matching second screenshot */}
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="w-10 h-10" /> {/* Spacer */}
            <h1 className="text-xl font-bold text-[#b58d3d] arabic-ui">
              فهرس
            </h1>
            {/* Direct return to reader button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('reader')} 
              className="rounded-full bg-[#18181b] border border-white/5 text-[#b58d3d] w-10 h-10 hover:bg-[#27272a] transition-all"
            >
              <BookOpen className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Resume Card (Last Read) */}
          {lastReadPage && (
            <div 
              onClick={() => handleJumpToPage(lastReadPage)}
              className="w-full bg-[#121212] border border-[#b58d3d]/20 hover:border-[#b58d3d]/50 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#b58d3d]/10 flex items-center justify-center shrink-0">
                  <BookmarkCheck className="w-5.5 h-5.5 text-[#b58d3d]" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">
                    {isRtl ? 'متابعة القراءة' : 'Resume Reading'}
                  </span>
                  <h3 className="font-amiri font-bold text-sm text-white mt-0.5">
                    {isRtl ? `الصفحة رقم ${toArabicNumber(lastReadPage)}` : `Page Number ${lastReadPage}`}
                  </h3>
                </div>
              </div>
              <ArrowLeft className={`w-4 h-4 text-[#b58d3d] transition-transform duration-300 group-hover:-translate-x-1.5 ${isRtl ? '' : 'rotate-180'}`} />
            </div>
          )}

          {/* Tab Selector matching screenshot (Bookmarks, Notes, Juz', Index) */}
          <div className="flex bg-[#121212] p-1 border border-white/5 rounded-full items-center gap-1 w-full shrink-0">
            {[
              { id: 'bookmarks', name: 'المرجعيات', icon: Bookmark },
              { id: 'notes', name: 'الملاحظات', icon: FileText },
              { id: 'juz', name: 'الأجزاء', icon: LayoutGrid },
              { id: 'surahs', name: 'الفهرس', icon: List }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setIndexTab(tab.id as any)}
                  className={`flex-1 py-2.5 rounded-full text-[10px] font-bold transition-all duration-200 flex flex-col items-center gap-1 justify-center ${
                    indexTab === tab.id
                      ? 'bg-[#1e1e1e] text-[#b58d3d]' // Gold active color matching screenshot
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="arabic-ui">{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Surahs list */}
          {indexTab === 'surahs' && (
            <div className="flex flex-col gap-4">
              {/* Search bar matching screenshot */}
              <div className="w-full relative">
                <Search className="w-4.5 h-4.5 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في أسماء السور"
                  className="w-full h-11 pr-11 pl-4 rounded-2xl bg-[#121212] border border-white/5 text-sm text-right focus:outline-none focus:bg-[#1a1a1a] transition-all text-white placeholder-muted-foreground"
                  dir="rtl"
                />
              </div>

              {/* Grid of Surahs sorted and grouped by Juz' */}
              <div className="flex flex-col gap-3">
                {filteredSurahs.map((surah, index) => {
                  const startPage = SURAH_START_PAGES[surah.number - 1];
                  const juzOfSurah = getJuzOfPage(startPage);
                  
                  // Stateless Juz' divider calculation
                  const prevSurah = index > 0 ? filteredSurahs[index - 1] : null;
                  const prevStartPage = prevSurah ? SURAH_START_PAGES[prevSurah.number - 1] : null;
                  const prevJuzOfSurah = prevStartPage ? getJuzOfPage(prevStartPage) : null;
                  const showJuzHeader = prevJuzOfSurah !== juzOfSurah;

                  const isLastReadSurah = lastReadPage ? (
                    lastReadPage >= startPage && 
                    (surah.number === 114 || lastReadPage < SURAH_START_PAGES[surah.number])
                  ) : false;

                  return (
                    <React.Fragment key={surah.number}>
                      {showJuzHeader && (
                        <span className="text-[#b58d3d] font-bold text-[11px] pr-2 my-2 text-right w-full block border-r border-[#b58d3d]/30 font-sans uppercase">
                          الجزء {toArabicNumber(juzOfSurah)}
                        </span>
                      )}

                      <div
                        onClick={() => handleJumpToPage(startPage)}
                        className={`border rounded-2xl p-4 cursor-pointer flex items-center justify-between transition-all duration-200 ${
                          isLastReadSurah 
                            ? 'bg-[#2d2315] border-[#b58d3d]/40 shadow-md' // Brown/Gold tint highlight matching screenshot
                            : 'bg-[#111111] hover:bg-[#181818] border-white/5'
                        }`}
                      >
                        {/* Page Number Circle on Left */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-[#b58d3d]/15 text-[#b58d3d] font-bold font-sans text-xs flex items-center justify-center border border-[#b58d3d]/25">
                            {toArabicNumber(startPage)}
                          </span>
                        </div>

                        {/* Surah details on Right */}
                        <div className="text-right flex-1 pr-4">
                          <h4 className="font-amiri font-bold text-sm text-white">
                            {surah.name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-semibold font-sans block mt-1">
                            رقمها {toArabicNumber(surah.number)} _ آياتها {toArabicNumber(surah.numberOfAyahs)} _ {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Juz' grid */}
          {indexTab === 'juz' && (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNo) => {
                const startPage = JUZ_PAGES[juzNo - 1];
                return (
                  <div
                    key={juzNo}
                    onClick={() => handleJumpToPage(startPage)}
                    className="bg-[#111111] hover:bg-[#181818] border border-white/5 hover:border-[#b58d3d]/30 rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col gap-1 items-center justify-center"
                  >
                    <span className="text-[9px] text-[#888888] font-sans uppercase">
                      الجزء
                    </span>
                    <h3 className="font-amiri font-bold text-sm text-white">
                      {toArabicNumber(juzNo)}
                    </h3>
                    <span className="text-[9px] bg-[#b58d3d]/10 text-[#b58d3d] px-2 py-0.5 rounded font-sans font-semibold mt-1.5 border border-[#b58d3d]/10">
                      صـ {toArabicNumber(startPage)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Notes list */}
          {indexTab === 'notes' && (
            <div className="flex flex-col gap-3">
              {notes.length === 0 ? (
                <div className="text-center py-12 text-[#888888] text-xs flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 opacity-40 text-[#b58d3d]" />
                  <span>لا توجد ملاحظات وتدبرات مكتوبة حالياً</span>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.ayahNo}
                    onClick={() => handleJumpToPage(note.page)}
                    className="bg-[#111111] hover:bg-[#181818] border border-white/5 rounded-2xl p-4 cursor-pointer flex flex-col gap-2 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#b58d3d]/10 text-[#b58d3d] text-[9px] font-bold font-sans flex items-center justify-center">
                          ص {toArabicNumber(note.page)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-sans">{note.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-amiri font-bold text-xs text-white">
                          {note.surahName} • الآية {toArabicNumber(note.numberInSurah)}
                        </h4>
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = notes.filter(n => n.ayahNo !== note.ayahNo);
                            setNotes(updated);
                            localStorage.setItem('quran-notes-list', JSON.stringify(updated));
                          }}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-7 h-7"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Note text content */}
                    <p className="text-right text-xs text-gray-300 leading-relaxed bg-[#161616] p-2.5 rounded-xl border border-white/5 arabic-ui">
                      {note.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Bookmarks */}
          {indexTab === 'bookmarks' && (
            <div className="flex flex-col gap-3">
              {bookmarks.length === 0 ? (
                <div className="text-center py-12 text-[#888888] text-xs flex flex-col items-center gap-2">
                  <Bookmark className="w-8 h-8 opacity-40 text-[#b58d3d]" />
                  <span>لا توجد علامات مرجعية محفوظة حالياً</span>
                </div>
              ) : (
                bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.ayahNo}
                    onClick={() => handleJumpToPage(bookmark.page)}
                    className="bg-[#111111] hover:bg-[#181818] border border-white/5 rounded-2xl p-4 cursor-pointer flex items-center justify-between transition-all duration-200"
                  >
                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = bookmarks.filter(b => b.ayahNo !== bookmark.ayahNo);
                        setBookmarks(updated);
                        localStorage.setItem('quran-bookmarks-list', JSON.stringify(updated));
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <h4 className="font-amiri font-bold text-sm text-white">
                          {bookmark.surahName} • الآية {toArabicNumber(bookmark.numberInSurah)}
                        </h4>
                        <span className="text-[9px] text-muted-foreground font-sans block mt-0.5">
                          صفحة {toArabicNumber(bookmark.page)} • {bookmark.date}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-[#b58d3d]/10 text-[#b58d3d] flex items-center justify-center">
                        <BookmarkCheck className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== 2. QURAN READER VIEW ==================== */}
      {viewMode === 'reader' && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (immersiveMode) {
              setShowOverlays(prev => !prev);
            }
          }}
          className={`flex-1 w-full relative flex flex-col items-center select-none transition-colors duration-350 ${
            immersiveMode 
              ? 'fixed inset-0 z-[45] bg-[#000000] overflow-hidden pt-14 pb-16 px-3 flex flex-col justify-center' // Solid black in immersive mode
              : 'pb-24'
          }`}
        >
          {/* Header Bar matching first screenshot */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`${
              immersiveMode 
                ? `fixed top-0 left-0 right-0 z-50 border-b ${selectedTheme.border} ${selectedTheme.bg} shadow-md transition-all duration-300` 
                : 'sticky top-16 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-sm'
            } ${immersiveMode && !showOverlays ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
          >
            <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              {/* Left Column: Bookmark icon & Juz' */}
              <div className="flex items-center gap-1.5 text-[#b58d3d] font-bold text-xs select-none">
                <Bookmark className="w-4.5 h-4.5 fill-[#b58d3d] text-[#b58d3d] cursor-pointer" onClick={() => setViewMode('index')} />
                <span className="font-sans">الجزء {toArabicNumber(ayahs[0]?.juz || 1)}</span>
              </div>

              {/* Center Column: Index icon & Tafsir/Options book icon */}
              <div className="flex items-center gap-3 select-none">
                {/* Index Grid */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode('index')} 
                  className="text-[#b58d3d] hover:bg-[#b58d3d]/10 rounded-full w-8 h-8"
                >
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-none stroke-current stroke-2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </Button>
                {/* Book settings icon */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSettingsDrawer(true)} 
                  className="text-[#b58d3d] hover:bg-[#b58d3d]/10 rounded-full w-8 h-8"
                >
                  <BookOpen className="w-4.5 h-4.5" />
                </Button>
                {/* Immersive view toggle */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setImmersiveMode(!immersiveMode);
                    setShowOverlays(true);
                  }} 
                  className="text-[#b58d3d] hover:bg-[#b58d3d]/10 rounded-full w-8 h-8"
                >
                  {immersiveMode ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </Button>
              </div>

              {/* Right Column: Surah Chevrons & name in gold matching < غافر > */}
              {surahMeta && (
                <div className="flex items-center gap-1.5 text-[#b58d3d] font-amiri font-bold text-base md:text-lg select-none">
                  <ChevronRight className="w-4 h-4 cursor-pointer hover:scale-110 active:scale-95 transition-all" onClick={handlePrevSurah} />
                  <span>{surahMeta.name}</span>
                  <ChevronLeft className="w-4 h-4 cursor-pointer hover:scale-110 active:scale-95 transition-all" onClick={handleNextSurah} />
                </div>
              )}
            </div>
          </div>

          {/* Reader Content Grid */}
          <div className="w-full max-w-2xl mx-auto px-1 py-4 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="text-muted-foreground text-xs arabic-ui">{isRtl ? 'جاري تحميل آيات الذكر الحكيم...' : 'Loading Holy Verses...'}</span>
              </div>
            ) : (
              <div 
                className={`mushaf-card relative overflow-hidden flex flex-col justify-between p-2.5 md:p-6 transition-all duration-350 ${selectedTheme.card}`}
                style={{
                  minHeight: immersiveMode ? 'calc(100dvh - 120px)' : '60vh',
                }}
              >
                {/* Double vertical borders in gold on left/right matching screenshot */}
                <div 
                  className="flex-1 flex flex-col justify-between py-1 px-4"
                  style={{
                    borderLeft: '3px double #b58d3d',
                    borderRight: '3px double #b58d3d',
                  }}
                >
                  {/* Top Bar Page Header inside Border */}
                  <div className="mushaf-header select-none flex justify-between items-center text-[#b58d3d] font-amiri font-bold text-xs border-b border-[#b58d3d]/20 pb-1.5 mb-3">
                    <span>الجزء {toArabicNumber(ayahs[0]?.juz)}</span>
                    <span>{surahMeta?.name}</span>
                  </div>

                  {/* Quranic Text Body */}
                  <div 
                    className="flex-1 flex flex-col justify-center py-2 select-text" 
                    dir="rtl"
                  >
                    {/* Surah Header / Frame (if first ayah on page is 1) */}
                    {ayahs[0]?.numberInSurah === 1 && (
                      <div className="w-full text-center mb-6">
                        <div className="border-2 border-double border-amber-600/40 bg-amber-600/5 rounded-2xl py-3 px-4 flex flex-col items-center shadow-sm">
                          <h3 className="font-amiri font-bold text-xl text-amber-700 dark:text-amber-500">
                            {surahMeta?.name}
                          </h3>
                          <span className="text-[10px] text-muted-foreground/80 font-sans font-semibold mt-1">
                            {surahMeta?.numberOfAyahs} {isRtl ? 'آية' : 'ayahs'} • {isRtl ? (ayahs[0]?.surah?.number === 1 ? 'مكية' : 'مدنية') : ayahs[0]?.surah?.englishName}
                          </span>
                        </div>
                        {/* Basmalah Frame */}
                        {ayahs[0]?.surah?.number !== 9 && ayahs[0]?.surah?.number !== 1 && (
                          <div className="bismillah-frame">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`text-justify font-hafs tracking-wide select-text ${LEADING_CLASSES[fontSize]}`}>
                      {ayahs.map((ayah) => {
                        const isPlayingNow = currentPlayingAyahNo === ayah.number;
                        const isSelected = selectedAyahs.some(a => a.number === ayah.number);

                        return (
                          <React.Fragment key={ayah.number}>
                            {/* Surah Title boundary if another Surah starts mid-page */}
                            {ayah.numberInSurah === 1 && ayah.number !== ayahs[0]?.number && (
                              <div className="w-full text-center my-6 block select-none">
                                <div className="border-2 border-double border-amber-600/40 bg-amber-600/5 rounded-2xl py-3 px-4 flex flex-col items-center">
                                  <h3 className="font-amiri font-bold text-xl text-amber-700 dark:text-amber-500">
                                    {ayah.surah?.name}
                                  </h3>
                                </div>
                                {ayah.surah?.number !== 9 && (
                                  <div className="bismillah-frame">
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Main Ayah inline span */}
                            <span 
                              id={`ayah-${ayah.number}`}
                              onClick={() => handleAyahClick(ayah)}
                              className={`quran-text transition-all duration-200 cursor-pointer inline rounded px-1 select-text ${
                                FONT_SIZE_CLASSES[fontSize]
                              } ${
                                isPlayingNow 
                                  ? selectedTheme.highlight + ' font-bold border-b border-dashed border-amber-500/40' 
                                  : isSelected
                                    ? 'bg-emerald-500/20 dark:bg-emerald-500/10 border-b border-dashed border-emerald-500/40'
                                    : 'hover:bg-muted/15'
                              } ${showTajweed ? 'tajweed-text' : ''}`}
                              style={{ 
                                fontFamily: selectedFontFamily,
                              }}
                            >
                              {showTajweed && tajweedMap[`${ayah.surah?.number}:${ayah.numberInSurah}`] ? (
                                // Tajweed mode: render colored HTML from quran.com
                                <span
                                  style={{ fontFamily: selectedFontFamily }}
                                  dangerouslySetInnerHTML={{
                                    __html: tajweedMap[`${ayah.surah?.number}:${ayah.numberInSurah}`]
                                  }}
                                />
                              ) : (
                                // Plain mode: text + golden ornament
                                <>
                                  {ayah.text}
                                  {/* Beautiful Custom Golden Compass Ornament */}
                                  {renderAyahOrn(ayah.numberInSurah)}
                                </>
                              )}
                            </span>

                            {/* Translation inline under each ayah (if enabled) */}
                            {showTranslation && (
                              <span className="block text-xs md:text-sm text-muted-foreground/90 font-sans text-right leading-relaxed mb-4 mt-1 border-r-2 border-[#b58d3d]/20 pr-3 pb-1 select-text">
                                {ayah.translation}
                              </span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Page Number Footer inside Border matching screenshot */}
                  <div className="mushaf-footer select-none flex justify-between items-center text-[#b58d3d] font-amiri font-bold text-xs border-t border-[#b58d3d]/20 pt-1.5 mt-3">
                    {/* Left: Page Number */}
                    <span className="font-sans font-bold">{toArabicNumber(activePageNumber)}</span>
                    
                    {/* Right: Hizb quarter indicator `< الحزب ٤٨ >` */}
                    <div className="flex items-center gap-1 font-bold text-xs select-none">
                      <span>‹</span>
                      <span>الحزب {toArabicNumber(Math.ceil((ayahs[0]?.hizbQuarter || 1) / 4))}</span>
                      <span>›</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Navigation Paddles for desktops */}
          {!immersiveMode && (
            <div className="fixed bottom-6 right-6 left-6 z-40 hidden md:flex items-center justify-between pointer-events-none">
              <Button
                onClick={() => activePageNumber > 1 && setActivePageNumber(prev => prev - 1)}
                disabled={activePageNumber === 1}
                className="w-12 h-12 rounded-full shadow-lg bg-card hover:bg-muted border border-border text-foreground pointer-events-auto flex items-center justify-center disabled:opacity-40"
              >
                <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-0' : 'rotate-180'}`} />
              </Button>
              <Button
                onClick={() => activePageNumber < 604 && setActivePageNumber(prev => prev + 1)}
                disabled={activePageNumber === 604}
                className="w-12 h-12 rounded-full shadow-lg bg-card hover:bg-muted border border-border text-foreground pointer-events-auto flex items-center justify-center disabled:opacity-40"
              >
                <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : 'rotate-0'}`} />
              </Button>
            </div>
          )}

          {/* Quick Page Navigator slider bottom overlays */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-between gap-4 transition-all duration-300 ${
              immersiveMode && !showOverlays ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
            }`}
          >
            <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-4 text-xs font-semibold">
              <span className="font-sans shrink-0">{toArabicNumber(activePageNumber)} / ٦٠٤</span>
              
              <input
                type="range"
                min="1"
                max="604"
                value={activePageNumber}
                onChange={(e) => setActivePageNumber(Number(e.target.value))}
                className="w-full accent-primary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activePageNumber > 1 && setActivePageNumber(prev => prev - 1)}
                  disabled={activePageNumber === 1}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  {isRtl ? '+' : '-'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activePageNumber < 604 && setActivePageNumber(prev => prev + 1)}
                  disabled={activePageNumber === 604}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  {isRtl ? '-' : '+'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. FLOATING AUDIO PLAYER PANEL ==================== */}
      {viewMode === 'reader' && showPlayerPanel && (
        <div 
          onClick={() => setShowPlayerPanel(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[60] flex items-end justify-center"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border-t border-border rounded-t-[32px] p-6 flex flex-col gap-5 shadow-2xl animate-slide-up"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto" />
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground arabic-ui">
                الاستماع والتحفيظ
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPlayerPanel(false)}
                className="rounded-full w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Reciter selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                القارئ المفضل
              </label>
              <select
                value={selectedReciter}
                onChange={(e) => setSelectedReciter(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-muted/60 border border-border text-sm font-semibold focus:outline-none focus:border-primary text-right"
                dir="rtl"
              >
                {RECITERS_LIST.map((rec) => (
                  <option key={rec.identifier} value={rec.identifier}>
                    {rec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Repetition controls block */}
            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-xs text-muted-foreground font-semibold">
                تكرار كل آية للحفظ
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 5, 10].map(count => (
                  <button
                    key={count}
                    onClick={() => setRepeatCount(count)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold font-sans transition-all ${
                      repeatCount === count 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {count}x
                  </button>
                ))}
              </div>
            </div>

            {/* Player Main Controls bar */}
            <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-primary hover:bg-primary/95 text-white shrink-0 shadow"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block font-sans">
                    {isPlaying ? 'جاري التشغيل' : 'متوقف'}
                  </span>
                  <h4 className="font-amiri font-bold text-sm text-foreground">
                    {currentPlayingAyahNo 
                      ? `${surahMeta?.name} • الآية ${toArabicNumber(ayahs.find(a => a.number === currentPlayingAyahNo)?.numberInSurah || 1)}` 
                      : 'اختر آية للبدء'}
                  </h4>
                </div>
              </div>

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevAyah}
                  className="rounded-full w-9 h-9"
                >
                  <SkipBack className="w-4.5 h-4.5 text-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextAyah}
                  className="rounded-full w-9 h-9"
                >
                  <SkipForward className="w-4.5 h-4.5 text-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. SETTINGS DRAWER PANEL ==================== */}
      {viewMode === 'reader' && showSettingsDrawer && (
        <div 
          onClick={() => setShowSettingsDrawer(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border-t border-border rounded-t-[32px] p-6 pb-8 flex flex-col gap-6 shadow-2xl animate-slide-up"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto" />
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground arabic-ui">
                خيارات القراءة والمظهر
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsDrawer(false)}
                className="rounded-full w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Theme Settings */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  سمة القراءة
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cream', name: 'ورقي بيج' },
                    { id: 'dark', name: 'ليلي مظلم' },
                    { id: 'emerald', name: 'عشبي ملكي' }
                  ].map(thm => (
                    <button
                      key={thm.id}
                      onClick={() => setQuranTheme(thm.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        quranTheme === thm.id 
                          ? 'border-[#b58d3d] bg-[#b58d3d]/10 text-[#b58d3d] font-bold shadow-sm' 
                          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {thm.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Settings */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  حجم خط المصحف
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', name: 'صغير' },
                    { id: 'medium', name: 'متوسط' },
                    { id: 'large', name: 'كبير' }
                  ].map(sz => (
                    <button
                      key={sz.id}
                      onClick={() => setFontSize(sz.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        fontSize === sz.id 
                          ? 'border-[#b58d3d] bg-[#b58d3d]/10 text-[#b58d3d] font-bold shadow-sm' 
                          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {sz.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  نوع خط الرسم العثماني
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'hafs', name: 'رسم المدينة' },
                    { id: 'amiri', name: 'الأميري' },
                    { id: 'scheherazade', name: 'شهرزاد' }
                  ].map(fnt => (
                    <button
                      key={fnt.id}
                      onClick={() => setQuranFont(fnt.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        quranFont === fnt.id 
                          ? 'border-[#b58d3d] bg-[#b58d3d]/10 text-[#b58d3d] font-bold shadow-sm' 
                          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {fnt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Translation Toggles */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-foreground">
                    عرض الترجمة فورياً
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    إظهار ترجمة معاني الآيات أسفل كل آية
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={(e) => setShowTranslation(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#b58d3d] cursor-pointer"
                />
              </div>

              {/* Tajweed Color Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-foreground">
                    ألوان التجويد 🎨
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    تلوين أحكام التجويد (غنة، مد، إخفاء…)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showTajweed}
                  onChange={(e) => setShowTajweed(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#b58d3d] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 5. AYAH MENU / OPTIONS BOTTOM SHEET ==================== */}
      {viewMode === 'reader' && selectedAyahForMenu && (
        <div 
          onClick={() => setSelectedAyahForMenu(null)}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[110] flex items-end justify-center"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#111111] border-t border-white/5 rounded-t-[32px] p-6 pb-8 flex flex-col gap-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto" />
            
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAyahForMenu(null)}
                className="rounded-full w-8 h-8 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="text-right">
                <h3 className="font-amiri font-bold text-lg text-white">
                  {surahMeta?.name} • الآية {toArabicNumber(selectedAyahForMenu.numberInSurah)}
                </h3>
                <span className="text-[9px] text-[#b58d3d] font-sans font-bold uppercase block mt-0.5">
                  الآية رقم {toArabicNumber(selectedAyahForMenu.number)} في المصحف
                </span>
              </div>
            </div>

            {/* Selected Ayah Arabic Text Preview */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-4.5 text-right font-hafs leading-[1.75] text-white select-text">
              {selectedAyahForMenu.text}
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAyahForMenu(null);
                  setCurrentPlayingAyahNo(selectedAyahForMenu.number);
                  setIsPlaying(true);
                }}
                className="rounded-xl text-xs gap-1.5 h-10 border-white/5 bg-[#181818] text-white hover:bg-[#202020] justify-start px-3"
              >
                <Volume2 className="w-4.5 h-4.5 text-[#b58d3d] shrink-0" />
                <span>الاستماع للآية</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => toggleBookmark(selectedAyahForMenu)}
                className={`rounded-xl text-xs gap-1.5 h-10 border-white/5 bg-[#181818] text-white hover:bg-[#202020] justify-start px-3 ${
                  bookmarks.some(b => b.ayahNo === selectedAyahForMenu.number) ? 'bg-[#2d2315] border-[#b58d3d]/30 text-[#b58d3d]' : ''
                }`}
              >
                <Bookmark className="w-4.5 h-4.5 text-[#b58d3d] shrink-0" />
                <span>حفظ علامة مرجعية</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleCopyToClipboard(selectedAyahForMenu.text)}
                className="rounded-xl text-xs gap-1.5 h-10 border-white/5 bg-[#181818] text-white hover:bg-[#202020] justify-start px-3"
              >
                <Copy className="w-4.5 h-4.5 text-teal-500 shrink-0" />
                <span>نسخ الآية</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setMultiSelectMode(true);
                  setSelectedAyahs([{
                    number: selectedAyahForMenu.number,
                    numberInSurah: selectedAyahForMenu.numberInSurah,
                    text: selectedAyahForMenu.text,
                    surahName: selectedAyahForMenu.surah?.name || surahMeta?.name || ''
                  }]);
                  setSelectedAyahForMenu(null);
                  toast.info(isRtl ? 'تم تفعيل وضع التحديد المتعدد' : 'Multi-select mode activated');
                }}
                className="rounded-xl text-xs gap-1.5 h-10 border-white/5 bg-[#181818] text-white hover:bg-[#202020] justify-start px-3"
              >
                <List className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <span>تحديد آيات متعددة</span>
              </Button>

              {/* Note Writing Toggle Button */}
              <Button
                variant="outline"
                onClick={() => setIsWritingNote(!isWritingNote)}
                className={`rounded-xl text-xs gap-1.5 h-10 border-white/5 bg-[#181818] text-white hover:bg-[#202020] justify-start px-3 ${
                  isWritingNote ? 'bg-[#2d2315] border-[#b58d3d]/30 text-[#b58d3d]' : ''
                }`}
              >
                <FileText className="w-4.5 h-4.5 text-[#b58d3d] shrink-0" />
                <span>كتابة ملاحظة / تدبّر</span>
              </Button>

              {/* DIRECT Canvas Image Exporter (Instant Download, No redirect) */}
              <Button
                onClick={() => {
                  generateAyahImageDirect([selectedAyahForMenu]);
                  setSelectedAyahForMenu(null);
                }}
                className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white rounded-xl text-xs gap-1.5 h-10 shadow-md transition-all font-bold"
              >
                <ImageIcon className="w-4.5 h-4.5 shrink-0" />
                <span>تصدير الصورة فورياً 🎨</span>
              </Button>
            </div>

            {/* Note writing expander form block */}
            {isWritingNote && (
              <div className="flex flex-col gap-2.5 border-t border-white/5 pt-4 animate-fade-in">
                <label className="text-[10px] text-muted-foreground uppercase font-bold text-right">
                  كتابة وتعديل ملاحظتك حول الآية
                </label>
                <textarea
                  value={noteWritingText}
                  onChange={(e) => setNoteWritingText(e.target.value)}
                  placeholder="اكتب تدبراتك أو ملاحظاتك الشخصية حول الآية الكريمة هنا..."
                  className="w-full h-24 p-3 rounded-xl bg-[#181818] border border-white/5 text-xs text-right text-white focus:outline-none focus:border-[#b58d3d] placeholder-muted-foreground/60 leading-relaxed arabic-ui"
                  dir="rtl"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsWritingNote(false)}
                    className="text-white hover:bg-white/10 rounded-lg text-xs"
                  >
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveNote}
                    className="bg-[#b58d3d] hover:bg-[#c99f4d] text-black font-bold rounded-lg text-xs px-4"
                  >
                    حفظ الملاحظة
                  </Button>
                </div>
              </div>
            )}

            {/* Tafsir Block */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-row-reverse">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#b58d3d]" />
                  <span>تفسير الآية والبيان</span>
                </h4>
                <div className="flex gap-1.5">
                  {TAFSIR_EDITIONS.map(ed => (
                    <button
                      key={ed.id}
                      onClick={() => {
                        setTafsirEdition(ed.id);
                        handleFetchTafsir(selectedAyahForMenu.number, ed.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        tafsirEdition === ed.id 
                          ? 'bg-[#b58d3d]/15 text-[#b58d3d] border border-[#b58d3d]/25' 
                          : 'bg-[#181818] hover:bg-[#202020] text-muted-foreground border border-transparent'
                      }`}
                    >
                      {ed.name}
                    </button>
                  ))}
                </div>
              </div>

              {fetchedTafsir ? (
                <div className="p-4 bg-[#181818] border border-white/5 rounded-2xl text-right arabic-ui text-xs md:text-sm leading-relaxed max-h-48 overflow-y-auto select-text text-gray-200">
                  {fetchedTafsir}
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleFetchTafsir(selectedAyahForMenu.number, tafsirEdition)}
                  disabled={loadingTafsir}
                  className="w-full text-xs h-9 gap-1 bg-[#181818] hover:bg-[#202020] border border-white/5 text-white"
                >
                  {loadingTafsir ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#b58d3d] border-t-transparent animate-spin" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 text-[#b58d3d]" />
                  )}
                  <span>عرض التفسير من الإنترنت</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. MULTI-AYAH SELECTION MODE FLOATING BAR ==================== */}
      {viewMode === 'reader' && multiSelectMode && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-14 left-0 right-0 z-50 p-4 bg-[#11161B] text-white border-t border-white/5 shadow-2xl flex items-center justify-between gap-4"
        >
          <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-sans font-bold text-xs flex items-center justify-center">
                {selectedAyahs.length}
              </span>
              <span className="text-xs font-semibold arabic-ui">
                آيات تم تحديدها
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setMultiSelectMode(false);
                  setSelectedAyahs([]);
                }}
                variant="ghost"
                className="text-white hover:bg-white/10 rounded-xl text-xs h-9 px-3"
              >
                إلغاء
              </Button>
              
              {/* Direct Canvas exporter for multi-selection */}
              <Button
                size="sm"
                disabled={selectedAyahs.length === 0}
                onClick={() => {
                  // Sort selected ayahs
                  const sorted = [...selectedAyahs].sort((a, b) => a.number - b.number);
                  generateAyahImageDirect(sorted);
                  setMultiSelectMode(false);
                  setSelectedAyahs([]);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs h-9 px-4 gap-1.5 shadow font-bold"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>تصدير الصورة فورياً 🎨</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
