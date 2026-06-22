import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Play, Pause } from 'lucide-react';
import { quranService, type Surah } from '../../services/quranService';
import { toast } from 'sonner';
import { useAudio, RECITERS } from '../../context/AudioContext';

export const QuranAudioHub: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    activeSurah,
    selectedReciter,
    isPlaying,
    isLoading,
    playSurah,
    togglePlay,
    changeReciter
  } = useAudio();

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

  // Filter Surahs
  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString() === searchQuery
  );

  const handleSurahClick = (surah: Surah) => {
    if (isLoading) return;
    const isActive = activeSurah?.number === surah.number;
    if (isActive) {
      togglePlay();
    } else {
      playSurah(surah);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in relative pb-12">
      
      {/* Search and Reciter Settings */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Reciter Selector */}
        <div className="w-full md:w-1/3 flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
            {isRtl ? 'القارئ' : 'Reciter'}
          </label>
          <select
            value={selectedReciter}
            onChange={(e) => changeReciter(e.target.value)}
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
              onClick={() => handleSurahClick(s)}
              className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 cursor-pointer select-none ${
                isActive
                  ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5'
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

    </div>
  );
};
