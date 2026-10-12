import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { searchUsers } from '../../services/userSearchService';
import { UserSearchDropdown } from '../common/UserSearchComponents';
import {
  Search,
  ArrowRight,
  BookOpen,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react';
import featuredCover from '../../assets/images/manga_hokusai_woodblock_1790760941217.jpg';

export const HeroMarquee: React.FC = () => {
  const { navigate } = useRouter();
  const { progress, works } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchedUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchUsers(searchQuery, works);
  }, [searchQuery, works]);

  const recentProgressList = Object.values(progress || {}).sort(
    (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
  );
  const activeProgress = recentProgressList[0];
  const activeWork = activeProgress
    ? works.find((w) => w.id === activeProgress.workId)
    : null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/library?q=${encodeURIComponent(q)}` : '/library');
  };

  const departments: { label: string; href: string; accent?: boolean }[] = [
    { label: 'Classic Literature', href: '/library?type=book' },
    { label: 'Open Manga & Ukiyo-e', href: '/library?type=manga' },
    { label: 'Graphic Narratives', href: '/library?type=comic' },
    { label: 'Audited Archives', href: '/sources', accent: true },
  ];

  return (
    <section className="relative overflow-hidden bg-[#FAF8F5] text-stone-900 border-b border-[#E7E3DC]">
      {/* ── Trust strip ───────────────────────────────────── */}
      <div className="border-b border-[#E7E3DC]/80 bg-[#F4EFE6]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4 text-[10px] font-mono tracking-[0.18em] uppercase">
          <div className="flex items-center gap-2 text-stone-600 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800/80 shrink-0" />
            <span className="text-stone-800 font-semibold truncate">
              Open Commons Repository
            </span>
            <span className="text-stone-400 hidden sm:inline">/</span>
            <span className="hidden sm:inline truncate">
              Public Domain &amp; Creative Commons
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-stone-500 shrink-0">
            <span>Zero Surveillance</span>
            <span className="text-stone-300">·</span>
            <span>No Registration</span>
            <span className="text-stone-300">·</span>
            <span>Offline Readers</span>
          </div>
        </div>
      </div>

      {/* ── Hero body ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: editorial lead */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.2em] uppercase text-amber-900">
                <span aria-hidden="true" className="inline-block w-6 h-px bg-amber-800/60" />
                <span className="font-semibold">Vol. 2026 — Open Folios</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-medium tracking-tight text-stone-900 leading-[1.05] text-balance">
                A sovereign sanctuary for literature, manga, and graphic narratives.
              </h1>
            </div>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
              Curated without subscription gates, ad trackers, or scanlation
              compromises. World-renowned public domain literature, Edo-period
              woodblock sequential art, and verified open-license contemporary
              works — all in one archive.
            </p>

            {/* Search */}
            <div ref={searchContainerRef} className="max-w-xl pt-1 relative">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative flex items-center bg-white rounded-full border border-stone-300 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all focus-within:border-stone-900 focus-within:shadow-[0_4px_24px_-12px_rgba(28,25,23,0.35)]">
                  <Search className="w-[18px] h-[18px] text-stone-400 absolute left-5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search by title, author, or username…"
                    className="flex-1 min-w-0 bg-transparent pl-12 pr-4 py-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
                    aria-label="Search the catalog"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 mr-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="mr-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-amber-900 rounded-full transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Search Folios
                  </button>
                </div>
              </form>

              {/* Instant user search dropdown */}
              <UserSearchDropdown
                users={matchedUsers}
                isOpen={isSearchFocused && Boolean(searchQuery.trim()) && matchedUsers.length > 0}
                onClose={() => setIsSearchFocused(false)}
                onSelectUser={(u) => navigate(`/user/${u.uid}`)}
              />
            </div>

            {/* Departments */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mr-1">
                Browse
              </span>
              {departments.map((d) => (
                <button
                  key={d.href}
                  onClick={() => navigate(d.href)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/50 ${
                    d.accent
                      ? 'border-amber-900/25 text-amber-900 hover:bg-amber-900/[0.06]'
                      : 'border-stone-900/10 text-stone-700 hover:text-stone-950 hover:bg-stone-900/[0.05] hover:border-stone-900/20'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Resume reading */}
            {activeProgress && activeWork && (
              <div className="max-w-xl rounded-2xl bg-white/70 border border-stone-900/10 shadow-[0_1px_2px_rgba(28,25,23,0.04)] overflow-hidden">
                <div className="h-0.5 bg-stone-200/70">
                  <div
                    className="h-full bg-amber-800 transition-[width] duration-500"
                    style={{ width: `${Math.min(100, activeProgress.percent)}%` }}
                  />
                </div>
                <div className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-10 h-14 bg-stone-200 shrink-0 rounded-md overflow-hidden ring-1 ring-stone-900/10">
                      <img
                        src={activeWork.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/50 to-transparent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em] text-amber-900">
                        <Clock className="w-3 h-3" />
                        <span>Resume · {activeProgress.percent}% complete</span>
                      </div>
                      <div className="font-serif text-[15px] font-medium text-stone-900 truncate mt-0.5">
                        {activeWork.title}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/read/${activeWork.id}/${activeProgress.chapterId}`)
                    }
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-stone-900 text-white hover:bg-amber-900 rounded-full transition-colors"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: spotlight card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-stone-900/10 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_60px_-36px_rgba(28,25,23,0.35)] overflow-hidden">
              {/* Card header */}
              <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-stone-900/[0.07]">
                <div className="flex items-center gap-2 text-stone-900">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.18em] font-semibold">
                    Curatorial Spotlight
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-stone-400 shrink-0">
                  CC0 · Public Domain
                </span>
              </div>

              {/* Card body */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-12 gap-5 items-start">
                  <div className="col-span-5">
                    <button
                      onClick={() => navigate('/manga/hokusai-manga-vol-1')}
                      className="group block w-full aspect-[3/4] rounded-lg overflow-hidden ring-1 ring-stone-900/10 shadow-[0_10px_30px_-12px_rgba(28,25,23,0.45)] transition-transform duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/50"
                      aria-label="Open Hokusai Manga Vol. 1"
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={featuredCover}
                          alt="Hokusai Manga original woodblock cover"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
                      </div>
                    </button>
                  </div>

                  <div className="col-span-7 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-stone-500">
                      Acc. 1814.01 — Edo Japan
                    </div>
                    <h3 className="font-serif text-[22px] font-medium text-stone-950 leading-tight">
                      Hokusai Manga Vol. 1
                    </h3>
                    <div className="text-xs text-stone-600 font-medium">
                      Katsushika Hokusai · 1760–1849
                    </div>
                    <p className="text-[13px] text-stone-600 leading-relaxed">
                      The historic woodblock sketch anthology that established
                      the pictorial foundations of modern Japanese sequential
                      art.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-4">
                  <button
                    onClick={() => navigate('/manga/hokusai-manga-vol-1')}
                    className="group/btn inline-flex items-center gap-2 text-sm font-semibold text-stone-900 hover:text-amber-900 transition-colors"
                  >
                    <span>Inspect Folios</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">
                    RTL
                  </span>
                </div>
              </div>

              {/* Card footer */}
              <div className="px-6 py-3 bg-[#F4EFE6]/60 border-t border-stone-900/[0.07] flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.14em] text-stone-500">
                <span className="truncate">Smithsonian Libraries &amp; Archives</span>
                <span className="shrink-0">Verified Source</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Integrity footer strip ───────────────────────── */}
      <div className="border-t border-[#E7E3DC]/80 bg-[#F4EFE6]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-4 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono uppercase tracking-[0.18em] text-stone-800 font-semibold text-[10px] shrink-0">
              Archival Integrity
            </span>
            <span className="text-stone-400 hidden sm:inline">—</span>
            <span className="text-stone-500 hidden sm:inline truncate">
              Entries verified against public domain &amp; open-license jurisdictions
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => navigate('/sources')}
              className="text-stone-600 hover:text-stone-950 transition-colors"
            >
              Repositories
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => navigate('/license/overview')}
              className="text-stone-600 hover:text-stone-950 transition-colors"
            >
              Licenses
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => navigate('/opds')}
              className="font-mono text-amber-900 hover:text-amber-950 font-medium transition-colors"
            >
              OPDS 1.2
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};