import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, CheckCircle, Award } from 'lucide-react';
import { KhatmahPlanner } from './KhatmahPlanner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface JuzState {
  number: number;
  surahRangeAr: string;
  surahRangeEn: string;
  status: 'available' | 'reserved' | 'completed';
  readerName?: string;
  isUserReservation?: boolean;
}

const JUZ_MAPPING: Array<{ number: number; rangeAr: string; rangeEn: string }> = [
  { number: 1, rangeAr: 'الفاتحة [1] - البقرة [141]', rangeEn: 'Al-Fatihah [1] - Al-Baqarah [141]' },
  { number: 2, rangeAr: 'البقرة [142] - البقرة [252]', rangeEn: 'Al-Baqarah [142] - Al-Baqarah [252]' },
  { number: 3, rangeAr: 'البقرة [253] - آل عمران [92]', rangeEn: 'Al-Baqarah [253] - Al-Imran [92]' },
  { number: 4, rangeAr: 'آل عمران [93] - النساء [23]', rangeEn: 'Al-Imran [93] - An-Nisa [23]' },
  { number: 5, rangeAr: 'النساء [24] - النساء [147]', rangeEn: 'An-Nisa [24] - An-Nisa [147]' },
  { number: 6, rangeAr: 'النساء [148] - المائدة [81]', rangeEn: 'An-Nisa [148] - Al-Maidah [81]' },
  { number: 7, rangeAr: 'المائدة [82] - الأنعام [110]', rangeEn: 'Al-Maidah [82] - Al-Anam [110]' },
  { number: 8, rangeAr: 'الأنعام [111] - الأعراف [87]', rangeEn: 'Al-Anam [111] - Al-Araf [87]' },
  { number: 9, rangeAr: 'الأعراف [88] - الأنفال [40]', rangeEn: 'Al-Araf [88] - Al-Anfal [40]' },
  { number: 10, rangeAr: 'الأنفال [41] - التوبة [92]', rangeEn: 'Al-Anfal [41] - At-Tawbah [92]' },
  { number: 11, rangeAr: 'التوبة [93] - هود [5]', rangeEn: 'At-Tawbah [93] - Hud [5]' },
  { number: 12, rangeAr: 'هود [6] - يوسف [52]', rangeEn: 'Hud [6] - Yusuf [52]' },
  { number: 13, rangeAr: 'يوسف [53] - إبراهيم [52]', rangeEn: 'Yusuf [53] - Ibrahim [52]' },
  { number: 14, rangeAr: 'الحجر [1] - النحل [128]', rangeEn: 'Al-Hijr [1] - An-Nahl [128]' },
  { number: 15, rangeAr: 'الإسراء [1] - الكهف [74]', rangeEn: 'Al-Isra [1] - Al-Kahf [74]' },
  { number: 16, rangeAr: 'الكهف [75] - طه [135]', rangeEn: 'Al-Kahf [75] - Ta-Ha [135]' },
  { number: 17, rangeAr: 'الأنبياء [1] - الحج [78]', rangeEn: 'Al-Anbiya [1] - Al-Hajj [78]' },
  { number: 18, rangeAr: 'المؤمنون [1] - الفرقان [20]', rangeEn: 'Al-Muminun [1] - Al-Furqan [20]' },
  { number: 19, rangeAr: 'الفرقان [21] - النمل [55]', rangeEn: 'Al-Furqan [21] - An-Naml [55]' },
  { number: 20, rangeAr: 'النمل [56] - العنكبوت [45]', rangeEn: 'An-Naml [56] - Al-Ankabut [45]' },
  { number: 21, rangeAr: 'العنكبوت [46] - الأحزاب [30]', rangeEn: 'Al-Ankabut [46] - Al-Ahzab [30]' },
  { number: 22, rangeAr: 'الأحزاب [31] - يس [27]', rangeEn: 'Al-Ahzab [31] - Ya-Sin [27]' },
  { number: 23, rangeAr: 'يس [28] - الزمر [31]', rangeEn: 'Ya-Sin [28] - Az-Zumar [31]' },
  { number: 24, rangeAr: 'الزمر [32] - فصلت [46]', rangeEn: 'Az-Zumar [32] - Fussilat [46]' },
  { number: 25, rangeAr: 'فصلت [47] - الجاثية [37]', rangeEn: 'Fussilat [47] - Al-Jathiyah [37]' },
  { number: 26, rangeAr: 'الأحقاف [1] - الذاريات [30]', rangeEn: 'Al-Ahqaf [1] - Adh-Dhariyat [30]' },
  { number: 27, rangeAr: 'الذاريات [31] - الحديد [29]', rangeEn: 'Adh-Dhariyat [31] - Al-Hadid [29]' },
  { number: 28, rangeAr: 'المجادلة [1] - التحريم [12]', rangeEn: 'Al-Mujadilah [1] - At-Tahrim [12]' },
  { number: 29, rangeAr: 'الملك [1] - المرسلات [50]', rangeEn: 'Al-Mulk [1] - Al-Mursalat [50]' },
  { number: 30, rangeAr: 'النبأ [1] - الناس [6]', rangeEn: 'An-Naba [1] - An-Nas [6]' },
];

