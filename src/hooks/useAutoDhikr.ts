import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export type DhikrPhraseType = 'salawat' | 'tasbih' | 'istighfar' | 'takbeer' | 'random';

export const DHIKR_TEXTS: Record<Exclude<DhikrPhraseType, 'random'>, string> = {
  salawat: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّد",
  tasbih: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيم",
  istighfar: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْه",
  takbeer: "اللَّهُ أَكْبَرُ كَبِيرًا ، وَالْحَمْدُ لِلَّهِ كَثِيرًا وَسُبْحَانَ اللَّهِ بُكْرَةً وَأَصِيلًا"
};

export const useAutoDhikr = () => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auto-dhikr-enabled') === 'true';
  });

  const [intervalMin, setIntervalMin] = useState<number>(() => {
    const saved = localStorage.getItem('auto-dhikr-interval');
    return saved ? Number(saved) : 15; // default 15 minutes
  });

  const [phrase, setPhrase] = useState<DhikrPhraseType>(() => {
    const saved = localStorage.getItem('auto-dhikr-phrase');
    return (saved as DhikrPhraseType) || 'salawat';
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state across instances (e.g. Settings Panel vs MainLayout timer)
  useEffect(() => {
    const handleSync = () => {
      setEnabled(localStorage.getItem('auto-dhikr-enabled') === 'true');
      const savedInt = localStorage.getItem('auto-dhikr-interval');
      setIntervalMin(savedInt ? Number(savedInt) : 15);
      const savedPhr = localStorage.getItem('auto-dhikr-phrase');
      setPhrase((savedPhr as DhikrPhraseType) || 'salawat');
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('dhikr-settings-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('dhikr-settings-sync', handleSync);
    };
  }, []);

  // Function to play sound using Speech Synthesis
  const playDhikr = useCallback((targetPhrase?: DhikrPhraseType) => {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    const selectedType = targetPhrase || phrase;
    let key: Exclude<DhikrPhraseType, 'random'>;
    
    if (selectedType === 'random') {
      const keys: Exclude<DhikrPhraseType, 'random'>[] = ['salawat', 'tasbih', 'istighfar', 'takbeer'];
      key = keys[Math.floor(Math.random() * keys.length)];
    } else {
      key = selectedType;
    }

    const textToSpeak = DHIKR_TEXTS[key];

    try {
      window.speechSynthesis.cancel(); // Stop any current speech
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ar-SA';
      
      // Load voices and select Arabic if available
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(voice => voice.lang.startsWith('ar'));
      if (arVoice) {
        utterance.voice = arVoice;
      }
      
      utterance.rate = 0.82; // Tranquil, calm speed
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis failed:", e);
    }
  }, [phrase]);

  // Persist settings & trigger sync event
  const updateEnabled = (val: boolean) => {
    localStorage.setItem('auto-dhikr-enabled', String(val));
    setEnabled(val);
    window.dispatchEvent(new Event('dhikr-settings-sync'));
  };

  const updateIntervalMin = (val: number) => {
    localStorage.setItem('auto-dhikr-interval', String(val));
    setIntervalMin(val);
    window.dispatchEvent(new Event('dhikr-settings-sync'));
  };

  const updatePhrase = (val: DhikrPhraseType) => {
    localStorage.setItem('auto-dhikr-phrase', val);
    setPhrase(val);
    window.dispatchEvent(new Event('dhikr-settings-sync'));
  };

  // Effect to manage background interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (enabled) {
      const intervalMs = intervalMin * 60 * 1000;
      
      intervalRef.current = setInterval(() => {
        playDhikr();
        toast.info("أذكار وتذكير بالخلفية", {
          description: "صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ",
          duration: 4000,
          icon: '📿',
        });
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMin, playDhikr]);

  return {
    enabled,
    setEnabled: updateEnabled,
    intervalMin,
    setIntervalMin: updateIntervalMin,
    phrase,
    setPhrase: updatePhrase,
    playDhikr
  };
};
