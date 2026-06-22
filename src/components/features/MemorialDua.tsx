import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Send, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const MemorialDua: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Read local counts and custom supplications
  const [totalDuas, setTotalDuas] = useState<number>(() => {
    const saved = localStorage.getItem('dua_counter_mohamed');
    return saved ? Number(saved) : 0;
  });

  const [customDuas, setCustomDuas] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_duas_mohamed');
    return saved ? JSON.parse(saved) : [];
  });

  const [inputDua, setInputDua] = useState('');
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [heartPopups, setHeartPopups] = useState<{ id: number; x: number; y: number }[]>([]);

  const presetDuas = (t('features.dua.presetDuas', { returnObjects: true }) as string[]) || [];

  // Update localStorage when total count changes
  useEffect(() => {
    localStorage.setItem('dua_counter_mohamed', String(totalDuas));
  }, [totalDuas]);

  // Update localStorage when custom list changes
  useEffect(() => {
    localStorage.setItem('custom_duas_mohamed', JSON.stringify(customDuas));
  }, [customDuas]);

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTotalDuas(prev => prev + 1);
    
    // Create floating heart animation at click position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setHeartPopups(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setHeartPopups(prev => prev.filter(h => h.id !== id));
    }, 1200);

    toast.success(t('features.dua.toastDua'), {
      icon: '🤲',
    });
  };

  const handleAddCustomDua = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputDua.trim()) return;

    setCustomDuas(prev => [inputDua.trim(), ...prev]);
    setInputDua('');
    toast.success(isRtl ? 'تم إضافة دعائك بنجاح' : 'Custom dua added successfully');
  };

  const handleDeleteCustomDua = (index: number) => {
    setCustomDuas(prev => prev.filter((_, i) => i !== index));
    toast.success(isRtl ? 'تم حذف الدعاء' : 'Dua deleted');
  };

  const handleShareDua = (text: string) => {
    const shareText = `${text}\n\nصدقة جارية عن المغفور له بإذن الله محمد السيد\n#SadakaJariyah`;
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success(t('home.copied'));
    }).catch(() => {
      toast.error('Could not copy to clipboard');
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in p-2">
      {/* Memorial Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col items-center text-center">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-full pointer-events-none" />

        {/* Dedicated photo container / initial */}
        <div className="relative w-28 h-28 mb-4 rounded-full border-4 border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden shadow-inner">
          <div className="text-primary font-amiri text-6xl select-none mt-2">🕌</div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold font-amiri text-foreground mb-2">
          {t('features.dua.title')}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {t('features.dua.subtitle')}
        </p>

        {/* Dua Box & Carousel */}
        {presetDuas.length > 0 && (
          <div className="w-full bg-muted/30 border border-border rounded-2xl p-5 mb-6 min-h-[140px] flex flex-col justify-between items-center relative">
            <p className="font-amiri text-lg md:text-xl text-foreground leading-[1.8] text-center my-auto px-4">
              « {presetDuas[activePresetIndex]} »
            </p>
            
            {/* Pagination Controls */}
            <div className="flex gap-1.5 mt-4">
              {presetDuas.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePresetIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    activePresetIndex === i ? 'bg-primary w-5' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to dua ${i + 1}`}
                />
              ))}
            </div>

            {/* Quick Share Preset */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleShareDua(presetDuas[activePresetIndex])}
              className="absolute top-2 right-2 rounded-full w-8 h-8 text-muted-foreground hover:text-primary"
              title={t('home.share')}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Amen Clicker Counter Button */}
        <div className="relative w-full max-w-xs mx-auto mb-4">
          <Button
            onClick={handleIncrement}
            className="w-full h-14 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 gap-2 relative overflow-hidden"
          >
            <Heart className="w-5 h-5 fill-current text-white animate-pulse" />
            <span>{t('features.dua.btnDua')}</span>

            {/* Floating Heart Popups */}
            {heartPopups.map(h => (
              <span
                key={h.id}
                className="absolute text-red-400 pointer-events-none animate-float-heart"
                style={{ left: h.x, top: h.y }}
              >
                ❤️
              </span>
            ))}
          </Button>
        </div>

        {/* Counter readout */}
        <p className="text-xs md:text-sm text-primary font-semibold arabic-ui">
          {t('features.dua.countLabel', { count: totalDuas })}
        </p>
      </div>

      {/* Write Custom Dua Section */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-md">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <span>✍️</span> {t('features.dua.customDuaPlaceholder')}
        </h3>

        <form onSubmit={handleAddCustomDua} className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputDua}
            onChange={(e) => setInputDua(e.target.value)}
            placeholder={t('features.dua.customDuaPlaceholder')}
            className="flex-1 rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60"
          />
          <Button
            type="submit"
            className="rounded-2xl h-11 px-5 bg-teal-600 text-white hover:bg-teal-700 font-bold shrink-0 self-center"
          >
            <Send className="w-4 h-4 ml-1 mr-1" />
            <span>{t('features.dua.btnSaveCustom')}</span>
          </Button>
        </form>

        {/* Custom Duas List */}
        {customDuas.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {t('features.dua.customDuaList')}
            </h4>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {customDuas.map((duaText, i) => (
                <div
                  key={i}
                  className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between gap-4"
                >
                  <p className="font-amiri text-sm md:text-base text-foreground leading-relaxed text-right flex-1">
                    {duaText}
                  </p>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShareDua(duaText)}
                      className="rounded-full w-8 h-8 text-muted-foreground hover:text-primary"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCustomDua(i)}
                      className="rounded-full w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
