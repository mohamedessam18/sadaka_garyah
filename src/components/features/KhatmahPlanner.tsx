import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface KhatmahPlan {
  targetDays: number;
  startPage: number;
  currentPage: number;
  startDate: number;
}

export const KhatmahPlanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [plan, setPlan] = useState<KhatmahPlan | null>(null);

  // Form states
  const [targetDaysInput, setTargetDaysInput] = useState<number>(30);
  const [startPageInput, setStartPageInput] = useState<number>(1);
  
  // Update state
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [editPageValue, setEditPageValue] = useState<number>(1);

  // Load plan from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('khatmah_plan');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as KhatmahPlan;
        setPlan(parsed);
        setEditPageValue(parsed.currentPage);
      } catch (e) {
        console.error('Error parsing khatmah plan:', e);
      }
    }
  }, []);

  // Save plan helper
  const savePlan = (newPlan: KhatmahPlan | null) => {
    if (newPlan) {
      localStorage.setItem('khatmah_plan', JSON.stringify(newPlan));
    } else {
      localStorage.removeItem('khatmah_plan');
    }
    setPlan(newPlan);
  };

  // Create Plan
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetDaysInput < 1) {
      toast.error(isRtl ? 'يرجى إدخال عدد أيام صالح' : 'Please enter valid days');
      return;
    }
    if (startPageInput < 1 || startPageInput > 604) {
      toast.error(isRtl ? 'رقم الصفحة يجب أن يكون بين 1 و 604' : 'Page must be between 1 and 604');
      return;
    }

    const newPlan: KhatmahPlan = {
      targetDays: targetDaysInput,
      startPage: startPageInput,
      currentPage: startPageInput,
      startDate: Date.now(),
    };

    savePlan(newPlan);
    setEditPageValue(startPageInput);
    toast.success(isRtl ? 'تم إنشاء خطة الختمة بنجاح!' : 'Khatmah plan created successfully!');
  };

  // Increment current page
  const handleIncrementPage = () => {
    if (!plan) return;
    if (plan.currentPage >= 604) {
      toast.success(isRtl ? 'تهانينا! لقد أتممت الختمة بنجاح!' : 'Congratulations! You have completed the Quran!');
      return;
    }

    const updated = {
      ...plan,
      currentPage: plan.currentPage + 1,
    };
    savePlan(updated);
    setEditPageValue(updated.currentPage);
  };

  // Direct Page Update
  const handlePageUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (editPageValue < 1 || editPageValue > 604) {
      toast.error(isRtl ? 'رقم الصفحة يجب أن يكون بين 1 و 604' : 'Page must be between 1 and 604');
      return;
    }

    const updated = {
      ...plan,
      currentPage: editPageValue,
    };
    savePlan(updated);
    setIsEditingPage(false);
    toast.success(isRtl ? 'تم تحديث الصفحة الحالية' : 'Current page updated');
  };

  // Reset Plan
  const handleResetPlan = () => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من إعادة تعيين الخطة وحذف التقدم؟' : 'Are you sure you want to reset your plan?')) {
      savePlan(null);
      setTargetDaysInput(30);
      setStartPageInput(1);
      toast.info(isRtl ? 'تم إعادة تعيين الخطة' : 'Plan reset');
    }
  };

  // Open Quran Reader at Current Page
  const handleReadNow = () => {
    if (!plan) return;
    navigate(`/quran?page=${plan.currentPage}`);
  };

  // Calculations if plan exists
  let totalPages = 0;
  let pagesRead = 0;
  let percent = 0;
  let daysElapsed = 0;
  let daysRemaining = 0;
  let pagesPerDay = 0;
  let expectedPage = 0;
  let status: 'ahead' | 'behind' | 'ontrack' = 'ontrack';
  let diffPages = 0;
  let estCompletionDateStr = '';
  let pagesLeft = 0;

  if (plan) {
    totalPages = 604 - plan.startPage + 1;
    pagesRead = plan.currentPage - plan.startPage;
    percent = Math.min(100, Math.floor((pagesRead / totalPages) * 100));

    // Calculate days elapsed (at least 1 day, using calendar days differences)
    const msDiff = Date.now() - plan.startDate;
    daysElapsed = Math.max(1, Math.ceil(msDiff / (24 * 60 * 60 * 1000)));
    daysRemaining = Math.max(1, plan.targetDays - daysElapsed + 1);

    // Initial pages per day target
    pagesPerDay = Math.ceil(totalPages / plan.targetDays);

    // Dynamic pages per day target for remaining days
    pagesLeft = 604 - plan.currentPage + 1;

    // Status: expected page by now
    expectedPage = plan.startPage + (daysElapsed * pagesPerDay);
    if (plan.currentPage > expectedPage + 3) {
      status = 'ahead';
      diffPages = plan.currentPage - expectedPage;
    } else if (plan.currentPage < expectedPage - 3) {
      status = 'behind';
      diffPages = expectedPage - plan.currentPage;
    } else {
      status = 'ontrack';
    }

    // Est. completion date
    const estCompDate = new Date(plan.startDate + plan.targetDays * 24 * 60 * 60 * 1000);
    estCompletionDateStr = estCompDate.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 animate-fade-in p-2">
      {!plan ? (
        /* Create Plan Wizard Form */
        <div className="bg-card border border-border rounded-3xl p-6 shadow-md">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('features.khatmah.title')}
          </h3>

          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 arabic-ui">
                {t('features.khatmah.targetDays')}
              </label>
              <input
                type="number"
                value={targetDaysInput === 0 ? '' : targetDaysInput}
                onChange={(e) => setTargetDaysInput(Number(e.target.value))}
                min={1}
                className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 arabic-ui">
                {t('features.khatmah.startPage')} (1-604)
              </label>
              <input
                type="number"
                value={startPageInput === 0 ? '' : startPageInput}
                onChange={(e) => setStartPageInput(Number(e.target.value))}
                min={1}
                max={604}
                className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm mt-2 transition-all"
            >
              {t('features.khatmah.btnCreate')}
            </Button>
          </form>
        </div>
      ) : (
        /* Active Plan Dashboard */
        <div className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('features.khatmah.title')}
            </h3>
            
            {/* Reset button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetPlan}
              className="rounded-full w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={t('features.khatmah.btnReset')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress bar visualizer */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>{t('features.khatmah.percentage')}</span>
              <span className="font-mono text-primary font-bold text-sm font-sans">{percent}%</span>
            </div>
            
            <div className="w-full bg-muted/60 h-4 rounded-full overflow-hidden border border-border p-[2px]">
              <div 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-inner"
                style={{ width: `${percent}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
              <span>{t('features.khatmah.startPage')}: {plan.startPage}</span>
              <span className="font-semibold text-foreground">
                {isRtl ? 'الصفحة الحالية' : 'Current Page'}: {plan.currentPage} / 604
              </span>
              <span>{t('quran.pageLabel')} 604</span>
            </div>
          </div>

          {/* Status Badge */}
          {status === 'ahead' && (
            <div className="bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 p-3 rounded-2xl text-xs md:text-sm font-semibold text-center animate-fade-in arabic-ui">
              🎉 {t('features.khatmah.statusAhead', { pages: diffPages })}
            </div>
          )}
          {status === 'behind' && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-2xl text-xs md:text-sm font-semibold text-center animate-fade-in arabic-ui">
              ⚠️ {t('features.khatmah.statusBehind', { pages: diffPages })}
            </div>
          )}
          {status === 'ontrack' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-2xl text-xs md:text-sm font-semibold text-center animate-fade-in arabic-ui">
              ✅ {t('features.khatmah.statusOnTrack')}
            </div>
          )}

          {/* Metrics breakdown grid */}
          <div className="grid grid-cols-2 gap-3 bg-muted/20 border border-border/50 rounded-2xl p-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold">{t('features.khatmah.dailyGoal')}</span>
              <span className="text-lg font-bold text-foreground mt-0.5 font-sans">
                {Math.ceil(pagesLeft / daysRemaining)} <span className="text-xs font-normal text-muted-foreground">{t('features.khatmah.pagesPerDay')}</span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold">{t('features.khatmah.daysLeft')}</span>
              <span className="text-lg font-bold text-foreground mt-0.5 font-sans">
                {daysRemaining} / {plan.targetDays}
              </span>
            </div>

            <div className="flex flex-col border-t border-border/40 pt-2.5 col-span-2">
              <span className="text-[10px] text-muted-foreground font-semibold">{t('features.khatmah.estCompletion')}</span>
              <span className="text-sm font-semibold text-primary mt-0.5 arabic-ui">
                {estCompletionDateStr}
              </span>
            </div>
          </div>

          {/* Quick Page Update Controls */}
          {isEditingPage ? (
            <form onSubmit={handlePageUpdateSubmit} className="flex gap-2 animate-fade-in">
              <input
                type="number"
                value={editPageValue === 0 ? '' : editPageValue}
                onChange={(e) => setEditPageValue(Number(e.target.value))}
                min={1}
                max={604}
                className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
              />
              <Button type="submit" size="sm" className="rounded-xl h-8 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white">
                {t('features.khatmah.setPage')}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditingPage(false)} className="rounded-xl h-8 text-xs text-muted-foreground">
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/10 p-2.5 rounded-xl border border-border/30">
              <span className="arabic-ui">الصفحة الحالية: <b className="text-foreground">{plan.currentPage}</b></span>
              <button 
                onClick={() => {
                  setEditPageValue(plan.currentPage);
                  setIsEditingPage(true);
                }} 
                className="text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <Edit className="w-3 h-3" />
                <span>{t('features.khatmah.updateCurrentPage')}</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <Button
              onClick={handleIncrementPage}
              variant="outline"
              className="w-full h-11 rounded-2xl font-bold text-xs md:text-sm gap-2 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('features.khatmah.btnIncrementPage')}</span>
            </Button>

            <Button
              onClick={handleReadNow}
              className="w-full h-12 rounded-2xl font-bold text-xs md:text-sm gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('features.khatmah.btnReadNow', { page: plan.currentPage })}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
