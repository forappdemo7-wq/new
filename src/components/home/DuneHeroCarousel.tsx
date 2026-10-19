import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Hero Assets
import warOfWorldsBannerImg from '../../assets/images/war_of_worlds_banner_1791280492280.jpg';
import warOfWorldsCoverImg from '../../assets/images/collection_scifi_fantasy_1791353561476.jpg';
import frankensteinCoverImg from '../../assets/images/book_frankenstein_cover_1790759531684.jpg';
import draculaCoverImg from '../../assets/images/sherlock_detective_cover_1790849444735.jpg';
import sherlockCoverImg from '../../assets/images/sherlock_detective_cover_1790849444735.jpg';
import nineteen84CoverImg from '../../assets/images/nineteen84_distopian_cover_1790850382066.jpg';
import prideCoverImg from '../../assets/images/great_gatsby_vintage_cover_1790850405905.jpg';
import libraryBannerImg from '../../assets/images/hero_candlelit_library_1790844657495.jpg';
import readingBannerImg from '../../assets/images/hero_candlelit_library_1790844657495.jpg';

interface FeaturedSlide {
  id: string;
  workId: string;
  slug: string;
  badge: string;
  title: string;
  author: string;
  synopsis: string;
  coverImage: string;
  bannerImage: string;
  genres: string[];
  accentColor: string; // Tailored button & border glow color
  bgGradient: string; // Rich ambient lighting
}

const FEATURED_SLIDES: FeaturedSlide[] = [
  {
    id: 'slide-war-of-the-worlds',
    workId: 'work-war-of-the-worlds',
    slug: 'the-war-of-the-worlds-hg-wells',
    badge: 'FEATURED SCI-FI MASTERPIECE',
    title: 'The War of the Worlds',
    author: 'H.G. Wells',
    synopsis: 'Towering Martian fighting machines descend upon Victorian England with devastating heat-rays in the foundational science fiction epic.',
    coverImage: warOfWorldsCoverImg,
    bannerImage: warOfWorldsBannerImg,
    genres: ['Science Fiction', 'Invasion', 'Classics'],
    accentColor: '#FF5733',
    bgGradient: 'from-[#170C08] via-[#0D1322]/90 to-[#070B14]'
  },
  {
    id: 'slide-frankenstein',
    workId: 'work-frankenstein',
    slug: 'frankenstein-mary-shelley',
    badge: 'FEATURED GOTHIC MASTERPIECE',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    synopsis: 'Obsessed with conquering mortality, Victor Frankenstein animates a creature from the dead, unleashing consequences beyond his control.',
    coverImage: frankensteinCoverImg,
    bannerImage: libraryBannerImg,
    genres: ['Gothic Fiction', 'Horror', 'Sci-Fi Pioneer'],
    accentColor: '#06B6D4',
    bgGradient: 'from-[#081822] via-[#0A1220]/90 to-[#070B14]'
  },
  {
    id: 'slide-dracula',
    workId: 'work-dracula',
    slug: 'dracula-bram-stoker',
    badge: 'FEATURED VAMPIRE CLASSIC',
    title: 'Dracula',
    author: 'Bram Stoker',
    synopsis: 'Jonathan Harker travels to the mysterious Carpathian Castle Dracula, uncovering an ancient vampiric thirst threatening London.',
    coverImage: draculaCoverImg,
    bannerImage: readingBannerImg,
    genres: ['Gothic Horror', 'Classics', 'Epistolary'],
    accentColor: '#E11D48',
    bgGradient: 'from-[#1C0913] via-[#0E0F1E]/90 to-[#070B14]'
  },
  {
    id: 'slide-sherlock',
    workId: 'work-sherlock-holmes',
    slug: 'the-adventures-of-sherlock-holmes',
    badge: 'FEATURED DETECTIVE MYSTERY',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Sir Arthur Conan Doyle',
    synopsis: 'Step into 221B Baker Street as Sherlock Holmes and Dr. Watson untangle twelve of Victorian London’s most cunning mysteries.',
    coverImage: sherlockCoverImg,
    bannerImage: libraryBannerImg,
    genres: ['Mystery', 'Victorian London', 'Deduction'],
    accentColor: '#D97706',
    bgGradient: 'from-[#191107] via-[#0F1422]/90 to-[#070B14]'
  },
  {
    id: 'slide-1984',
    workId: 'work-1984',
    slug: '1984-george-orwell',
    badge: 'FEATURED DYSTOPIAN NOVEL',
    title: '1984',
    author: 'George Orwell',
    synopsis: 'Winston Smith navigates the omnipresent surveillance of Big Brother, where independent thought is outlawed and reality is engineered.',
    coverImage: nineteen84CoverImg,
    bannerImage: libraryBannerImg,
    genres: ['Dystopian', 'Surveillance', 'Classics'],
    accentColor: '#F59E0B',
    bgGradient: 'from-[#161414] via-[#0D1422]/90 to-[#070B14]'
  },
  {
    id: 'slide-pride',
    workId: 'work-pride-prejudice',
    slug: 'pride-and-prejudice-jane-austen',
    badge: 'FEATURED REGENCY CLASSIC',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    synopsis: 'The spirited Elizabeth Bennet and proud Mr. Darcy navigate family eccentricities, social barriers, and heartfelt misunderstandings.',
    coverImage: prideCoverImg,
    bannerImage: readingBannerImg,
    genres: ['Romance', 'Classics', 'Satire'],
    accentColor: '#EC4899',
    bgGradient: 'from-[#1A0A15] via-[#0F1222]/90 to-[#070B14]'
  }
];

