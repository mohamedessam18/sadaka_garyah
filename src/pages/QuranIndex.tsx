import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Info, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { quranService } from '../services/quranService';
import type { Surah } from '../services/quranService';
import { toast } from 'sonner';

export const QuranIndex: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch Surahs
  useEffect(() => {
    const loadSurahs = async () => {
      setLoading(true);
      try {
        const list = await quranService.getSurahs();
        setSurahs(list);
      } catch (error) {
        console.error('Error loading surahs:', error);
        toast.error(isRtl ? 'حدث خطأ أثناء تحميل السور' : 'Error loading surahs');
      } finally {
        setLoading(false);
      }
    };
    loadSurahs();
  }, []);

  const handleSurahClick = (id: number) => {
    navigate(`/quran/${id}`);
  };

  const filteredSurahs = surahs.filter((surah) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Search by number
    if (!isNaN(Number(query))) {
      return surah.number === Number(query);
    }

    // Search by name (English or Arabic)
    return (
      surah.englishName.toLowerCase().includes(query) ||
      surah.englishNameTranslation.toLowerCase().includes(query) ||
      surah.name.includes(query)
    );
  });

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

  return (
    <div className="flex-1 w-full bg-background transition-colors duration-300 py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header Info */}
      <section className="mb-10 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-amiri font-bold text-xl mx-auto mb-4">
          📖
        </div>
        <h1 className="text-3xl md:text-4xl font-amiri font-bold text-foreground mb-3 leading-relaxed">
          {t('quran.title')}
        </h1>
        <p className="max-w-xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
          {isRtl 
            ? 'تصفح فهرس سور القرآن الكريم كاملًا، وابدأ القراءة أو الاستماع إلى التلاوة برواية حفص عن عاصم بصوت القارئ مشاري العفاسي.'
            : 'Explore the full Quran index and start reading or listening to the holy verses recited by Sheikh Mishary Alafasy.'}
        </p>
      </section>

      {/* Search Input */}
      <div className="max-w-md mx-auto mb-10 relative">
        <div className={`absolute inset-y-0 ${isRtl ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-muted-foreground`}>
          <Search className="w-4 h-4" />
        </div>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('quran.searchPlaceholder')}
          className={`pr-10 pl-10 rounded-full h-12 border-border bg-card text-foreground focus-visible:ring-primary`}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery('')}
            className={`absolute inset-y-1.5 ${isRtl ? 'right-2' : 'left-2'} rounded-full w-9 h-9`}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Grid of Surahs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredSurahs.map((surah) => (
          <Card
            key={surah.number}
            onClick={() => handleSurahClick(surah.number)}
            className="group cursor-pointer bg-card border border-border rounded-2xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              {/* Geometric Index Icon */}
              <div className="relative w-9 h-9 rounded-full bg-muted/60 border border-border/80 flex items-center justify-center text-xs font-bold font-mono text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {surah.number}
              </div>

              {/* Revelation Type Badge */}
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-semibold border-none px-2.5 py-0.5 rounded-full ${
                  surah.revelationType === 'Meccan'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {surah.revelationType === 'Meccan' ? t('quran.meccan') : t('quran.medinan')}
              </Badge>
            </CardHeader>
            
            <CardContent className="flex justify-between items-end">
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {surah.englishName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 italic">
                  {surah.englishNameTranslation}
                </p>
                <span className="text-[10px] text-muted-foreground/85 block mt-3 uppercase tracking-wider font-mono">
                  {surah.numberOfAyahs} {t('quran.verses')}
                </span>
              </div>
              
              {/* Arabic Surah Name */}
              <div className="text-right">
                <span className="font-amiri text-2xl md:text-3xl text-foreground font-bold group-hover:text-primary transition-colors">
                  {surah.name}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSurahs.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl max-w-sm mx-auto">
          <Info className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground arabic-ui">
            {isRtl ? 'لا توجد نتائج مطابقة لبحثك.' : 'No surahs match your query.'}
          </p>
        </div>
      )}
    </div>
  );
};
