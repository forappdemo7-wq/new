import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chapter, Work, ReaderSettings } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { getChapterContent } from '../../services/storage';
import { AudioNarrationPlayer } from './AudioNarrationPlayer';
import { ReadingLabDrawer } from './ReadingLabDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bookmark as BookmarkIcon,
  List,
  Maximize,
  Minimize,
  X,
  Pin,
  PinOff,
  Volume2,
  BookOpen,
} from 'lucide-react';

interface BookReaderProps {
  work: Work;
  currentChapter: Chapter;
}

interface ThemeToken {
  page: string;
  chrome: string;
  border: string;
  text: string;
  muted: string;
  hover: string;
  track: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const THEMES: Record<ReaderSettings['theme'], ThemeToken> = {
  light: {
    page: 'bg-[#F9F8F6] text-[#1A1A1A]',
    chrome: 'bg-[#F9F8F6]/92 backdrop-blur-md',
    border: 'border-stone-200',
    text: 'text-[#1A1A1A]',
    muted: 'text-stone-500',
    hover: 'hover:bg-stone-200/60',
    track: 'bg-stone-200',
    activeBg: 'bg-[#C25E3A]/10',
    activeBorder: 'border-[#C25E3A]',
    activeText: 'text-[#C25E3A]',
  },
  sepia: {
    page: 'bg-[#F3ECE2] text-[#2D221A]',
    chrome: 'bg-[#F3ECE2]/92 backdrop-blur-md',
    border: 'border-[#E0D5C5]',
    text: 'text-[#2D221A]',
    muted: 'text-[#6D5A4A]',
    hover: 'hover:bg-[#E6DBCE]',
    track: 'bg-[#DFD4C3]',
    activeBg: 'bg-[#C25E3A]/15',
    activeBorder: 'border-[#C25E3A]',
    activeText: 'text-[#8A381C]',
  },
  dark: {
    page: 'bg-[#141414] text-[#E5E2DC]',
    chrome: 'bg-[#141414]/92 backdrop-blur-md',
    border: 'border-white/10',
    text: 'text-[#F5F3EF]',
    muted: 'text-stone-400',
    hover: 'hover:bg-white/10',
    track: 'bg-white/10',
    activeBg: 'bg-[#C25E3A]/25',
    activeBorder: 'border-[#E07049]',
    activeText: 'text-[#E07049]',
  },
  oled: {
    page: 'bg-black text-[#D6D3CD]',
    chrome: 'bg-black/92 backdrop-blur-md',
    border: 'border-stone-800',
    text: 'text-white',
    muted: 'text-stone-500',
    hover: 'hover:bg-white/10',
    track: 'bg-stone-900',
    activeBg: 'bg-[#C25E3A]/25',
    activeBorder: 'border-[#E07049]',
    activeText: 'text-[#E07049]',
  },
};

const FONTS: Record<ReaderSettings['fontFamily'], string> = {
  serif: 'font-reading',
  sans: 'font-sans',
  mono: 'font-mono',
  dyslexic: 'font-sans tracking-wide',
};

const WIDTHS: Record<ReaderSettings['maxWidth'], string> = {
  narrow: 'max-w-xl',
  normal: 'max-w-2xl',
  wide: 'max-w-3xl',
  full: 'max-w-4xl',
};

export const BookReader: React.FC<BookReaderProps> = ({ work, currentChapter }) => {
  const { navigate } = useRouter();
  const { readerSettings, updateSettings, saveReadingProgress, addNewBookmark } = useLibrary();

  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showBookmarkPrompt, setShowBookmarkPrompt] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showAudioNarration, setShowAudioNarration] = useState(false);
  const [showReadingLab, setShowReadingLab] = useState(false);
  const [activeNarratedPara, setActiveNarratedPara] = useState<number | null>(null);

  // Auto-hiding chrome controls state
  const [chromePinned, setChromePinned] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  const currentIndex = work.chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? work.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < work.chapters.length - 1 ? work.chapters[currentIndex + 1] : null;

  const t = THEMES[readerSettings.theme];

  // Auto-hide controls logic
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (!chromePinned && !showSettings && !showToc && !showBookmarkPrompt) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3500);
    }
  }, [chromePinned, showSettings, showToc, showBookmarkPrompt]);

  useEffect(() => {
    const onMouseMove = () => resetHideTimer();
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchstart', onMouseMove, { passive: true });
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onMouseMove);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Scroll tracking
  const lastSavedPctRef = useRef<number>(-1);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentScroll = window.scrollY;
        const pct = totalHeight > 0 ? Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100))) : 0;
        setScrollProgress(pct);

        if (Math.abs(pct - lastSavedPctRef.current) >= 3 || pct === 100) {
          lastSavedPctRef.current = pct;
          saveReadingProgress({
            workId: work.id,
            chapterId: currentChapter.id,
            chapterNumber: currentChapter.number,
            chapterTitle: currentChapter.title,
            workTitle: work.title,
            workType: work.type,
            coverImage: work.coverImage,
            percent: pct,
            lastReadAt: new Date().toISOString(),
          });
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [
    work.id,
    work.title,
    work.type,
    work.coverImage,
    currentChapter.id,
    currentChapter.number,
    currentChapter.title,
    saveReadingProgress
  ]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSaveBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    addNewBookmark({
      workId: work.id,
      chapterId: currentChapter.id,
      workTitle: work.title,
      chapterTitle: currentChapter.title,
      note: bookmarkNote.trim() || undefined,
    });
    setBookmarkNote('');
    setShowBookmarkPrompt(false);
  };

  return (
    <div
      ref={readerContainerRef}
      className={`min-h-screen relative select-text transition-colors duration-200 flex flex-col ${t.page}`}
    >
      {/* ── Auto-hiding Sleek Top Header Bar ─────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 border-b transition-transform duration-300 ${t.chrome} ${t.border} ${
          controlsVisible || chromePinned ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left: Back & Table of Contents */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate(`/work/${work.slug}`)}
              aria-label="Back to overview"
              className={`p-2 rounded-md transition-colors ${t.hover}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowToc(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${t.hover}`}
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
              <span className="truncate max-w-[140px] sm:max-w-xs">{currentChapter.title}</span>
            </button>
          </div>

          {/* Center: Reading Progress Info */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <span className={t.muted}>
              Chapter {currentChapter.number} of {work.chapters.length}
            </span>
            <span className={t.muted}>·</span>
            <span className="font-semibold text-[#C25E3A] dark:text-[#E07049]">
              {scrollProgress}% read
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Reading Lab Assisted Analysis */}
            <button
              onClick={() => setShowReadingLab(true)}
              title="Reading Lab (Scholarly Analysis & Summaries)"
              aria-label="Reading Lab"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showReadingLab
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold'
                  : 'bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/60 dark:hover:bg-stone-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#C25E3A]" />
              <span className="hidden lg:inline">Reading Lab</span>
            </button>

            {/* AI Voice Narration */}
            <button
              onClick={() => setShowAudioNarration(prev => !prev)}
              title="AI Voice Narration (Text-to-Speech)"
              aria-label="AI Voice Narration (Text-to-Speech)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showAudioNarration
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Listen (AI)</span>
            </button>

            {/* Bookmark button */}
            <button
              onClick={() => setShowBookmarkPrompt(true)}
              title="Bookmark section"
              aria-label="Bookmark section"
              className={`p-2 rounded-md transition-colors ${t.hover}`}
            >
              <BookmarkIcon className="w-4 h-4" />
            </button>

            {/* Pin controls visible */}
            <button
              onClick={() => setChromePinned(!chromePinned)}
              title={chromePinned ? 'Unpin top bar' : 'Pin top bar'}
              aria-label={chromePinned ? 'Unpin top bar' : 'Pin top bar'}
              className={`p-2 rounded-md transition-colors ${t.hover} ${chromePinned ? 'text-[#C25E3A]' : ''}`}
            >
              {chromePinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>

            {/* Settings gear */}
            <button
              onClick={() => setShowSettings(true)}
              title="Display & Typography Settings"
              aria-label="Display & Typography Settings"
              className={`p-2 rounded-md transition-colors ${t.hover}`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
              aria-label="Toggle fullscreen"
              className={`hidden sm:flex p-2 rounded-md transition-colors ${t.hover}`}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Top Slim Reading Progress Bar */}
        <div className={`h-[2px] w-full ${t.track}`}>
          <div
            className="h-full bg-[#C25E3A] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </header>

      {/* ── Main Book Content ────────────────────────────────────── */}
      <main
        ref={contentRef}
        className={`flex-1 w-full mx-auto px-5 sm:px-6 pt-24 pb-20 ${WIDTHS[readerSettings.maxWidth]}`}
      >
        {/* Chapter Title Head */}
        <div className={`mb-12 pb-8 border-b text-center ${t.border}`}>
          <div className={`text-[10px] uppercase tracking-[0.24em] font-mono ${t.muted}`}>
            {work.title} · Chapter {currentChapter.number}
          </div>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            {currentChapter.title}
          </h1>
          {work.authors[0]?.name && (
            <div className={`mt-3 text-xs tracking-wide ${t.muted}`}>
              by {work.authors[0].name}
            </div>
          )}
        </div>

        {/* Prose Article / PDF Page Images */}
        <article
          className={`space-y-6 leading-relaxed select-text ${FONTS[readerSettings.fontFamily]}`}
          style={{
            fontSize: `${readerSettings.fontSize}px`,
            lineHeight: readerSettings.lineHeight,
          }}
        >
          {(() => {
            // Render page images if present (e.g. from PDF scan or image pages upload)
            if (currentChapter.pages && currentChapter.pages.length > 0) {
              return (
                <div className="space-y-8">
                  {currentChapter.pages.map((p, idx) => (
                    <div key={p.id || idx} className="space-y-2 text-center">
                      <div className="rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-md bg-stone-100 dark:bg-stone-900 inline-block max-w-full">
                        <img
                          src={p.imageUrl}
                          alt={p.altText || `Page ${idx + 1}`}
                          className="max-w-full max-h-[85vh] object-contain mx-auto"
                        />
                      </div>
                      <div className={`text-[11px] font-mono ${t.muted}`}>
                        Page {idx + 1} of {currentChapter.pages?.length}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            const rawBody = (currentChapter.content && currentChapter.content.length > 20) 
              ? currentChapter.content 
              : getChapterContent(currentChapter.id) || currentChapter.content || '';
            
            if (!rawBody) {
              return (
                <p className="italic text-stone-500">
                  No textual contents found for this chapter entry.
                </p>
              );
            }

            return rawBody.split(/\n{2,}/).map((paragraph, idx) => (
              <p
                key={idx}
                className={`leading-relaxed transition-all duration-300 ${
                  activeNarratedPara === idx && showAudioNarration
                    ? 'bg-amber-500/10 dark:bg-amber-400/15 p-3 rounded-xl border-l-4 border-amber-500 shadow-xs'
                    : ''
                }`}
              >
                {paragraph}
              </p>
            ));
          })()}
        </article>

        {/* Next / Previous Chapter Navigation */}
        <div className={`mt-16 pt-8 border-t flex items-center justify-between gap-4 ${t.border}`}>
          {prevChapter ? (
            <button
              onClick={() => navigate(`/read/${work.id}/${prevChapter.id}`)}
              className={`px-4 py-2 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 ${t.border} ${t.hover}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous: {prevChapter.title}</span>
            </button>
          ) : (
            <div />
          )}

          {nextChapter && (
            <button
              onClick={() => navigate(`/read/${work.id}/${nextChapter.id}`)}
              className="px-4 py-2 text-xs font-semibold rounded bg-[#C25E3A] hover:bg-[#A84D2C] text-white transition-colors flex items-center gap-1.5 ml-auto"
            >
              <span>Next: {nextChapter.title}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>

      {/* ── Auto-hiding Sleek Bottom Reading Bar ──────────────────── */}
      <footer
        className={`fixed bottom-0 inset-x-0 z-40 border-t transition-transform duration-300 ${t.chrome} ${t.border} ${
          controlsVisible || chromePinned ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="px-4 sm:px-6 h-12 flex items-center justify-between gap-4 max-w-7xl mx-auto text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold truncate">{work.title}</span>
            <span className={t.muted}>/</span>
            <span className={`${t.muted} truncate`}>{currentChapter.title}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={t.muted}>Progress:</span>
            <div className={`w-28 sm:w-44 h-1.5 rounded-full overflow-hidden ${t.track}`}>
              <div
                className="h-full bg-[#C25E3A] transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums text-[#C25E3A] dark:text-[#E07049]">
              {scrollProgress}%
            </span>
          </div>
        </div>
      </footer>

      {/* ── Settings Drawer / Panel ───────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className={`w-full max-w-sm h-full p-6 shadow-2xl flex flex-col space-y-6 overflow-y-auto ${t.page} border-l ${t.border}`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <h3 className="font-serif text-lg font-bold">Reader Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-1.5 rounded ${t.hover}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Selector: Light, Sepia, Dark, OLED */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  {[
                    { id: 'light', label: 'Light (#F9F8F6)' },
                    { id: 'sepia', label: 'Sepia (Warm)' },
                    { id: 'dark', label: 'Dark (#141414)' },
                    { id: 'oled', label: 'OLED (Pure Black)' },
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      onClick={() => updateSettings({ theme: thm.id as ReaderSettings['theme'] })}
                      className={`p-2.5 rounded border text-left transition-colors ${
                        readerSettings.theme === thm.id
                          ? 'border-[#C25E3A] ring-1 ring-[#C25E3A] font-semibold'
                          : 'border-stone-300 dark:border-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {thm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typeface Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                  Typeface
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'serif', label: 'Serif' },
                    { id: 'sans', label: 'Sans' },
                    { id: 'mono', label: 'Mono' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateSettings({ fontFamily: f.id as ReaderSettings['fontFamily'] })}
                      className={`py-2 rounded border text-center transition-colors ${
                        readerSettings.fontFamily === f.id
                          ? 'border-[#C25E3A] ring-1 ring-[#C25E3A] font-semibold'
                          : 'border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                    Font Size
                  </label>
                  <span className="font-mono font-semibold">{readerSettings.fontSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={14}
                    max={26}
                    step={1}
                    value={readerSettings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                    className="w-full h-1 bg-stone-300 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#C25E3A]"
                  />
                </div>
              </div>

              {/* Line Height Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                  Line Height
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { val: 1.5, label: 'Tight' },
                    { val: 1.75, label: 'Relaxed' },
                    { val: 2.0, label: 'Spacious' },
                  ].map((lh) => (
                    <button
                      key={lh.val}
                      onClick={() => updateSettings({ lineHeight: lh.val })}
                      className={`py-2 rounded border text-center transition-colors ${
                        readerSettings.lineHeight === lh.val
                          ? 'border-[#C25E3A] ring-1 ring-[#C25E3A] font-semibold'
                          : 'border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {lh.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Measure / Column Width */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                  Column Width
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'narrow', label: 'Narrow' },
                    { id: 'normal', label: 'Standard' },
                    { id: 'wide', label: 'Wide' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => updateSettings({ maxWidth: w.id as ReaderSettings['maxWidth'] })}
                      className={`py-2 rounded border text-center transition-colors ${
                        readerSettings.maxWidth === w.id
                          ? 'border-[#C25E3A] ring-1 ring-[#C25E3A] font-semibold'
                          : 'border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Table of Contents Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showToc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md max-h-[80vh] p-6 rounded-lg shadow-2xl flex flex-col space-y-4 ${t.page} border ${t.border}`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <h3 className="font-serif text-lg font-bold">Chapters</h3>
                <button onClick={() => setShowToc(false)} className={`p-1.5 rounded ${t.hover}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-sans text-xs">
                {work.chapters.map((chap) => {
                  const isCurrent = chap.id === currentChapter.id;
                  return (
                    <button
                      key={chap.id}
                      onClick={() => {
                        navigate(`/read/${work.id}/${chap.id}`);
                        setShowToc(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center justify-between ${
                        isCurrent
                          ? 'bg-[#C25E3A] text-white font-semibold'
                          : 'hover:bg-stone-200/50 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{chap.title}</span>
                      <span className="font-mono text-[10px] opacity-70">Ch. {chap.number}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Bookmark Prompt Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showBookmarkPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm p-5 rounded-lg shadow-xl ${t.page} border ${t.border}`}
            >
              <h3 className="font-serif text-base font-bold mb-2">Save Bookmark</h3>
              <p className="text-xs text-stone-500 mb-3">
                Bookmark {currentChapter.title} at {scrollProgress}% read.
              </p>
              <form onSubmit={handleSaveBookmark} className="space-y-3">
                <input
                  type="text"
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  placeholder="Optional bookmark note…"
                  className="w-full px-3 py-2 text-xs rounded border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none focus:border-[#C25E3A]"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookmarkPrompt(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#C25E3A] hover:bg-[#A84D2C] rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── AI Voice Narration Floating Player ──────────────────── */}
      {showAudioNarration && (
        <AudioNarrationPlayer
          workTitle={work.title}
          chapterTitle={currentChapter.title}
          chapterContent={
            (currentChapter.content && currentChapter.content.length > 50)
              ? currentChapter.content
              : getChapterContent(currentChapter.id) || currentChapter.content || ''
          }
          onParagraphChange={(idx) => setActiveNarratedPara(idx)}
          onClose={() => {
            setShowAudioNarration(false);
            setActiveNarratedPara(null);
          }}
        />
      )}
      {/* ── Reading Lab Assisted Analysis Drawer ──────────────── */}
      <ReadingLabDrawer
        isOpen={showReadingLab}
        onClose={() => setShowReadingLab(false)}
        work={work}
        chapter={currentChapter}
      />
    </div>
  );
};