export const DuneHeroCarousel: React.FC = () => {
  const { navigate } = useRouter();
  const { works, toggleFavoriteWork, isFavorite } = useLibrary();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<number | null>(null);

  const currentSlide = FEATURED_SLIDES[currentIndex];

  // Resolve matching work from library context (for reading progress, chapters, favorite status)
  const targetWork =
    works.find((w) => w.id === currentSlide.workId || w.slug === currentSlide.slug || w.title.toLowerCase() === currentSlide.title.toLowerCase()) ||
    works[0];

  const favorited = targetWork ? isFavorite(targetWork.id) : false;

  const nextSlide = useCallback(() => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % FEATURED_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + FEATURED_SLIDES.length) % FEATURED_SLIDES.length);
  }, []);

  // Automatic timer: advances every 6 seconds, pauses when user hovers or interacts
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const handleRead = () => {
    if (targetWork) {
      const firstChapter = targetWork.chapters?.[0]?.id || '1';
      navigate(`/read/${targetWork.id}/${firstChapter}`);
    } else {
      navigate(`/work/${currentSlide.slug}`);
    }
  };

  const handleToggleFavorite = () => {
    if (targetWork) {
      toggleFavoriteWork(targetWork.id);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#070B14] shadow-2xl min-h-[380px] sm:min-h-[440px] flex items-center p-6 sm:p-10 lg:p-12 transition-all duration-700"
    >
      {/* Dynamic Cinematic Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentSlide.id + '-bg'}
            src={currentSlide.bannerImage}
            alt=""
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.55, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="w-full h-full object-cover object-center mix-blend-screen absolute inset-0"
          />
        </AnimatePresence>

        {/* Dynamic Gradient Lighting based on Book Palette */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${currentSlide.bgGradient} transition-colors duration-1000`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-transparent to-[#070B14]/40" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
        {/* Left Column: Text & Actions (Cols 1-7) */}
        <div className="md:col-span-7 space-y-3 sm:space-y-4 md:space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + '-text'}
              initial={{ opacity: 0, y: direction === 'next' ? 12 : -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction === 'next' ? -12 : 12 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="space-y-3 sm:space-y-4"
            >
              {/* Top Category Kicker */}
              <div className="flex items-center gap-2.5">
                <span
                  style={{ color: currentSlide.accentColor }}
                  className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: currentSlide.accentColor }} />
                  <span>{currentSlide.badge}</span>
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {currentIndex + 1} / {FEATURED_SLIDES.length}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-[3.8rem] font-bold text-white tracking-tight leading-[1.08]">
                {currentSlide.title}
              </h1>

              {/* Author */}
              <div className="text-sm sm:text-base font-sans font-medium text-slate-300">
                by <span className="text-white font-semibold">{currentSlide.author}</span>
              </div>

              {/* Synopsis */}
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-lg">
                {currentSlide.synopsis}
              </p>

              {/* Literary Metadata (Unboxed typography, zero-pill discipline) */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-sans pt-1">
                {currentSlide.genres.map((genre, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-600 select-none" aria-hidden="true">·</span>}
                    <span className="text-slate-300 font-medium tracking-wide hover:text-white transition-colors">
                      {genre}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interactive CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRead}
              style={{
                backgroundColor: currentSlide.accentColor,
                boxShadow: `0 12px 28px -6px ${currentSlide.accentColor}55`
              }}
              className="px-6 py-3 text-white font-semibold rounded-full text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleToggleFavorite}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer hover:border-white/30"
            >
              <Bookmark className={`w-4 h-4 ${favorited ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{favorited ? 'In Library' : 'Add to Library'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: 3D Floating Book Cover & Slide Controls (Cols 8-12) */}
        <div className="md:col-span-5 flex items-center justify-center md:justify-end relative select-none">
          {/* Floating 3D Book Cover with Smooth Perspective Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + '-cover'}
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.92, rotateY: -15 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onClick={handleRead}
              className="relative w-48 sm:w-56 lg:w-64 aspect-[2/3] rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_30px_60px_rgba(0,0,0,0.85)] cursor-pointer group transition-transform duration-300 hover:scale-105"
            >
              <img
                src={currentSlide.coverImage}
                alt={`${currentSlide.title} Book Cover`}
                className="w-full h-full object-cover"
              />
              {/* Realistic Hardcover Spine Bevel & Lighting Highlights */}
              <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/50 via-black/15 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </AnimatePresence>

          {/* Slide Arrow Controls on Right Edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 hidden sm:flex">
            <button
              onClick={() => {
                prevSlide();
              }}
              aria-label="Previous featured book"
              className="p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-amber-500/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                nextSlide();
              }}
              aria-label="Next featured book"
              className="p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-amber-500/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Right Carousel Interactive Dots */}
          <div className="absolute -bottom-6 sm:-bottom-7 right-0 flex items-center gap-1.5 z-20">
            {FEATURED_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 'next' : 'prev');
                    setCurrentIndex(idx);
                  }}
                  title={slide.title}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'w-8 bg-white shadow-sm'
                      : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                  style={isActive ? { backgroundColor: currentSlide.accentColor } : {}}
                  aria-label={`Jump to slide ${idx + 1}: ${slide.title}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuneHeroCarousel;
