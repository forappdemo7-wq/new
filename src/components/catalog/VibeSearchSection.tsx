import React, { useState } from 'react';
import { Compass, BookOpen, ArrowRight, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { queryVibeSearch, VibeMatchResult } from '../../services/geminiClient';
import { fetchAndParseGutenbergWork, searchProjectGutenberg } from '../../services/archiveSearchClient';

const PRESET_ATMOSPHERES = [
  { label: 'Gothic & Psychological Suspense', query: 'Dark, haunting gothic mystery with psychological dread and eerie atmosphere' },
  { label: 'Victorian Wit & Comedy of Manners', query: 'Cozy Victorian romance with witty banter, ballrooms, and clever heroines' },
  { label: 'High Seas & Maritime Narrative', query: 'Thrilling maritime adventure on the high seas with navigation, uncharted waters and peril' },
  { label: 'Stoic Antiquity & Inner Stillness', query: 'Ancient philosophical wisdom to quiet anxiety, build resilience and inner peace' },
  { label: 'Early Speculative & Visionary Fiction', query: 'Early visionary science fiction exploring human hubris, biology, and uncharted worlds' },
  { label: 'Poetic Solitude & Contemplation', query: 'Atmospheric, reflective, and poetic literary read for quiet contemplation' }
];

export const VibeSearchSection: React.FC = () => {
  const { works, createOrUpdateWork } = useLibrary();
  const { navigate } = useRouter();

  const [vibeQuery, setVibeQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VibeMatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ingestingTitle, setIngestingTitle] = useState<string | null>(null);

  const handleSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : vibeQuery).trim();
    if (!q) return;

    if (queryText !== undefined) {
      setVibeQuery(queryText);
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const catalogSummary = works.slice(0, 25).map(w => ({
        id: w.id,
        title: w.title,
        author: w.authors[0]?.name || 'Unknown',
        genres: w.genres || [],
        synopsis: w.synopsis || w.description || ''
      }));

      const res = await queryVibeSearch(q, catalogSummary);
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not connect to literary curation service.');
    } finally {
      setLoading(false);
    }
  };

  const handleIngestArchiveWork = async (title: string, author: string) => {
    setIngestingTitle(title);
    try {
      const searchRes = await searchProjectGutenberg(`${title} ${author}`);
      if (searchRes.length > 0) {
        const parsedWork = await fetchAndParseGutenbergWork(searchRes[0]);
        createOrUpdateWork(parsedWork);
        setTimeout(() => {
          navigate(`/read/${parsedWork.slug}`);
        }, 300);
      } else {
        setErrorMsg(`Could not find "${title}" in Gutenberg archive. Try searching directly.`);
      }
    } catch (e: any) {
      setErrorMsg(`Failed to fetch work: ${e?.message || 'Network error'}`);
    } finally {
      setIngestingTitle(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-semibold">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Semantic Curation Engine</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
          Literary Atmosphere &amp; Theme Finder
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Describe any specific setting, philosophical theme, or literary temperament to match against unabridged classic folios.
        </p>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
          <input
            type="text"
            value={vibeQuery}
            onChange={(e) => setVibeQuery(e.target.value)}
            placeholder="e.g. A solitary winter voyage exploring moral dilemmas and natural forces..."
            className="w-full pl-11 pr-4 py-3.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all font-sans"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !vibeQuery.trim()}
          className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 dark:text-amber-600" />
          ) : (
            <Compass className="w-4 h-4" />
          )}
          <span>{loading ? 'Curating Folios...' : 'Discover Works'}</span>
        </button>
      </form>

      {/* Preset Curated Atmospheres */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
          Curated Reading Atmospheres:
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_ATMOSPHERES.map((pv, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSearch(pv.query)}
              className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 text-stone-700 dark:text-slate-200 text-xs font-sans font-medium border border-stone-200/80 dark:border-slate-700/60 transition-colors cursor-pointer"
            >
              {pv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 font-sans">
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-stone-200 dark:border-slate-800 animate-fadeIn">
          {/* Curator Note */}
          <div className="p-4 sm:p-5 rounded-xl bg-stone-100 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400 font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Curator Synopsis</span>
            </div>
            <p className="font-serif italic text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
              "{result.curatorGreeting}"
            </p>
            {result.vibeTags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.vibeTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Matches */}
          {result.catalogMatches?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-500 dark:text-slate-400 font-semibold">
                Catalog Matches
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {result.catalogMatches.map((m, idx) => {
                  const targetWork = works.find(w => w.id === m.id || w.title.toLowerCase() === m.title.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-amber-400/80 dark:hover:border-amber-600/80 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif font-bold text-base text-stone-900 dark:text-white">
                            {m.title}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-stone-200/80 dark:bg-slate-800 text-amber-700 dark:text-amber-400 rounded">
                            {m.vibeScore}% Match
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 dark:text-slate-400">
                          by {m.author}
                        </div>
                        <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed italic">
                          "{m.whyItFits}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-200/60 dark:border-slate-800/60 flex items-center justify-end">
                        {targetWork ? (
                          <button
                            onClick={() => navigate(`/work/${targetWork.slug}`)}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg hover:opacity-90 inline-flex items-center gap-1.5 transition-opacity cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read Now</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleIngestArchiveWork(m.title, m.author)}
                            disabled={!!ingestingTitle}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {ingestingTitle === m.title ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                            <span>Open via Archive</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Archive Suggestions */}
          {result.archiveSuggestions?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-500 dark:text-slate-400 font-semibold">
                From the 70,000+ World Public Archive
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {result.archiveSuggestions.map((as, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-stone-50/60 dark:bg-[#0B101D] border border-dashed border-stone-300 dark:border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif font-bold text-base text-stone-900 dark:text-white">
                          {as.title}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                          {as.vibeScore}% Match
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 dark:text-slate-400">
                        by {as.author}
                      </div>
                      <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed italic">
                        "{as.whyItFits}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 dark:border-slate-800/60 flex items-center justify-end">
                      <button
                        onClick={() => handleIngestArchiveWork(as.title, as.author)}
                        disabled={!!ingestingTitle}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {ingestingTitle === as.title ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Compass className="w-3.5 h-3.5" />
                        )}
                        <span>{ingestingTitle === as.title ? 'Loading...' : 'Ingest & Read'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VibeSearchSection;
