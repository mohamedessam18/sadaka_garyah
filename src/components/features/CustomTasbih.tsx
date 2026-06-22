import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, RotateCcw, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CustomDhikr {
  id: string;
  text: string;
  targetCount: number;
  currentCount: number;
}

export const CustomTasbih: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [items, setItems] = useState<CustomDhikr[]>([]);
  const [newText, setNewText] = useState('');
  const [newTarget, setNewTarget] = useState<number>(33);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Load custom items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('custom_dhikr_items');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading custom dhikr items:', e);
      }
    }
  }, []);

  // Save to localStorage
  const saveItems = (newItems: CustomDhikr[]) => {
    setItems(newItems);
    localStorage.setItem('custom_dhikr_items', JSON.stringify(newItems));
  };

  // Add custom dhikr
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      toast.error(isRtl ? 'الرجاء كتابة الذكر أولاً' : 'Please type a dhikr first');
      return;
    }
    if (newTarget <= 0) {
      toast.error(isRtl ? 'الرجاء إدخال رقم تكرار صحيح' : 'Please enter a valid count');
      return;
    }

    const newItem: CustomDhikr = {
      id: `cd-${Date.now()}`,
      text: newText.trim(),
      targetCount: newTarget,
      currentCount: newTarget,
    };

    const updated = [newItem, ...items];
    saveItems(updated);
    setActiveItemId(newItem.id);
    setNewText('');
    toast.success(isRtl ? 'تمت إضافة الذكر بنجاح' : 'Dhikr added successfully');
  };

  // Delete custom dhikr
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
    if (activeItemId === id) {
      setActiveItemId(updated.length > 0 ? updated[0].id : null);
    }
    toast.success(isRtl ? 'تم حذف الذكر' : 'Dhikr deleted');
  };

  // Decrement current count on click
  const handleTap = (item: CustomDhikr) => {
    if (item.currentCount === 0) return;

    const updated = items.map((i) => {
      if (i.id === item.id) {
        const nextCount = i.currentCount - 1;
        
        // Haptic feedback if supported
        if ('vibrate' in navigator) {
          navigator.vibrate(nextCount === 0 ? [100, 50, 100] : 15);
        }

        // Web Audio sound click feedback
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(nextCount === 0 ? 880 : 540, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
          oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
          // Context blocked
        }

        if (nextCount === 0) {
          toast.success(isRtl ? `تم إكمال: ${i.text}` : `Completed: ${i.text}`);
        }

        return { ...i, currentCount: nextCount };
      }
      return i;
    });

    saveItems(updated);
  };

  // Reset active dhikr
  const handleResetCount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.map((i) => {
      if (i.id === id) {
        return { ...i, currentCount: i.targetCount };
      }
      return i;
    });
    saveItems(updated);
    toast.success(isRtl ? 'تمت إعادة تعيين العداد' : 'Counter reset');
  };

  const activeItem = items.find((i) => i.id === activeItemId) || items[0] || null;

  useEffect(() => {
    if (items.length > 0 && !activeItemId) {
      setActiveItemId(items[0].id);
    }
  }, [items, activeItemId]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      
      {/* Left panel: Dial Display */}
      <div className="w-full lg:col-span-6 bg-card border border-border rounded-[28px] p-6 shadow-md flex flex-col items-center gap-6 justify-center flex-1 min-h-[450px]">
        {activeItem ? (
          <div className="flex flex-col items-center gap-6 w-full text-center">
            {/* Active Dhikr Text Display */}
            <div className="px-4 py-3 bg-muted/40 border border-border/50 rounded-2xl max-w-md w-full">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1 block">
                {t('azkar.customTasbihTitle')}
              </span>
              <p className="font-amiri text-lg md:text-xl text-foreground font-bold leading-relaxed">
                {activeItem.text}
              </p>
            </div>

            {/* Glowing virtual Tasbih Dial dial button */}
            <div 
              onClick={() => handleTap(activeItem)}
              className={`w-64 h-64 rounded-full border-4 border-primary/20 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative select-none group shadow-inner ${
                activeItem.currentCount === 0 
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/15' 
                  : 'bg-primary/5 hover:bg-primary/10 border-primary/40 hover:scale-[1.02] shadow-primary/5'
              }`}
            >
              {/* Internal glowing elements */}
              <div className={`absolute inset-3 rounded-full border border-dashed transition-all duration-500 ${
                activeItem.currentCount === 0 
                  ? 'border-emerald-500/40 animate-spin-slow' 
                  : 'border-primary/20 group-hover:border-primary/40'
              }`} />

              <span className="text-muted-foreground text-xs font-medium uppercase font-sans">
                {t('azkar.count')}
              </span>
              <span className="text-6xl md:text-7xl font-sans font-bold my-2 text-foreground tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                {activeItem.currentCount}
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted/50 border border-border px-3 py-1 rounded-full flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {isRtl ? `الهدف: ${activeItem.targetCount}` : `Goal: ${activeItem.targetCount}`}
              </span>

              {activeItem.currentCount === 0 && (
                <div className="absolute inset-0 bg-emerald-500/5 rounded-full flex items-center justify-center flex-col animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-1">
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">{t('azkar.done')}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleResetCount(activeItem.id, e)}
                className="rounded-full text-xs h-9 gap-1.5 px-4"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('azkar.customTasbihReset')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteItem(activeItem.id, e)}
                className="rounded-full text-xs h-9 gap-1.5 px-4 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('azkar.customTasbihDelete')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">📿</div>
            <p className="text-sm text-muted-foreground arabic-ui font-medium">
              {t('azkar.customTasbihEmpty')}
            </p>
          </div>
        )}
      </div>

      {/* Right panel: Custom Dhikr Items List & Creation form */}
      <div className="w-full lg:col-span-6 flex flex-col gap-6 flex-1">
        
        {/* Creation Form */}
        <form onSubmit={handleAddItem} className="bg-card border border-border rounded-[28px] p-6 shadow-md flex flex-col gap-4">
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {t('azkar.customTasbihTitle')}
            </h3>
            <span className="text-[10px] text-muted-foreground leading-normal">
              {t('azkar.customTasbihDesc')}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground" htmlFor="custom-dhikr-text">
                {isRtl ? 'نص الذكر' : 'Dhikr Phrase'}
              </Label>
              <Input
                id="custom-dhikr-text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={t('azkar.customTasbihPlaceholder')}
                className="rounded-xl border-border bg-muted/20 h-10 text-xs md:text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground" htmlFor="custom-dhikr-target">
                {t('azkar.customTasbihTarget')}
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="custom-dhikr-target"
                  type="number"
                  value={newTarget || ''}
                  onChange={(e) => setNewTarget(Number(e.target.value))}
                  min={1}
                  className="rounded-xl border-border bg-muted/20 h-10 w-24 text-center text-xs md:text-sm font-sans"
                />
                
                {/* Preset helpers */}
                {[33, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewTarget(preset)}
                    className={`h-10 px-3 border rounded-xl text-xs font-medium font-sans transition-all ${
                      newTarget === preset
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-muted/10 text-muted-foreground hover:bg-muted/20'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold rounded-xl h-10 gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('azkar.customTasbihAdd')}</span>
            </Button>
          </div>
        </form>

        {/* Saved List */}
        {items.length > 0 && (
          <div className="bg-card border border-border rounded-[28px] p-6 shadow-md flex flex-col gap-3">
            <h4 className="text-xs font-bold text-muted-foreground border-b border-border pb-2 uppercase tracking-wide">
              {t('azkar.customTasbihList')}
            </h4>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {items.map((item) => {
                const isActive = item.id === activeItemId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border bg-muted/10 hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex flex-col gap-1 items-start max-w-[70%]">
                      <p className="font-amiri text-sm font-bold text-foreground line-clamp-1 text-right w-full">
                        {item.text}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-sans">
                        {isRtl 
                          ? `العداد: ${item.currentCount} / ${item.targetCount}` 
                          : `Count: ${item.currentCount} / ${item.targetCount}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleResetCount(item.id, e)}
                        className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="w-8 h-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
