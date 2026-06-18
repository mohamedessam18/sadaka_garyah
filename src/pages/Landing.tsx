import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export const Landing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-b from-gray-900 via-[#0b1416] to-[#05090a] text-white px-6 py-12">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Outer framing borders */}
      <div className="absolute inset-4 md:inset-8 border border-white/5 pointer-events-none rounded-3xl" />
      <div className="absolute inset-6 md:inset-10 border border-teal-500/10 pointer-events-none rounded-[2rem]" />

      {/* Content Container */}
      <div className="max-w-xl w-full text-center z-10 flex flex-col items-center justify-center space-y-8 animate-fade-in">
        {/* Memorial Portrait Frame */}
        <div className="relative group">
          {/* Glowing ring */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          
          {/* Portrait Container */}
          <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full overflow-hidden border-2 border-teal-500/30 bg-[#0d1c1f] p-1 flex items-center justify-center">
            <img
              src={`${import.meta.env.BASE_URL}mohamedElsayed no background.jpg`}
              alt="Mohamed Elsayed"
              className="w-full h-full object-cover rounded-full filter brightness-95 contrast-105"
              onError={(e) => {
                // fallback if the no-background fails to load for some reason
                const target = e.target as HTMLImageElement;
                target.src = `${import.meta.env.BASE_URL}mohamedElsayed.jpg`;
              }}
            />
          </div>
        </div>

        {/* Dedication Text */}
        <div className="space-y-4">
          <p className="text-xs md:text-sm font-semibold tracking-widest text-teal-400 uppercase">
            {t('landing.title')}
          </p>
          <h1 className="text-3xl md:text-5xl font-amiri font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400 leading-relaxed drop-shadow-sm">
            {t('landing.name')}
          </h1>
          <p className="text-sm md:text-base font-amiri text-teal-300 italic opacity-85">
            {t('landing.subtitle')}
          </p>
        </div>

        {/* Dua Box */}
        <div className="p-6 md:p-8 bg-[#0a191b]/50 border border-teal-500/10 rounded-2xl max-w-lg mx-auto shadow-2xl backdrop-blur-sm">
          <p className="font-amiri text-lg md:text-xl text-emerald-100/90 leading-loose text-center">
            « {t('landing.dua')} »
          </p>
        </div>

        {/* Enter Button */}
        <div className="pt-4 flex flex-col items-center">
          <Button
            onClick={() => navigate('/home')}
            className="btn-pill relative group overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-medium px-8 py-6 rounded-full shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t('landing.enter')}
            </span>
            {/* Hover overlay shine */}
            <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Subtle Dedicated Footer */}
      <div className="absolute bottom-8 md:bottom-12 text-center text-[10px] text-gray-500 tracking-wider flex items-center gap-1 z-10">
        <span>Made with</span>
        <Heart className="w-3 h-3 text-teal-500 fill-current animate-pulse" />
        <span>as a Sadaqah Jariyah</span>
      </div>
    </div>
  );
};
