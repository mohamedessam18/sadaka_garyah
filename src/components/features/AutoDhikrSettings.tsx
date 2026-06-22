import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, HelpCircle, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAutoDhikr } from '../../hooks/useAutoDhikr';
import type { DhikrPhraseType } from '../../hooks/useAutoDhikr';

const INTERVALS = [
  { value: 1, labelAr: 'دقيقة واحدة (للتجربة)', labelEn: '1 Minute (For Testing)' },
  { value: 5, labelAr: '٥ دقائق', labelEn: '5 Minutes' },
  { value: 15, labelAr: '١٥ دقيقة', labelEn: '15 Minutes' },
  { value: 30, labelAr: '٣٠ دقيقة', labelEn: '30 Minutes' },
  { value: 60, labelAr: 'ساعة كاملة', labelEn: '1 Hour' },
];

export const AutoDhikrSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const {
    enabled,
    setEnabled,
    intervalMin,
    setIntervalMin,
    phrase,
    setPhrase,
    playDhikr
  } = useAutoDhikr();

  const handlePhraseSelect = (type: DhikrPhraseType) => {
    setPhrase(type);
  };

  const getPhraseLabel = (type: DhikrPhraseType) => {
    const keyMap: Record<DhikrPhraseType, string> = {
      salawat: t('features.dhikr.phrases.salawat'),
      tasbih: t('features.dhikr.phrases.tasbih'),
      istighfar: t('features.dhikr.phrases.istighfar'),
      takbeer: t('features.dhikr.phrases.takbeer'),
      random: t('features.dhikr.phrases.random'),
    };
    return keyMap[type];
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 animate-fade-in p-2">
      <div className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col gap-6">
        {/* Header Toggle Row */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {enabled ? <Bell className="w-5 h-5 animate-bounce" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-foreground leading-tight">
                {t('features.dhikr.title')}
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {enabled ? 'Active Background reminders' : 'Reminders are disabled'}
              </span>
            </div>
          </div>

          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Informative Alert */}
        <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 flex gap-2.5 items-start text-xs leading-relaxed text-muted-foreground">
          <HelpCircle className="w-4 h-4 shrink-0 text-primary mt-0.5" />
          <span>{t('features.dhikr.explain')}</span>
        </div>

        {enabled && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Interval Selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 arabic-ui">
                {t('features.dhikr.interval')}
              </label>
              
              <div className="flex flex-col gap-1.5 bg-muted/20 border border-border/40 rounded-2xl p-2.5">
                {INTERVALS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setIntervalMin(item.value)}
                    className={`w-full text-right px-4 py-2.5 rounded-xl text-xs flex justify-between items-center transition-all ${
                      intervalMin === item.value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground/80'
                    }`}
                  >
                    <span className="arabic-ui">{isRtl ? item.labelAr : item.labelEn}</span>
                    {intervalMin === item.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Phrase Selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 arabic-ui">
                {t('features.dhikr.phrase')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['salawat', 'tasbih', 'istighfar', 'takbeer', 'random'] as DhikrPhraseType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handlePhraseSelect(type)}
                    className={`p-3 rounded-2xl border text-right transition-all flex justify-between items-center ${
                      phrase === type
                        ? 'border-primary bg-primary/5 text-primary font-semibold shadow-sm'
                        : 'border-border bg-muted/10 hover:bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs arabic-ui leading-normal">{getPhraseLabel(type)}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-1.5 mr-1.5 ${
                      phrase === type ? 'border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {phrase === type && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Audio button */}
            <div className="pt-2 border-t border-border/40">
              <Button
                onClick={() => playDhikr(phrase)}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs md:text-sm gap-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t('features.dhikr.testSound')}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
