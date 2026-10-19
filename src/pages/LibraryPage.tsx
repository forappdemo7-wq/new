import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useRouter } from '../context/RouterContext';
import { MediaCard } from '../components/catalog/MediaCard';
import {
  Search,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Work } from '../types';
import { queryVibeSearch, VibeMatchResult } from '../services/geminiClient';
import { sortWorksByLikes, useLikesSync } from '../services/interactionService';
import { searchUsers } from '../services/userSearchService';
import { UserSearchResultsSection, UserSearchDropdown } from '../components/common/UserSearchComponents';

export const LibraryPage: React.FC = () => {
  const { works, favorites, bookmarks } = useLibrary();
  const { searchParams, setSearchParam, navigate } = useRouter();
  const likesVersion = useLikesSync();

  // URL state
  const queryParam = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || 'all';
  const genreParam = searchParams.get('genre') || 'all';
  const licenseParam = searchParams.get('license') || 'all';
  const directionParam = searchParams.get('direction') || 'all';
  const languageParam = searchParams.get('lang') || 'all';
  const eraParam = searchParams.get('era') || 'all';
  const sortParam = searchParams.get('sort') || 'recommended';
  const filterParam = searchParams.get('filter') || 'all';

  const [searchInput, setSearchInput] = useState(queryParam);
  const [currentPage, setCurrentPage] = useState(1);
  const [isVibeSearching, setIsVibeSearching] = useState(false);
  const [vibeResult, setVibeResult] = useState<VibeMatchResult | null>(null);
  const [vibeError, setVibeError] = useState<string | null>(null);
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

  const activeSearchQuery = searchInput.trim() || queryParam.trim();
  const matchedUsers = useMemo(() => {
    if (!activeSearchQuery) return [];
    return searchUsers(activeSearchQuery, works);
  }, [activeSearchQuery, works]);

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchParam('q', searchInput.trim() || null);
    setCurrentPage(1);
  };

  const handleVibeSearch = async () => {
    if (!searchInput.trim()) return;
    setIsVibeSearching(true);
    setVibeError(null);
    try {
      const catalogContext = works.map((w) => ({
        id: w.id,
        title: w.title,
        author: w.authors?.map((a) => a.name).join(', ') || '',
        genres: w.genres || [],
        synopsis: w.synopsis || w.description || '',
      }));
      const res = await queryVibeSearch(searchInput.trim(), catalogContext);
      setVibeResult(res);
      setSearchParam('q', searchInput.trim());
    } catch (err: any) {
      setVibeError(err.message || 'Semantic vibe search failed');
    } finally {
      setIsVibeSearching(false);
    }
  };

  const clearVibeSearch = () => {
    setVibeResult(null);
    setVibeError(null);
  };

  // Filtered works calculation
  const filteredWorks = useMemo(() => {
    let result = [...works];

    // If vibe results are present, prioritize and filter based on vibe matches
    if (vibeResult && vibeResult.catalogMatches?.length > 0) {
      const matchMap = new Map(vibeResult.catalogMatches.map((m) => [m.id, m]));
      const matched = result.filter((w) => matchMap.has(w.id));
      matched.sort((a, b) => {
        const scoreA = matchMap.get(a.id)?.vibeScore || 0;
        const scoreB = matchMap.get(b.id)?.vibeScore || 0;
        return scoreB - scoreA;
      });
      result = matched;
    } else if (queryParam.trim()) {
      const q = queryParam.toLowerCase().trim();
      result = result.filter((w: Work) => {
        const titleMatch = Boolean(w.title && w.title.toLowerCase().includes(q));
        const nativeMatch = Boolean(w.nativeTitle && w.nativeTitle.toLowerCase().includes(q));
        const authorMatch = w.authors?.some((a) => a?.name && a.name.toLowerCase().includes(q)) || false;
        const genreMatch = w.genres?.some((g) => g && g.toLowerCase().includes(q)) || false;
        const tagMatch = w.tags?.some((t) => t && t.toLowerCase().includes(q)) || false;
        const descMatch = Boolean(w.description && w.description.toLowerCase().includes(q));
        const synopsisMatch = Boolean(w.synopsis && w.synopsis.toLowerCase().includes(q));
        const publisherMatch =
          Boolean(w.publisherName && w.publisherName.toLowerCase().includes(q)) ||
          Boolean(w.publisherEmail && w.publisherEmail.toLowerCase().includes(q)) ||
          Boolean(w.uploaderId && w.uploaderId.toLowerCase().includes(q));
        return (
          titleMatch ||
          nativeMatch ||
          authorMatch ||
          genreMatch ||
          tagMatch ||
          descMatch ||
          synopsisMatch ||
          publisherMatch
        );
      });
    }

    if (filterParam === 'saved') {
      result = result.filter(
        (w: Work) => favorites.includes(w.id) || bookmarks.some((b) => b.workId === w.id)
      );
    }

    if (typeParam !== 'all') {
      if (typeParam === 'community' || typeParam === 'uploads') {
        result = result.filter(
          (w: Work) =>
            w.jurisdictionStatus === 'COMMUNITY_OPEN' ||
            w.sourceName === 'Community Self-Published' ||
            w.sourceName?.toLowerCase().includes('community') ||
            w.sourceName?.toLowerCase().includes('user') ||
            w.sourceName?.toLowerCase().includes('upload') ||
            Boolean(w.publisherId) ||
            Boolean(w.publisherName) ||
            w.licenseCode === 'COMMUNITY_OPEN' ||
            w.licenseCode === 'CC0-1.0' ||
            w.licenseCode === 'CC-BY-4.0'
        );
      } else {
        result = result.filter((w: Work) => w.type === typeParam);
      }
    }

    if (genreParam !== 'all') {
      result = result.filter((w: Work) =>
        (w.genres || []).some((g: string) => {
          if (!g) return false;
          const cleanParam = genreParam.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanGenre = g.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanGenre.includes(cleanParam) || cleanParam.includes(cleanGenre);
        })
      );
    }

    if (licenseParam !== 'all') {
      if (licenseParam === 'public_domain') {
        result = result.filter((w) => w.jurisdictionStatus === 'WORLDWIDE_PD' || w.licenseCode?.includes('PD'));
      } else if (licenseParam === 'open_license') {
        result = result.filter((w) => w.licenseCode?.includes('CC') || w.licenseCode?.includes('Free'));
      }
    }

    if (directionParam !== 'all') {
      result = result.filter((w: Work) => w.readingDirection === directionParam);
    }

    if (languageParam !== 'all') {
      result = result.filter((w: Work) => (w.language || 'en').toLowerCase().startsWith(languageParam.toLowerCase()));
    }

    if (eraParam !== 'all') {
      if (eraParam === 'pre-1900') {
        result = result.filter((w) => (w.originalPublicationYear || 2000) < 1900);
      } else if (eraParam === '1900-1950') {
        result = result.filter((w) => {
          const y = w.originalPublicationYear || 0;
          return y >= 1900 && y <= 1950;
        });
      } else if (eraParam === 'contemporary') {
        result = result.filter((w) => (w.originalPublicationYear || 0) > 1950);
      }
    }

    // Sort order
    if (sortParam === 'most_liked') {
      result = sortWorksByLikes(result);
    } else if (sortParam === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortParam === 'alphabetical') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortParam === 'oldest') {
      result.sort((a, b) => (a.originalPublicationYear || 2000) - (b.originalPublicationYear || 2000));
    } else if (sortParam === 'most_read') {
      result.sort((a, b) => (b.chapters?.length || 0) - (a.chapters?.length || 0));
    }

    return result;
  }, [works, vibeResult, queryParam, filterParam, favorites, bookmarks, typeParam, genreParam, licenseParam, directionParam, languageParam, eraParam, sortParam, likesVersion]);

  const ITEMS_PER_PAGE = 18;
  const totalPages = Math.ceil(filteredWorks.length / ITEMS_PER_PAGE);
  const paginatedWorks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWorks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWorks, currentPage]);

  const resetAllFilters = () => {
    setSearchParam('q', null);
    setSearchParam('type', null);
    setSearchParam('genre', null);
    setSearchParam('license', null);
    setSearchParam('direction', null);
    setSearchParam('lang', null);
    setSearchParam('era', null);
    setSearchParam('sort', null);
    setSearchParam('filter', null);
    setSearchInput('');
    setVibeResult(null);
    setCurrentPage(1);
  };

  const activeFilterCount = [
    typeParam !== 'all',
    genreParam !== 'all',
    licenseParam !== 'all',
    directionParam !== 'all',
    languageParam !== 'all',
    eraParam !== 'all',
    filterParam !== 'all',
    queryParam !== '',
  ].filter(Boolean).length;

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#12141A] min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            Library
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 font-sans">
            Public-domain and openly licensed works, curated for distraction-free reading.
          </p>
        </div>

        {/* ── Prominent Search Bar with Integrated Vibe Search ─────────── */}
        <div ref={searchContainerRef} className="space-y-2 relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="absolute left-4 text-stone-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search books, authors, themes, or describe what you want to read…"
              className="w-full pl-12 pr-36 sm:pr-40 py-3.5 text-sm sm:text-base bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#C25E3A]/40 focus:border-[#C25E3A] transition-all shadow-2xs"
            />

            {/* Clear Input Button */}
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchParam('q', null);
                  clearVibeSearch();
                }}
                className="absolute right-32 sm:right-36 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Vibe Search Pill Action */}
            <button
              type="button"
              onClick={handleVibeSearch}
              disabled={isVibeSearching || !searchInput.trim()}
              title="Perform semantic mood search"
              className="absolute right-2 px-3 sm:px-4 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isVibeSearching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Searching…</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-stone-300 dark:text-[#C25E3A]" />
                  <span>Vibe Search</span>
                </>
              )}
            </button>
          </form>

          {/* Autocomplete User Dropdown */}
          <UserSearchDropdown
            users={matchedUsers}
            isOpen={isSearchFocused && Boolean(activeSearchQuery) && matchedUsers.length > 0}
            onClose={() => setIsSearchFocused(false)}
            onSelectUser={(u) => navigate(`/user/${u.uid}`)}
          />

          {/* Vibe search helper hint */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
            <span>
              Try describing what you're in the mood for (e.g. <em className="text-stone-700 dark:text-stone-300">"dark gothic horror about ambition"</em>) or search any username.
            </span>
            {vibeResult && (
              <button
                onClick={clearVibeSearch}
                className="text-[#C25E3A] dark:text-[#D9774F] hover:underline cursor-pointer"
              >
                Clear Vibe Filter
              </button>
            )}
          </div>
        </div>

        {/* ── Matched Creators & Users Section in Library ─────────────────── */}
        {activeSearchQuery && matchedUsers.length > 0 && (
          <UserSearchResultsSection
            users={matchedUsers}
            query={activeSearchQuery}
            onClearQuery={() => {
              setSearchInput('');
              setSearchParam('q', null);
            }}
            title={`Creators & Readers matching "${activeSearchQuery}"`}
            subtitle="Explore user profiles, follow creators, or read their self-published and curated books."
          />
        )}

        {/* Vibe Search AI Results Curator Note */}
        {vibeResult && (
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-amber-800 dark:text-amber-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Archival Curator Recommendation</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed">
              {vibeResult.curatorGreeting}
            </p>
            {vibeResult.vibeTags && vibeResult.vibeTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {vibeResult.vibeTags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Filters & Sorting Toolbar ─────────────────────────────────── */}
        <div className="space-y-4 pt-1">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Filter Dropdowns Row */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Format Filter */}
              <select
                value={typeParam}
                onChange={(e) => {
                  setSearchParam('type', e.target.value === 'all' ? null : e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C25E3A] cursor-pointer"
              >
                <option value="all">Format: All</option>
                <option value="book">Books</option>
                <option value="comic">Comics</option>
                <option value="manga">Manga</option>
                <option value="uploads">User Uploads</option>
              </select>

              {/* Genre Filter */}
              <select
                value={genreParam}
                onChange={(e) => {
                  setSearchParam('genre', e.target.value === 'all' ? null : e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C25E3A] cursor-pointer"
              >
                <option value="all">Genre: All</option>
                <option value="classics">Classics</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="fantasy">Fantasy</option>
                <option value="horror">Horror</option>
                <option value="mystery">Mystery</option>
                <option value="romance">Romance</option>
                <option value="non-fiction">Non-Fiction</option>
              </select>

              {/* License Filter */}
              <select
                value={licenseParam}
                onChange={(e) => {
                  setSearchParam('license', e.target.value === 'all' ? null : e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C25E3A] cursor-pointer"
              >
                <option value="all">License: All</option>
                <option value="public_domain">Public Domain</option>
                <option value="open_license">Open License</option>
              </select>

              {/* Language Filter */}
              <select
                value={languageParam}
                onChange={(e) => {
                  setSearchParam('lang', e.target.value === 'all' ? null : e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C25E3A] cursor-pointer"
              >
                <option value="all">Language: All</option>
                <option value="en">English</option>
                <option value="ja">Japanese</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>

              {/* Reading Direction */}
              <select
                value={directionParam}
                onChange={(e) => {
                  setSearchParam('direction', e.target.value === 'all' ? null : e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C25E3A] cursor-pointer"
              >
                <option value="all">Direction: All</option>
                <option value="ltr">Left-to-Right (LTR)</option>
                <option value="rtl">Right-to-Left (RTL)</option>
              </select>

              {/* Publication Era */}
              <select
                value={eraParam}
                onChange={(e) => {
                  setSearchParam('era', e.target.value === 'all' ? null : e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#C25E3A] cursor-pointer"
              >
                <option value="all">Publication Era: All</option>
                <option value="pre-1900">Pre-1900 (Classics)</option>
                <option value="1900-1950">1900–1950</option>
                <option value="contemporary">Contemporary Open</option>
              </select>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetAllFilters}
                  className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
                >
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Sort Controls (Matching Mockup Pills) */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 pb-1 lg:pb-0">
              {[
                { id: 'recommended', label: 'Recommended' },
                { id: 'most_liked', label: 'Most Liked' },
                { id: 'newest', label: 'Recently Added' },
                { id: 'most_read', label: 'Most Read' },
                { id: 'alphabetical', label: 'Alphabetical' },
                { id: 'oldest', label: 'Oldest First' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSearchParam('sort', s.id === 'recommended' ? null : s.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                    sortParam === s.id
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-2xs'
                      : 'bg-white dark:bg-[#151820] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-800/80'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── Catalog Bookshelf Grid ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Showing {filteredWorks.length} {filteredWorks.length === 1 ? 'work' : 'works'}</span>
          </div>

          {filteredWorks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151820] border border-stone-200/80 dark:border-stone-800 space-y-3">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                No works found matching your filters
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Try clearing your search query or loosening your genre and license filters.
              </p>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg mt-2 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {paginatedWorks.map((work) => (
                <MediaCard key={work.id} work={work} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-stone-200/80 dark:border-stone-800/80">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-xs font-mono text-stone-600 dark:text-stone-400">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default LibraryPage;
