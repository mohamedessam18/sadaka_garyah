import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Image, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HadithItem {
  id: string;
  text: string;
  reference: string;
}

interface HadithDesignerProps {
  onSelectHadith: (hadith: {
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
  }) => void;
  selectedText?: string;
}

const HADITHS: HadithItem[] = [
  {
    id: 'h1',
    text: 'إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ: إِلَّا مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ.',
    reference: 'رواه مسلم',
  },
  {
    id: 'h2',
    text: 'صَنَائِعُ الْمَعْرُوفِ تَقِي مَصَارِعَ السِّوءِ، وَصَدَقَةُ السِّرِّ تُطْفِئُ غَضَبَ الرَّبِّ، وَصِلَةُ الرَّحِمِ تَزِيدُ فِي الْعُمُرِ.',
    reference: 'رواه الطبراني وحسنه الألباني',
  },
  {
    id: 'h3',
    text: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الْأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ.',
    reference: 'رواه الترمذي وصححه الألباني',
  },
  {
    id: 'h4',
    text: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا، وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلَّا رَفَعَهُ اللَّهُ.',
    reference: 'رواه مسلم',
  },
  {
    id: 'h5',
    text: 'مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ.',
    reference: 'رواه مسلم',
  }
];

export const HadithDesigner: React.FC<HadithDesignerProps> = ({ onSelectHadith, selectedText }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const handleDesign = (hadith: HadithItem) => {
    // Pass to designer tab
    onSelectHadith({
      number: 0, // indicates special Hadith mode
      text: hadith.text,
      surah: {
        number: 0,
        name: 'حديث شريف',
        englishName: 'Prophetic Hadith',
      },
      juz: 0,
      page: 0,
      reference: hadith.reference
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      <div className="flex flex-col gap-1 text-center md:text-right">
        <h2 className="text-lg font-bold font-amiri text-foreground flex items-center gap-2 justify-center md:justify-start">
          <Sparkles className="w-5 h-5 text-amber-500" />
          {isRtl ? 'الأحاديث النبوية الشريفة' : 'Authentic Prophetic Hadiths'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isRtl 
            ? 'اختر حديثاً شريفاً عن فضل الصدقة والعمل الصالح لتصميمه وتحميله كبطاقة مشاركة لروح الفقيد:' 
            : 'Select a Hadith about charity and good deeds to design and export as a share card:'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {HADITHS.map(hadith => {
          const isCurrentInDesigner = selectedText === hadith.text;
          return (
            <div
              key={hadith.id}
              className={`border rounded-3xl p-5 bg-card transition-all duration-300 flex flex-col gap-4 border-border hover:border-border-hover hover:shadow-sm`}
            >
              <p className="font-amiri text-base md:text-lg leading-[1.8] text-foreground text-right w-full" dir="rtl">
                {hadith.text}
              </p>

              <div className="flex items-center justify-between border-t border-border/50 pt-3 flex-row-reverse">
                <span className="text-[10px] md:text-xs text-muted-foreground/80 font-sans italic">
                  {hadith.reference}
                </span>

                <Button
                  size="sm"
                  onClick={() => handleDesign(hadith)}
                  variant={isCurrentInDesigner ? 'secondary' : 'default'}
                  className={`rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-1.5 h-8 px-4 ${
                    isCurrentInDesigner ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/15' : ''
                  }`}
                >
                  {isCurrentInDesigner ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {isRtl ? 'مفتوح في المصمم' : 'Opened in Designer'}
                    </>
                  ) : (
                    <>
                      <Image className="w-3.5 h-3.5" />
                      {isRtl ? 'تصميم وتحميل البطاقة' : 'Design & Export'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