export const SharedKhatmah: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<'communal' | 'personal'>('communal');
  const [juzList, setJuzList] = useState<JuzState[]>([]);
  const [khatmahCount, setKhatmahCount] = useState<number>(14);

  // Initialize Juz list state (communal)
  useEffect(() => {
    // Check localStorage for user reservations
    const userReservations = JSON.parse(localStorage.getItem('khatmah_user_res') || '[]') as number[];
    const userCompletions = JSON.parse(localStorage.getItem('khatmah_user_comp') || '[]') as number[];

    // Pseudo-random state generation based on the current calendar day
    const day = new Date().getDate();
    const list: JuzState[] = JUZ_MAPPING.map(item => {
      // User specific overrides
      if (userCompletions.includes(item.number)) {
        return {
          number: item.number,
          surahRangeAr: item.rangeAr,
          surahRangeEn: item.rangeEn,
          status: 'completed',
          readerName: isRtl ? 'أنت' : 'You',
          isUserReservation: true
        };
      }
      if (userReservations.includes(item.number)) {
        return {
          number: item.number,
          surahRangeAr: item.rangeAr,
          surahRangeEn: item.rangeEn,
          status: 'reserved',
          readerName: isRtl ? 'أنت (جاري القراءة)' : 'You (Reading)',
          isUserReservation: true
        };
      }

      // Pseudo-random initial generation (stable but looks like active community)
      // Generates status based on math hash
      const hash = (item.number * 7 + day * 13) % 100;
      if (hash < 65) {
        // 65% of Juz are completed
        const names = isRtl 
          ? ['فاعل خير', 'محب للخير', 'زائر', 'أبو عبد الله', 'أم محمد', 'أحمد'] 
          : ['Charity Reader', 'Visitor', 'Abu Abdullah', 'Um Mohamed', 'Ahmed'];
        const readerName = names[hash % names.length];
        return {
          number: item.number,
          surahRangeAr: item.rangeAr,
          surahRangeEn: item.rangeEn,
          status: 'completed',
          readerName
        };
      } else if (hash < 82) {
        // 17% are reserved
        const names = isRtl 
          ? ['فاعل خير (جاري القراءة)', 'زائر (جاري القراءة)', 'عمر (جاري القراءة)'] 
          : ['Wellwisher (Reading)', 'Visitor (Reading)', 'Omar (Reading)'];
        const readerName = names[hash % names.length];
        return {
          number: item.number,
          surahRangeAr: item.rangeAr,
          surahRangeEn: item.rangeEn,
          status: 'reserved',
          readerName
        };
      } else {
        // Remaining are available
        return {
          number: item.number,
          surahRangeAr: item.rangeAr,
          surahRangeEn: item.rangeEn,
          status: 'available'
        };
      }
    });

    setJuzList(list);

    // Seed overall completed khatmahs count
    const baseKhatmahs = 12 + Math.floor(day / 3);
    setKhatmahCount(baseKhatmahs);
  }, [isRtl]);

  // Live simulation of other visitors completing or reserving parts
  useEffect(() => {
    if (activeTab !== 'communal') return;

    const interval = setInterval(() => {
      // Pick a random Juz to modify
      const targetIdx = Math.floor(Math.random() * 30);
      setJuzList(prev => {
        const next = [...prev];
        const item = next[targetIdx];
        
        // Skip user reservations/completions to avoid breaking user flow
        if (item.isUserReservation) return prev;

        if (item.status === 'available') {
          // Simulate a reservation
          const names = isRtl ? ['فاعل خير', 'زائر', 'أبو أحمد'] : ['Communal Reader', 'Visitor', 'Abu Ahmed'];
          const reader = names[Math.floor(Math.random() * names.length)];
          next[targetIdx] = {
            ...item,
            status: 'reserved',
            readerName: isRtl ? `${reader} (جاري القراءة)` : `${reader} (Reading)`
          };
          toast.info(
            isRtl 
              ? `تم حجز الجزء ${item.number} من قبل أحد الزوار لقراءته لروح الفقيد.` 
              : `Juz ${item.number} has been reserved by a visitor.`
          );
        } else if (item.status === 'reserved') {
          // Simulate completion
          next[targetIdx] = {
            ...item,
            status: 'completed',
            readerName: item.readerName?.replace(/ \(جاري القراءة\)| \(Reading\)/g, '') || (isRtl ? 'فاعل خير' : 'Communal Reader')
          };
          toast.success(
            isRtl 
              ? `أتم أحد الزوار قراءة الجزء ${item.number} لروح الفقيد محمد السيد (تقبل الله).` 
              : `A visitor has completed reading Juz ${item.number} (May Allah accept).`
          );
        } else if (item.status === 'completed' && Math.random() < 0.2) {
          // Occasionally reset a completed Juz to available to simulate starting a new communal Khatmah
          next[targetIdx] = {
            ...item,
            status: 'available',
            readerName: undefined
          };
        }
        return next;
      });
    }, 45000); // Trigger simulation update every 45 seconds

    return () => clearInterval(interval);
  }, [activeTab, isRtl]);

  // Calculate statistics
  const completedCount = juzList.filter(j => j.status === 'completed').length;
  const progressPercent = Math.round((completedCount / 30) * 100);

  // If 100%, increment global count and reset communal grid after a delay
  useEffect(() => {
    if (completedCount === 30 && juzList.length > 0) {
      const timer = setTimeout(() => {
        setKhatmahCount(prev => prev + 1);
        // Reset communal items (except user achievements) to available/random to represent the start of the next Khatmah loop
        setJuzList(prev => prev.map(item => ({
          ...item,
          status: item.isUserReservation && item.status === 'completed' ? 'completed' : 'available',
          readerName: item.isUserReservation && item.status === 'completed' ? (isRtl ? 'أنت' : 'You') : undefined
        })));
        // Reset local completions to avoid infinite loop
        localStorage.setItem('khatmah_user_comp', '[]');
        localStorage.setItem('khatmah_user_res', '[]');
        toast.success(
          isRtl 
            ? 'الحمد لله، تم اكتمال الختمة بالكامل لروح الفقيد! جاري البدء في ختمة جديدة.' 
            : 'Masha\'Allah, the communal Khatmah is complete! Starting a new one.'
        );
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [completedCount, juzList.length, isRtl]);

  const reserveJuz = (juzNum: number) => {
    setJuzList(prev => prev.map(item => {
      if (item.number !== juzNum) return item;
      return {
        ...item,
        status: 'reserved',
        readerName: isRtl ? 'أنت (جاري القراءة)' : 'You (Reading)',
        isUserReservation: true
      };
    }));

    // Update localStorage
    const savedRes = JSON.parse(localStorage.getItem('khatmah_user_res') || '[]') as number[];
    if (!savedRes.includes(juzNum)) {
      localStorage.setItem('khatmah_user_res', JSON.stringify([...savedRes, juzNum]));
    }

    toast.success(isRtl ? `تم حجز الجزء ${juzNum} بنجاح. بانتظار قراءتك.` : `Reserved Juz ${juzNum} successfully.`);
  };

  const cancelReservation = (juzNum: number) => {
    setJuzList(prev => prev.map(item => {
      if (item.number !== juzNum) return item;
      return {
        ...item,
        status: 'available',
        readerName: undefined,
        isUserReservation: false
      };
    }));

    // Update localStorage
    const savedRes = JSON.parse(localStorage.getItem('khatmah_user_res') || '[]') as number[];
    localStorage.setItem('khatmah_user_res', JSON.stringify(savedRes.filter(n => n !== juzNum)));

    toast.info(isRtl ? `تم إلغاء حجز الجزء ${juzNum}.` : `Cancelled reservation for Juz ${juzNum}.`);
  };

  const completeJuz = (juzNum: number) => {
    setJuzList(prev => prev.map(item => {
      if (item.number !== juzNum) return item;
      return {
        ...item,
        status: 'completed',
        readerName: isRtl ? 'أنت' : 'You',
        isUserReservation: true
      };
    }));

    // Update localStorage
    const savedRes = JSON.parse(localStorage.getItem('khatmah_user_res') || '[]') as number[];
    localStorage.setItem('khatmah_user_res', JSON.stringify(savedRes.filter(n => n !== juzNum)));

    const savedComp = JSON.parse(localStorage.getItem('khatmah_user_comp') || '[]') as number[];
    if (!savedComp.includes(juzNum)) {
      localStorage.setItem('khatmah_user_comp', JSON.stringify([...savedComp, juzNum]));
    }

    toast.success(isRtl ? `تقبل الله طاعتك. تم تسجيل إتمام الجزء ${juzNum}.` : `May Allah accept your reading. Completed Juz ${juzNum}.`);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Tab Switcher */}
      <div className="flex justify-center w-full">
        <div className="bg-muted/30 border border-border p-1 rounded-full flex items-center gap-1 max-w-sm w-full">
          <button
            onClick={() => setActiveTab('communal')}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'communal'
                ? 'bg-card border border-border shadow-sm text-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isRtl ? 'الختمة المشتركة (للجميع)' : 'Communal Khatmah'}
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeTab === 'personal'
                ? 'bg-card border border-border shadow-sm text-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isRtl ? 'مخطط الختمة الفردي' : 'Personal Planner'}
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {activeTab === 'personal' ? (
        <KhatmahPlanner />
      ) : (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
          
          {/* Communal Khatmah Progress Card */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
              <div className="flex flex-col gap-1 text-center md:text-right">
                <h2 className="text-xl font-bold font-amiri text-foreground flex items-center gap-2 justify-center md:justify-start">
                  <Users className="w-6 h-6 text-primary" />
                  {isRtl ? `الختمة المشتركة رقم ${khatmahCount}` : `Communal Khatmah #${khatmahCount}`}
                </h2>
                <p className="text-xs text-muted-foreground max-w-md">
                  {isRtl 
                    ? 'شارك معنا في ختم القرآن الكريم إهداءً لروح الفقيد محمد السيد رحمه الله. احجز جزءاً واقرأه ثم أكّده.' 
                    : 'Participate in completing the Holy Quran dedicated to Mohamed Elsayed. Choose a Juz, read, and confirm.'}
                </p>
              </div>

              {/* Aggregated Stats */}
              <div className="bg-muted/30 border border-border/50 rounded-2xl px-5 py-3.5 flex flex-col items-center md:items-end gap-1.5 shrink-0 self-center">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {isRtl ? 'الأجزاء المكتملة' : 'Completed Juz'}
                </span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {completedCount} / 30
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full flex flex-col gap-2 z-10">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border/10">
                <div
                  className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold font-mono">
                <span>{progressPercent}%</span>
                <span>{30 - completedCount} {isRtl ? 'أجزاء متبقية' : 'Juz remaining'}</span>
              </div>
            </div>
          </div>

          {/* communal Juz Grid */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold font-sans text-foreground px-2">
              {isRtl ? 'توزيع الأجزاء (اضغط لحجز جزء وقراءته)' : 'communal Juz grid (Tap to reserve or complete)'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {juzList.map(juz => {
                return (
                  <div
                    key={juz.number}
                    className={`border rounded-2xl p-4 flex flex-col justify-between min-h-[140px] transition-all duration-300 relative overflow-hidden select-none ${
                      juz.status === 'completed'
                        ? 'bg-emerald-500/5 border-emerald-500/25'
                        : juz.status === 'reserved'
                        ? 'bg-amber-500/5 border-amber-500/25'
                        : 'bg-card border-border hover:border-border-hover hover:shadow-sm'
                    }`}
                  >
                    {/* Juz Header */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {isRtl ? `الجزء ${juz.number}` : `Juz ${juz.number}`}
                      </span>
                      {juz.readerName && (
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full max-w-[100px] truncate ${
                          juz.isUserReservation ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {juz.readerName}
                        </span>
                      )}
                    </div>

                    {/* Surah range info */}
                    <div className="my-3 text-right">
                      <p className="text-[11px] font-medium text-foreground/90 font-sans line-clamp-2 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
                        {isRtl ? juz.surahRangeAr : juz.surahRangeEn}
                      </p>
                    </div>

                    {/* Status Actions */}
                    <div className="w-full mt-2">
                      {juz.status === 'available' && (
                        <Button
                          size="sm"
                          onClick={() => reserveJuz(juz.number)}
                          className="w-full bg-primary hover:bg-primary/95 text-white text-[10px] font-bold rounded-xl h-8"
                        >
                          {isRtl ? 'حجز الجزء للقراءة' : 'Reserve Juz'}
                        </Button>
                      )}

                      {juz.status === 'reserved' && (
                        <div className="flex flex-col gap-1 w-full">
                          {juz.isUserReservation ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => completeJuz(juz.number)}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-[10px] font-bold rounded-xl h-8"
                              >
                                {isRtl ? 'تأكيد القراءة والختم' : 'Confirm Complete'}
                              </Button>
                              <button
                                onClick={() => cancelReservation(juz.number)}
                                className="text-[9px] text-destructive hover:underline text-center w-full mt-1.5 font-bold"
                              >
                                {isRtl ? 'إلغاء الحجز' : 'Cancel Reservation'}
                              </button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              disabled
                              className="w-full bg-muted text-muted-foreground text-[10px] font-bold rounded-xl h-8 cursor-not-allowed opacity-60"
                            >
                              {isRtl ? 'جاري قراءته حالياً' : 'Being Read'}
                            </Button>
                          )}
                        </div>
                      )}

                      {juz.status === 'completed' && (
                        <div className="flex items-center justify-center gap-1 text-emerald-500 text-[10px] font-bold py-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'تمت قراءته بالكامل' : 'Completed'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
