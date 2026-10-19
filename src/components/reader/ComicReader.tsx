import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chapter, ComicPage, Work, ReadingDirection } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Settings,
  X,
  Sun,
  Moon,
  Coffee,
  List,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface ComicReaderProps {
  work: Work;
  currentChapter: Chapter;
}

export const ComicReader: React.FC<ComicReaderProps> = ({ work, currentChapter }) => {
  const { navigate } = useRouter();
  const { readerSettings, updateSettings, saveReadingProgress } = useLibrary();

  // Asynchronous page fetching for chapters stored in subcollections (prevents 1MB document limit)
  const [asyncPages, setAsyncPages] = useState<ComicPage[] | null>(null);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (currentChapter.pages && currentChapter.pages.length > 0) {
      setAsyncPages(null);
      setIsLoadingPages(false);
      return;
    }

    if (!db || !work.id || !currentChapter.id) return;

    setIsLoadingPages(true);
    getDoc(doc(db, 'works', work.id, 'chapters', currentChapter.id))
      .then((snap) => {
        if (!cancelled && snap.exists()) {
          const data = snap.data() as any;
          if (Array.isArray(data?.pages) && data.pages.length > 0) {
            setAsyncPages(data.pages);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch chapter pages from Firestore subcollection:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [work.id, currentChapter.id, currentChapter.pages]);

  const pages: ComicPage[] = (currentChapter.pages && currentChapter.pages.length > 0)
    ? currentChapter.pages
    : (asyncPages || []);
  const totalPages = pages.length > 0 ? pages.length : 1;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [privacyMask, setPrivacyMask] = useState(false);
  const [atEndOfChapter, setAtEndOfChapter] = useState(false);

  // Settings State
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState<'tight' | 'normal' | 'relaxed'>('normal');
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>(
    (readerSettings.theme as any) || 'light'
  );

  // Chapters list & Next/Prev resolution
  const allChapters = work.chapters || [];
  const currentChapterIdx = allChapters.findIndex(
    (c) => c.id === currentChapter.id || c.slug === currentChapter.slug
  );
  const nextChapter = currentChapterIdx >= 0 && currentChapterIdx < allChapters.length - 1
    ? allChapters[currentChapterIdx + 1]
    : null;
  const prevChapter = currentChapterIdx > 0
    ? allChapters[currentChapterIdx - 1]
    : null;

  // Reset page index & completion state when chapter changes
  useEffect(() => {
    setCurrentPageIndex(0);
    setAtEndOfChapter(false);
  }, [currentChapter.id]);

  // Privacy tab mask effect
  useEffect(() => {
    const originalTitle = document.title;
    if (privacyMask) {
      document.title = 'Reading...';
    } else {
      document.title = `${work.title} - ${currentChapter.title || 'Reader'} · wanna read?`;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [privacyMask, work.title, currentChapter.title]);

  const isManga = work.type === 'manga';
  const effectiveDirection: ReadingDirection =
    readerSettings.readingDirection || (isManga ? 'rtl' : 'ltr');
  const isRTL = effectiveDirection === 'rtl';

  const currentPage = pages[currentPageIndex % (pages.length || 1)] || pages[0];

  // Preload next 2-3 pages
  useEffect(() => {
    if (pages.length > 0) {
      for (let i = 1; i <= 3; i++) {
        const nextIdx = (currentPageIndex + i) % pages.length;
        if (pages[nextIdx]?.imageUrl) {
          const img = new Image();
          img.src = pages[nextIdx].imageUrl;
        }
      }
    }
  }, [currentPageIndex, pages]);

  const handleAdvance = useCallback(() => {
    if (currentPageIndex >= totalPages - 1) {
      setAtEndOfChapter(true);
    } else {
      setAtEndOfChapter(false);
      setCurrentPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
    }
  }, [currentPageIndex, totalPages]);

  const handleRetreat = useCallback(() => {
    if (atEndOfChapter) {
      setAtEndOfChapter(false);
    } else {
      setCurrentPageIndex((prev) => Math.max(0, prev - 1));
    }
  }, [atEndOfChapter]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Touch Swipe Gesture Handling (Mobile / Tablet)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes if horizontal movement > vertical movement
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swiped Left
        if (isRTL) handleAdvance();
        else handleRetreat();
      } else {
        // Swiped Right
        if (isRTL) handleRetreat();
        else handleAdvance();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Sync reading progress
  const lastSavedRef = useRef<string>('');
  useEffect(() => {
    if (privacyMask) return;
    const percent = Math.round(((currentPageIndex + 1) / totalPages) * 100);
    const syncKey = `${work.id}-${currentChapter.id}-${currentPageIndex}-${totalPages}`;
    if (lastSavedRef.current === syncKey) return;
    lastSavedRef.current = syncKey;

    saveReadingProgress({
      workId: work.id,
      chapterId: currentChapter.id,
      chapterNumber: currentChapter.chapterNumber || currentChapter.number || 1,
      chapterTitle: currentChapter.title,
      workTitle: work.title,
      workType: work.type,
      coverImage: work.coverImage,
      percent: atEndOfChapter ? 100 : percent,
      currentPage: currentPageIndex + 1,
      totalPages,
      readingDirection: effectiveDirection,
      lastReadAt: new Date().toISOString(),
    });
  }, [
    currentPageIndex,
    totalPages,
    work.id,
    work.title,
    work.type,
    work.coverImage,
    currentChapter.id,
    currentChapter.chapterNumber,
    currentChapter.number,
    currentChapter.title,
    effectiveDirection,
    privacyMask,
    atEndOfChapter,
    saveReadingProgress
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (isRTL) handleRetreat();
        else handleAdvance();
      } else if (e.key === 'ArrowLeft') {
        if (isRTL) handleAdvance();
        else handleRetreat();
      } else if (e.key === 'Escape') {
        setShowSettings(false);
        setShowChapterDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRTL, handleAdvance, handleRetreat]);

  // Dynamic Theme Colors
  const themeBg =
    readerTheme === 'light'
      ? 'bg-[#F9F8F6] text-[#1A1A1A]'
      : readerTheme === 'sepia'
      ? 'bg-[#F4EFEA] text-[#2D221A]'
      : 'bg-[#121212] text-[#F5F3EF]';

  const headerBg =
    readerTheme === 'light'
      ? 'bg-[#F9F8F6]/95 border-[#E5E3DD]'
      : readerTheme === 'sepia'
      ? 'bg-[#F4EFEA]/95 border-[#E2D8CF]'
      : 'bg-[#121212]/95 border-stone-800';

  const authorName = work.authors?.map((a) => a.name).join(', ') || 'Anonymous';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`min-h-screen ${themeBg} relative flex flex-col transition-colors duration-200 select-none overflow-x-hidden`}
    >
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className={`sticky top-0 z-30 h-16 border-b backdrop-blur-md px-4 sm:px-8 flex items-center justify-between ${headerBg}`}>
        {/* Left: Back & Table of Contents Trigger */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button
            onClick={() => navigate(`/work/${work.slug}`)}
            className="flex items-center gap-1.5 text-xs font-sans font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Work Overview</span>
          </button>

          <button
            onClick={() => setShowChapterDrawer(!showChapterDrawer)}
            title="Table of Contents"
            aria-label="Table of Contents"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer shrink-0"
          >
            <List className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {currentChapter.title || `Chapter ${currentChapter.chapterNumber || currentChapter.number || 1}`}
            </span>
          </button>
        </div>

        {/* Center: Title and Author (Hidden on mobile) */}
        <div className="text-center hidden md:block px-4 truncate min-w-0">
          <h1 className="font-serif font-bold text-sm sm:text-base text-[#1A1A1A] dark:text-[#F5F3EF] truncate">
            {work.title}
          </h1>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans truncate">
            {authorName}
          </p>
        </div>

        {/* Right: Page Counter + Settings + Fullscreen */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono font-medium text-stone-700 dark:text-stone-300">
              {atEndOfChapter ? 'Completed' : `Page ${currentPageIndex + 1} / ${totalPages}`}
            </span>
            {/* Progress Bar */}
            <div className="w-20 sm:w-28 h-1 bg-stone-200 dark:bg-stone-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-amber-600 dark:bg-amber-400 transition-all duration-300"
                style={{ width: `${atEndOfChapter ? 100 : ((currentPageIndex + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Reader Settings"
            aria-label="Reader Settings"
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label="Toggle Fullscreen"
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main Reader Viewport ────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-2 sm:px-6 py-4 sm:py-8 flex items-center justify-center relative min-h-[calc(100vh-8rem)]">
        
        {/* Left Arrow Circle */}
        <button
          onClick={isRTL ? handleAdvance : handleRetreat}
          disabled={isRTL ? atEndOfChapter : (currentPageIndex === 0 && !atEndOfChapter)}
          aria-label={isRTL ? "Next Page" : "Previous Page"}
          className="p-3 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-md text-stone-700 dark:text-stone-200 hover:scale-105 disabled:opacity-20 disabled:pointer-events-none transition-all mr-2 sm:mr-6 shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Page or End of Chapter Card */}
        <div className="w-full max-w-2xl bg-white dark:bg-stone-900 shadow-2xl rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
          {atEndOfChapter ? (
            /* ── End of Chapter Transition Screen ── */
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6 bg-[#FDFCFB] dark:bg-[#0E1526]">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Chapter Complete
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                  {currentChapter.title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400">
                  You've read all {totalPages} pages of this installment.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-2">
                {nextChapter ? (
                  <button
                    onClick={() => {
                      navigate(`/read/${work.id}/${nextChapter.id}`);
                    }}
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 transition-all cursor-pointer"
                  >
                    <span>Proceed to Next Chapter</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/library?type=manga')}
                    className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Browse More Manga</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setAtEndOfChapter(false);
                    setCurrentPageIndex(0);
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-read</span>
                </button>
              </div>
            </div>
          ) : isLoadingPages && pages.length === 0 ? (
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-700 border-t-[#C25E3A] animate-spin" />
              <div className="text-xs font-mono uppercase tracking-widest text-stone-500">
                Retrieving manga panels...
              </div>
            </div>
          ) : currentPage?.svgArt ? (
            <div
              dangerouslySetInnerHTML={{ __html: currentPage.svgArt }}
              className="w-full h-auto"
            />
          ) : currentPage?.imageUrl ? (
            <img
              src={currentPage.imageUrl}
              alt={`Page ${currentPageIndex + 1}`}
              className="w-full h-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center p-8 text-center bg-white text-stone-800 space-y-4">
              <div className="font-serif text-2xl font-bold">{work.title}</div>
              <div className="text-xs font-mono uppercase tracking-widest text-stone-400">
                Page {currentPageIndex + 1} of {totalPages}
              </div>
              <p className="text-sm text-stone-600 max-w-md italic leading-relaxed">
                {work.synopsis || work.description || 'Enjoy reading this classic publication.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Arrow Circle */}
        <button
          onClick={isRTL ? handleRetreat : handleAdvance}
          disabled={isRTL ? (currentPageIndex === 0 && !atEndOfChapter) : atEndOfChapter}
          aria-label={isRTL ? "Previous Page" : "Next Page"}
          className="p-3 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-md text-stone-700 dark:text-stone-200 hover:scale-105 disabled:opacity-20 disabled:pointer-events-none transition-all ml-2 sm:ml-6 shrink-0 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

      </main>

      {/* ── Slide-Over Table of Contents Drawer ─────────────────────── */}
      <AnimatePresence>
        {showChapterDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChapterDrawer(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="fixed inset-y-0 left-0 z-50 w-80 sm:w-96 bg-white dark:bg-[#121824] border-r border-stone-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col space-y-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold">
                  <List className="w-4 h-4" />
                  <span>Table of Contents</span>
                </div>
                <button
                  onClick={() => setShowChapterDrawer(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {allChapters.map((ch, idx) => {
                  const isActive = ch.id === currentChapter.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        navigate(`/read/${work.id}/${ch.id}`);
                        setShowChapterDrawer(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800/60'
                          : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                          Chapter {ch.chapterNumber || ch.number || idx + 1}
                        </div>
                        <div className="font-serif text-sm truncate">
                          {ch.title || `Chapter ${idx + 1}`}
                        </div>
                      </div>
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-mono text-stone-400 shrink-0">
                          {ch.pagesCount || ch.pages?.length || 1}p
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Slide-Over Reader Settings Drawer ───────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <>
            <div
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed right-4 sm:right-8 top-20 z-50 w-80 sm:w-88 bg-white dark:bg-[#1A1918] rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-6"
            >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h2 className="font-sans font-bold text-base text-[#1A1A1A] dark:text-[#F5F3EF]">
                Reader Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="block text-xs font-sans font-semibold text-stone-700 dark:text-stone-300">
                Font Size
              </label>
              <div className="flex items-center justify-between bg-stone-100 dark:bg-stone-900 rounded-lg p-1 border border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                  className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
                >
                  A-
                </button>
                <span className="text-xs font-mono font-medium text-stone-900 dark:text-white">
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                  className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <label className="block text-xs font-sans font-semibold text-stone-700 dark:text-stone-300">
                Line Height
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-stone-100 dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
                {(['tight', 'normal', 'relaxed'] as const).map((mode) => {
                  const active = lineHeight === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setLineHeight(mode)}
                      className={`py-1.5 text-xs font-medium rounded capitalize transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:bg-white/60 dark:hover:bg-stone-800'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Selector (Light, Sepia, Dark) */}
            <div className="space-y-2">
              <label className="block text-xs font-sans font-semibold text-stone-700 dark:text-stone-300">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Light */}
                <button
                  onClick={() => {
                    setReaderTheme('light');
                    updateSettings({ theme: 'light' });
                  }}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    readerTheme === 'light'
                      ? 'border-amber-600 bg-amber-50/40 text-amber-700 ring-1 ring-amber-600'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-xs font-medium">Light</span>
                </button>

                {/* Sepia */}
                <button
                  onClick={() => {
                    setReaderTheme('sepia');
                    updateSettings({ theme: 'sepia' });
                  }}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    readerTheme === 'sepia'
                      ? 'border-amber-600 bg-[#F4EFEA] text-[#8C6239] ring-1 ring-amber-600'
                      : 'border-stone-200 dark:border-stone-800 bg-[#F4EFEA]/80 text-[#5C4033]'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span className="text-xs font-medium">Sepia</span>
                </button>

                {/* Dark */}
                <button
                  onClick={() => {
                    setReaderTheme('dark');
                    updateSettings({ theme: 'dark' });
                  }}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    readerTheme === 'dark'
                      ? 'border-amber-600 bg-[#121212] text-white ring-1 ring-amber-600'
                      : 'border-stone-200 dark:border-stone-800 bg-[#121212] text-stone-300'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-xs font-medium">Dark</span>
                </button>
              </div>
            </div>

            {/* Reading Direction (Manga) */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-sans font-semibold text-stone-700 dark:text-stone-300">
                Reading Direction (Manga)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSettings({ readingDirection: 'ltr' })}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    !isRTL
                      ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/30 font-semibold ring-1 ring-amber-600'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-900'
                  }`}
                >
                  LTR (Left to Right)
                </button>
                <button
                  onClick={() => updateSettings({ readingDirection: 'rtl' })}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    isRTL
                      ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/30 font-semibold ring-1 ring-amber-600'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-900'
                  }`}
                >
                  RTL (Right to Left)
                </button>
              </div>
            </div>

            {/* Privacy & Discreet Reading Toggle */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="flex items-center justify-between text-xs font-sans font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                <span>Privacy Mode (Mask Tab Title)</span>
                <input
                  type="checkbox"
                  checked={privacyMask}
                  onChange={(e) => setPrivacyMask(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                />
              </label>
              <p className="text-[11px] text-stone-500">
                Disguises browser title as "Reading..." and pauses analytics synchronization.
              </p>
            </div>

          </motion.div>
        </>
      )}
      </AnimatePresence>

    </div>
  );
};
export default ComicReader;
