import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { ArrowRight, Upload } from 'lucide-react';
import heroStillLife from '../../assets/images/library_still_life_hero_1791353450721.jpg';

export const HeroSection: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#FAF8F5] dark:bg-[#12141A] transition-colors py-10 sm:py-16 lg:py-20 px-5 sm:px-10 lg:px-14 border border-stone-200/70 dark:border-stone-800/70 shadow-2xs">
      
      {/* ── Seamless Panoramic Artwork Blend (Right Side) ─────────────── */}
      <div className="absolute top-0 right-0 bottom-0 w-full sm:w-3/4 lg:w-3/5 pointer-events-none select-none overflow-hidden">
        <img
          src={heroStillLife}
          alt=""
          className="w-full h-full object-cover object-right sm:object-center opacity-85 dark:opacity-35 transition-opacity duration-300"
        />
        
        {/* Horizontal linear blend into the parchment background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 via-25% sm:via-35% to-transparent dark:from-[#12141A] dark:via-[#12141A]/85 dark:via-25% sm:dark:via-35% dark:to-transparent" />
        
        {/* Soft edge feathering */}
        <div className="absolute inset-y-0 left-0 w-28 sm:w-44 bg-gradient-to-r from-[#FAF8F5] to-transparent dark:from-[#12141A]" />
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#FAF8F5] to-transparent dark:from-[#12141A]" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#FAF8F5] to-transparent dark:from-[#12141A]" />
      </div>

      {/* ── Foreground Text & CTAs (Left Side) ────────────────────────── */}
      <div className="relative z-10 max-w-xl sm:max-w-2xl space-y-5 sm:space-y-6">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs sm:text-xs font-mono uppercase tracking-[0.24em] text-[#C25E3A] dark:text-[#D9774F] font-bold">
            THE OPEN DIGITAL LIBRARY
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.8rem] font-bold text-stone-950 dark:text-stone-50 tracking-tight leading-[1.14]">
          Read freely.<br />
          Keep what you discover.
        </h1>

        <p className="text-base sm:text-base text-stone-600 dark:text-stone-300 font-sans leading-relaxed max-w-lg">
          A free, ad-free library for books, comics and manga. All works are openly licensed or in the public domain.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            onClick={() => navigate('/library')}
            className="w-full sm:w-auto px-6 py-4 text-sm sm:text-base font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[48px]"
          >
            <span>Explore Library</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => navigate('/user-uploads')}
            className="w-full sm:w-auto px-5 py-4 text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200 bg-white/90 dark:bg-stone-800/90 hover:bg-white dark:hover:bg-stone-800 border border-stone-300/80 dark:border-stone-700 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
          >
            <Upload className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <span>Community Library</span>
          </button>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
