import React, { useState } from 'react';
import { searchProjectGutenberg, fetchAndParseGutenbergWork, ArchiveSearchResult } from '../../services/archiveSearchClient';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { VibeSearchSection } from './VibeSearchSection';
import { Search, Globe, Compass, BookOpen, ArrowRight, BookMarked, Info, X, Loader2 } from 'lucide-react';
import heroBgImage from '../../assets/images/hero_candlelit_library_1790844657495.jpg';

const SUGGESTED_TITLES = [
  'Treasure Island',
  'Meditations',
  'A Tale of Two Cities',
  'Dracula',
  'Don Quixote',
  'The Odyssey',
  'Moby Dick',
  'Sherlock Holmes'
];

export const LiveArchiveSearchSection: React.FC = () => {
  const { createOrUpdateWork } = useLibrary();
  const { navigate } = useRouter();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'archive' | 'vibe'>('archive');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ArchiveSearchResult[]>([]);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [ingestingTitle, setIngestingTitle] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!q) return;

    if (searchQuery !== undefined) {
      setQuery(searchQuery);
    }

    setIsSearching(true);
    setStatusMsg(`Searching 70,000+ public domain works for "${q}"...`);
    try {
      const res = await searchProjectGutenberg(q);
      setResults(res);
      setStatusMsg(
        res.length > 0
          ? `Found ${res.length} live public domain works.`
          : `No exact matches found for "${q}". Try another title or author.`
      );
    } catch (err: any) {
      setStatusMsg('Failed to query archive repository. Please check internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleIngestAndRead = async (item: ArchiveSearchResult) => {
    setIngestingId(item.id);
    setIngestingTitle(item.title);
    setStatusMsg(`Fetching & structuring unabridged text for "${item.title}"...`);

    try {
      const parsedWork = await fetchAndParseGutenbergWork(item);
      createOrUpdateWork(parsedWork);
      setStatusMsg(`Successfully loaded ${parsedWork.chapters.length} full chapters! Launching reader...`);
      setTimeout(() => {
        navigate(`/read/${parsedWork.slug}`);
      }, 500);
    } catch (err: any) {
      setStatusMsg(`Error parsing work: ${err?.message || 'Download error'}`);
      setIngestingId(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0B101D] p-6 sm:p-8 shadow-xl transition-colors">
      {/* Warm Candlelit Antique Library Background Image on Right */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-2/3 pointer-events-none opacity-20 dark:opacity-40 mix-blend-multiply dark:mix-blend-screen">
        <img
          src={heroBgImage}
          alt=""
          className="w-full h-full object-cover object-right"
        />
        {/* Smooth Fade Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-[#0B101D] dark:via-[#0B101D]/90 dark:to-transparent" />
      </div>

      <div className="relative z-10 space-y-5">
        {/* Top Conduit Label & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6]">
            <Globe className="w-4 h-4" />
            <span>PUBLIC DOMAIN ARCHIVAL CONDUIT</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode('archive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'archive'
                  ? 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>70,000+ Archive</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('vibe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'vibe'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>Atmospheric Curation</span>
            </button>
          </div>

          {/* Micro Archival Loading Badge */}
          {mode === 'archive' && (isSearching || ingestingId) && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700 text-xs font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
              <span>
                {ingestingId
                  ? `Ingesting ${ingestingTitle.substring(0, 15)}...`
                  : `Querying repository...`}
              </span>
            </div>
          )}
        </div>

        {mode === 'vibe' ? (
          <VibeSearchSection />
        ) : (
          <>
            {/* Headline */}
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white tracking-tight leading-tight">
                Search <span className="text-[#FF5733] font-serif font-extrabold">70,000+</span> Classic Books Live
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 font-sans mt-1">
                Timeless stories. Free to read. Forever.
              </p>
            </div>

        {/* Integrated Search Bar with Clear Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3 pt-1"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mandrake the Magician"
              className="w-full pl-11 pr-10 py-3.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border border-stone-300 dark:border-slate-700/80 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-6 py-3.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-md shadow-blue-900/20"
          >
            {isSearching ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search Archive</span>
          </button>
        </form>

        {/* Quick Search Suggestions as Pill Chips */}
        <div className="flex items-center flex-wrap gap-2 text-xs pt-1">
          <span className="text-xs text-stone-500 dark:text-slate-400 mr-1 font-medium">Examples:</span>
          {SUGGESTED_TITLES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleSearch(t)}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer border border-stone-200 dark:border-slate-700/60"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status Message Info Badge */}
        {statusMsg && !isSearching && !ingestingId && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-[#0F172A] border border-stone-200 dark:border-slate-800 text-xs font-mono text-stone-700 dark:text-slate-300">
              <Info className="w-4 h-4 text-sky-500 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-slate-300 uppercase tracking-wider">
              <span>Archival Matches ({results.length}):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-96 overflow-y-auto pr-1">
              {results.map((book) => {
                const isIngestingThis = ingestingId === book.id;
                return (
                  <div
                    key={book.id}
                    className="p-3.5 bg-stone-50 dark:bg-[#090D16] rounded-xl border border-stone-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-2xs hover:border-[#2563EB] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-14 rounded bg-stone-200 dark:bg-slate-800 shrink-0 overflow-hidden border border-stone-300 dark:border-slate-700 flex items-center justify-center">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <BookMarked className="w-5 h-5 text-stone-400 dark:text-slate-500" />
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-blue-500 transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                          by {book.author}
                        </p>
                        <p className="text-[10px] font-mono text-stone-400 dark:text-slate-500 pt-0.5">
                          {book.downloadCount.toLocaleString()} downloads · Public Domain
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleIngestAndRead(book)}
                      disabled={isIngestingThis || !!ingestingId}
                      className="w-full py-2 px-3 bg-stone-900 hover:bg-[#2563EB] dark:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isIngestingThis ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Fetching text...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Fetch & Read Full Book</span>
                          <ArrowRight className="w-3 h-3 ml-auto opacity-70" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
