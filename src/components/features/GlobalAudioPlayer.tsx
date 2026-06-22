import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, 
  ChevronDown, X, Maximize2 
} from 'lucide-react';
import { useAudio, RECITERS } from '../../context/AudioContext';

export const GlobalAudioPlayer: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const {
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
    togglePlay,
    skipAyah,
    changeReciter,
    setVolume,
    setMuted,
    setCurrentTime,
    setIsExpanded,
    resetAudio,
    audioRef
  } = useAudio();

  if (!activeSurah) return null;

  const currentAyah = ayahsList[currentAyahIdx];
  const activeReciterObj = RECITERS.find(r => r.id === selectedReciter);

  // Time formatting helper
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  };

  // Close/reset player completely
  const stopPlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetAudio();
  };

  return (
    <>
      {/* 1. Minimized Spotify-like floating player bar */}
      {!isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-20 left-4 right-4 md:left-8 md:right-8 max-w-5xl mx-auto bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 z-45 flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(181,141,61,0.15)] select-none hover:-translate-y-[2px]"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          {/* Progress bar running along the bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-muted/40 rounded-b-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-100"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>

          {/* Left: Surah Title and Reciter info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Music className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-amber-500' : ''}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-foreground truncate">
                {isRtl ? activeSurah.name : activeSurah.englishName}
              </span>
              <span className="text-[9px] text-muted-foreground truncate">
                {isRtl ? 'الآية' : 'Ayah'} {currentAyahIdx + 1} / {ayahsList.length} • {activeReciterObj?.[isRtl ? 'nameAr' : 'nameEn']}
              </span>
            </div>
          </div>

          {/* Center (Desktop only): Current Ayah Text Preview */}
          {currentAyah && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-lg px-6 border-x border-border/40 mx-4">
              <p className="font-amiri text-xs font-semibold text-primary/90 truncate leading-relaxed text-center" dir="rtl">
                {currentAyah.text}
              </p>
            </div>
          )}

          {/* Right: mini-controls */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); skipAyah('prev'); }}
              className="p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center active:scale-95 transition-all shadow-sm shadow-primary/20"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-[0.5px]" />}
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); skipAyah('next'); }}
              className="p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={() => setIsExpanded(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground hidden sm:inline-block"
              title={isRtl ? 'تكبير المشغل' : 'Expand Player'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={stopPlayer}
              className="p-1.5 text-muted-foreground hover:text-red-500 active:scale-95 transition-all rounded-full hover:bg-muted/40"
              title={isRtl ? 'إغلاق المشغل' : 'Close Player'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Expanded Premium Full-Screen Player overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 bg-background/98 dark:bg-zinc-950/98 backdrop-blur-xl flex flex-col justify-between p-6 animate-fade-in select-none"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 bg-muted/40 hover:bg-muted/80 rounded-full transition-all text-foreground"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground">
                {isRtl ? 'المصحف المسموع' : 'Audio Quran'}
              </h2>
              <h3 className="text-sm font-bold text-foreground">
                {isRtl ? activeSurah.name : activeSurah.englishName}
              </h3>
            </div>

            <div className="w-9" /> {/* Spacer */}
          </div>

          {/* Center Content: Quranic Text and Translation (Spotify Lyrics Style) */}
          <div className="flex-1 my-8 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-4 overflow-y-auto min-h-0 py-4">
            {/* Elegant Golden Frame around Quranic text */}
            <div className="w-full flex flex-col gap-6 items-center text-center justify-center my-auto min-h-0">
              
              {/* Surah Details Header inside player */}
              <div className="mb-2">
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-mono font-bold">
                  {isRtl ? 'سورة رقم' : 'Surah No'} {activeSurah.number} • {activeSurah.numberOfAyahs} {isRtl ? 'آيات' : 'Ayahs'}
                </span>
              </div>

              {/* Dynamic Islamic Pattern Background behind text */}
              <div className="relative w-full max-w-2xl bg-card/40 dark:bg-zinc-900/30 border border-amber-500/10 rounded-[2.5rem] py-10 px-8 shadow-inner overflow-y-auto max-h-[45vh] flex flex-col justify-center items-center min-h-[150px]">
                
                {/* Active Ayah Arabic text */}
                {currentAyah ? (
                  <p 
                    className="font-amiri text-2xl md:text-3xl lg:text-4xl font-bold text-amber-600 dark:text-amber-500 leading-loose text-center animate-fade-in select-text" 
                    dir="rtl"
                  >
                    {currentAyah.text}
                  </p>
                ) : (
                  <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                )}

                {/* Translation of Active Ayah */}
                {currentAyah && currentAyah.translation && (
                  <p className="text-sm md:text-base text-muted-foreground font-sans text-center leading-relaxed mt-6 border-t border-border/20 pt-6 w-full max-w-xl select-text">
                    {currentAyah.translation}
                  </p>
                )}
              </div>

              {/* Reciter quick switcher in lyrics screen */}
              <div className="flex items-center gap-2 mt-4 max-w-xs w-full bg-muted/40 rounded-2xl p-1.5 border border-border/40">
                <span className="text-[10px] text-muted-foreground font-bold px-2 shrink-0">
                  {isRtl ? 'القارئ:' : 'Reciter:'}
                </span>
                <select
                  value={selectedReciter}
                  onChange={(e) => changeReciter(e.target.value)}
                  className="flex-1 bg-transparent outline-none border-none text-[11px] font-bold text-foreground cursor-pointer"
                >
                  {RECITERS.map(r => (
                    <option key={r.id} value={r.id} className="text-foreground bg-background">
                      {isRtl ? r.nameAr : r.nameEn}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Bottom Area: Controls, Scrubber and Volume */}
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 border-t border-border/20 pt-6">
            
            {/* Scrubber (Progress bar) */}
            <div className="w-full flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressChange}
                onInput={(e: any) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = parseFloat(e.target.value);
                  }
                }}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="flex items-center justify-between gap-4 py-2">
              
              {/* Left Button placeholder / repeat / loop options */}
              <div className="w-12 h-12 flex items-center justify-center">
                {/* We can place additional controls here like repeat or sharing */}
              </div>

              {/* Main Playback Controls */}
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => skipAyah('prev')}
                  className="p-3 text-muted-foreground hover:text-foreground active:scale-90 transition-all rounded-full hover:bg-muted/40"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="w-16 h-16 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-primary/20 hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-[2px]" />}
                </button>

                <button 
                  onClick={() => skipAyah('next')}
                  className="p-3 text-muted-foreground hover:text-foreground active:scale-90 transition-all rounded-full hover:bg-muted/40"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Volume Scrubber on expanded player */}
              <div className="flex items-center gap-2 w-32 justify-end">
                <button 
                  onClick={() => setMuted(!muted)} 
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/40"
                >
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};
