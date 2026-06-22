import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Supplication {
  id: string;
  text: string;
  transliteration?: string;
  reference: string;
  targetCount: number;
  currentCount: number;
}

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  items: Supplication[];
}

export const HisnMuslim: React.FC = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'prayer',
      nameAr: 'أذكار بعد الصلاة',
      nameEn: 'Post-Prayer Remembrances',
      items: [
        {
          id: 'p1',
          text: 'أَسْتَغْفِرُ اللهَ (ثَلَاثاً)، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ ذَا الْجَلَالِ وَالْإِكْرَامِ.',
          reference: 'رواه مسلم',
          targetCount: 3,
          currentCount: 3,
        },
        {
          id: 'p2',
          text: 'سُبْحَانَ اللهِ (33)، وَالْحَمْدُ للهِ (33)، وَاللهُ أَكْبَرُ (33)، ثُمَّ تَمَامُ الْمِائَةِ: لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
          reference: 'رواه مسلم',
          targetCount: 1,
          currentCount: 1,
        },
        {
          id: 'p3',
          text: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ.',
          reference: 'رواه أبو داود والنسائي وصححه الألباني',
          targetCount: 1,
          currentCount: 1,
        }
      ]
    },
    {
      id: 'sleep',
      nameAr: 'أذكار النوم والاستيقاظ',
      nameEn: 'Sleep & Waking',
      items: [
        {
          id: 's1',
          text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.',
          reference: 'رواه البخاري ومسلم',
          targetCount: 1,
          currentCount: 1,
        },
        {
          id: 's2',
          text: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ.',
          reference: 'رواه أبو داود وصححه الألباني (يُقال ثلاثاً عند النوم)',
          targetCount: 3,
          currentCount: 3,
        },
        {
          id: 's3',
          text: 'الْحَمْدُ للهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ.',
          reference: 'رواه البخاري (عند الاستيقاظ)',
          targetCount: 1,
          currentCount: 1,
        }
      ]
    },
    {
      id: 'travel',
      nameAr: 'أدعية السفر والركوب',
      nameEn: 'Travel & Riding',
      items: [
        {
          id: 't1',
          text: 'بِسْمِ اللَّهِ، وَالْحَمْدُ لِلَّهِ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ.',
          reference: 'رواه أبو داود والترمذي وصححه الألباني',
          targetCount: 1,
          currentCount: 1,
        },
        {
          id: 't2',
          text: 'اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ.',
          reference: 'رواه مسلم',
          targetCount: 1,
          currentCount: 1,
        }
      ]
    },
    {
      id: 'sick',
      nameAr: 'أدعية المريض والابتلاء',
      nameEn: 'Sick & Affliction',
      items: [
        {
          id: 'd1',
          text: 'أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، وَاشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَماً.',
          reference: 'رواه البخاري ومسلم',
          targetCount: 1,
          currentCount: 1,
        },
        {
          id: 'd2',
          text: 'بِسْمِ اللَّهِ (ثَلَاثاً)، أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (سَبْعَ مَرَّاتٍ).',
          reference: 'رواه مسلم (يضع يده على مكان الألم ويقولها)',
          targetCount: 7,
          currentCount: 7,
        }
      ]
    },
    {
      id: 'deceased',
      nameAr: 'أدعية مأثورة للمتوفى',
      nameEn: 'Duas for Deceased',
      items: [
        {
          id: 'dec1',
          text: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا نَقَّيْتَ الثَّوْبَ الْأَبْيَضَ مِنَ الدَّنَسِ.',
          reference: 'رواه مسلم (من أدعية صلاة الجنازة)',
          targetCount: 1,
          currentCount: 1,
        },
        {
          id: 'dec2',
          text: 'اللَّهُمَّ إِنَّهُ فِي ذِمَّتِكَ وَحَبْلِ جِوَارِكَ، فَقِهِ فِتْنَةَ الْقَبْرِ، وَعَذَابَ النَّارِ، وَأَنْتَ أَهْلُ الْوَفَاءِ وَالْحَقِّ، فَاغْفِرْ لَهُ وَارْحَمْهُ، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ.',
          reference: 'رواه ابن ماجه وأبو داود وصححه الألباني',
          targetCount: 1,
          currentCount: 1,
        },
        {
          id: 'dec3',
          text: 'اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا، وَشَاهِدِنَا وَغَائِبِنَا، وَصَغِيرِنَا وَكَبِيرِنَا، وَذَكَرِنَا وَأُنْثَانَا، اللَّهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ.',
          reference: 'رواه الترمذي وابن ماجه وصححه الألباني',
          targetCount: 1,
          currentCount: 1,
        }
      ]
    }
  ]);

  const [activeTab, setActiveTab] = useState<string>('prayer');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCounterClick = (catId: string, itemId: string) => {
    // Vibration if available
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    // Play a subtle digital click sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(650, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.06);
    } catch {}

    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            currentCount: item.currentCount > 0 ? item.currentCount - 1 : 0
          };
        })
      };
    }));
  };

  const resetCategory = (catId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => ({
          ...item,
          currentCount: item.targetCount
        }))
      };
    }));
  };

  // Filter items based on tab selection & search query
  const filteredCategory = categories.find(cat => cat.id === activeTab);
  const itemsToShow = filteredCategory
    ? filteredCategory.items.filter(item => 
        item.text.includes(searchQuery) || item.reference.includes(searchQuery)
      )
    : [];

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Category Chips and Search bar */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute right-4 top-3.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={isRtl ? 'ابحث في أدعية حصن المسلم...' : 'Search Hisn al-Muslim...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/30 border border-border hover:border-border-hover focus:border-primary outline-none rounded-2xl py-3 pr-11 pl-4 text-xs font-semibold text-foreground transition-colors"
          />
        </div>

        {/* Categories Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id);
                setSearchQuery('');
              }}
              className={`shrink-0 px-4 py-2.5 rounded-full border text-xs font-semibold transition-all duration-200 ${
                activeTab === cat.id
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-muted/15 border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {isRtl ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

      </div>

      {/* Supplications Cards Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground font-semibold">
            {isRtl ? `عرض ${itemsToShow.length} من الأدعية` : `Showing ${itemsToShow.length} items`}
          </span>
          {itemsToShow.some(i => i.currentCount < i.targetCount) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetCategory(activeTab)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 h-8 px-3 rounded-full"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isRtl ? 'إعادة ضبط القسم' : 'Reset Section'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {itemsToShow.length > 0 ? (
            itemsToShow.map(item => {
              const isCompleted = item.currentCount === 0;
              return (
                <div
                  key={item.id}
                  onClick={() => !isCompleted && handleCounterClick(activeTab, item.id)}
                  className={`border rounded-3xl p-5 transition-all duration-300 flex flex-col md:flex-row gap-5 items-center justify-between select-none cursor-pointer group ${
                    isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-card border-border hover:border-border-hover hover:shadow-sm'
                  }`}
                >
                  <div className="flex-1 flex flex-col gap-3 text-center md:text-right w-full">
                    <p className="font-amiri text-lg md:text-xl leading-[1.9] text-foreground text-right w-full" dir="rtl">
                      {item.text}
                    </p>
                    <span className="text-[10px] md:text-xs text-muted-foreground/80 font-sans italic self-start md:self-end">
                      {item.reference}
                    </span>
                  </div>

                  {/* Counter Circle Button */}
                  <div className="shrink-0 flex items-center justify-center">
                    <button
                      disabled={isCompleted}
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/10'
                          : 'border-primary/30 group-hover:border-primary/70 bg-primary/5 text-primary text-lg font-bold font-mono group-hover:bg-primary/10'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 animate-scale-in" />
                      ) : (
                        <span>{item.currentCount}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-3xl">
              <span className="text-sm text-muted-foreground arabic-ui">
                {isRtl ? 'لا يوجد نتائج تطابق بحثك.' : 'No matches found.'}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
