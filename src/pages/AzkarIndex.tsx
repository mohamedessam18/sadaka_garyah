import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Bed, ChevronRight, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const AzkarIndex: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const categories = [
    {
      type: 'morning',
      title: t('azkar.morning'),
      description: t('azkar.morningDesc'),
      icon: <Sun className="w-8 h-8 text-amber-500 animate-spin-slow" />,
      gradient: 'from-amber-500/10 via-teal-500/5 to-transparent border-amber-500/20',
      hoverGlow: 'group-hover:shadow-amber-500/10'
    },
    {
      type: 'evening',
      title: t('azkar.evening'),
      description: t('azkar.eveningDesc'),
      icon: <Moon className="w-8 h-8 text-indigo-400" />,
      gradient: 'from-indigo-500/10 via-teal-500/5 to-transparent border-indigo-500/20',
      hoverGlow: 'group-hover:shadow-indigo-500/10'
    },
    {
      type: 'sleep',
      title: t('azkar.sleep'),
      description: t('azkar.sleepDesc'),
      icon: <Bed className="w-8 h-8 text-emerald-400" />,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20',
      hoverGlow: 'group-hover:shadow-emerald-500/10'
    }
  ];

  return (
    <div className="flex-1 w-full bg-background transition-colors duration-300 py-12 px-4 md:px-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <section className="mb-12 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-amiri font-bold text-xl mx-auto mb-4">
          📿
        </div>
        <h1 className="text-3xl md:text-4xl font-amiri font-bold text-foreground mb-3 leading-relaxed">
          {t('azkar.title')}
        </h1>
        <p className="max-w-xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
          {isRtl 
            ? 'أذكار وأدعية مأخوذة من حصن المسلم، لتبدأ بها يومك وتحفظ بها نفسك في الصباح والمساء وعند النوم.'
            : 'Supplications and daily remembrances taken from Hisn al-Muslim to protect and calm yourself throughout the day and night.'}
        </p>
      </section>

      {/* Grid of Azkar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Card
            key={cat.type}
            onClick={() => navigate(`/azkar/${cat.type}`)}
            className={`group cursor-pointer bg-card overflow-hidden border border-border bg-gradient-to-b ${cat.gradient} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cat.hoverGlow} rounded-3xl`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="p-3 bg-background rounded-2xl border border-border/50 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-300 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </CardHeader>
            <CardContent className="pt-2">
              <CardTitle className="text-xl md:text-2xl font-bold font-amiri text-foreground mb-2 group-hover:text-primary transition-colors">
                {cat.title}
              </CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {cat.description}
              </p>
              
              {/* Subtle entry action */}
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <BookOpen className="w-4 h-4" />
                <span>{isRtl ? 'ابدأ الذكر الآن' : 'Start dhikr now'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
