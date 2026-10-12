import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LayoutGrid, List, Search, X, ShieldAlert, Globe } from 'lucide-react';
import { Author, Demographic, JurisdictionStatus } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { searchUsers } from '../../services/userSearchService';
import { UserSearchDropdown } from '../common/UserSearchComponents';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  selectedGenre: string;
  onGenreChange: (g: string) => void;
  selectedLicense: string;
  onLicenseChange: (l: string) => void;
  selectedAuthor: string;
  onAuthorChange: (a: string) => void;
  selectedJurisdiction: string;
  onJurisdictionChange: (j: string) => void;
  selectedDemographic: string;
  onDemographicChange: (d: string) => void;
  selectedSort: string;
  onSortChange: (s: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (v: 'grid' | 'list') => void;
  genres: string[];
  authors: Author[];
  demographics: Demographic[];
  totalCount: number;
  onReset: () => void;
}

export const LibraryFilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedGenre,
  onGenreChange,
  selectedLicense,
  onLicenseChange,
  selectedAuthor,
  onAuthorChange,
  selectedJurisdiction,
  onJurisdictionChange,
  selectedDemographic,
  onDemographicChange,
  selectedSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  genres,
  authors,
  demographics,
  totalCount,
  onReset
}) => {
  const { works } = useLibrary();
  const { navigate } = useRouter();
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

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedType !== 'all' ||
    selectedGenre !== 'all' ||
    selectedLicense !== 'all' ||
    selectedAuthor !== 'all' ||
    selectedJurisdiction !== 'worldwide' ||
    selectedDemographic !== 'all';

  return (
    <div className="space-y-4 bg-[#FAF8F5] dark:bg-[#151820] p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs transition-colors duration-150">
      {/* Top Row: Search + View Mode + Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
          <Search className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Filter by title, author, username, or keyword..."
            className="w-full pl-11 pr-9 py-2.5 sm:py-3 bg-white dark:bg-[#1A1D26] text-sm sm:text-base rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#C25E3A] transition-colors font-sans shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <UserSearchDropdown
            users={matchedUsers}
            isOpen={isSearchFocused && Boolean(searchQuery.trim()) && matchedUsers.length > 0}
            onClose={() => setIsSearchFocused(false)}
            onSelectUser={(u) => navigate(`/user/${u.uid}`)}
          />
        </div>

        {/* View Mode Toggle + Result Count */}
        <div className="flex items-center justify-between sm:justify-end gap-4 text-xs sm:text-sm">
          <span className="font-mono text-stone-500 dark:text-stone-400">
            {totalCount} {totalCount === 1 ? 'folio' : 'folios'} indexed
          </span>

          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-300/80 dark:border-stone-700">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-[#151820] text-stone-950 dark:text-white shadow-2xs font-semibold' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white dark:bg-[#151820] text-stone-950 dark:text-white shadow-2xs font-semibold' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Segmented Department Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800/90 rounded-xl border border-stone-200 dark:border-stone-700/80 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: 'book', label: 'Books' },
            { id: 'comic', label: 'Comics' },
            { id: 'manga', label: 'Manga' },
            { id: 'community', label: 'Community Creations' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onTypeChange(tab.id)}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-white dark:bg-[#151820] text-stone-950 dark:text-white shadow-xs font-semibold border border-stone-200/60 dark:border-stone-700'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Jurisdiction Safety Filter */}
          <select
            value={selectedJurisdiction}
            onChange={e => onJurisdictionChange(e.target.value)}
            className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#C25E3A] font-medium min-h-[38px] cursor-pointer"
            title="Jurisdiction Safety filter"
          >
            <option value="worldwide">Worldwide-Safe Only</option>
            <option value="all">All Jurisdictions</option>
            <option value="WORLDWIDE_PD">Worldwide Public Domain</option>
            <option value="CC">Creative Commons</option>
            <option value="PD_US_ONLY">US Public Domain (Pre-1929)</option>
            <option value="PD_JAPAN_ONLY">Japan Public Domain</option>
            <option value="LINK_OUT_ONLY">Official Link-Out Only</option>
          </select>

          {/* Demographic */}
          <select
            value={selectedDemographic}
            onChange={e => onDemographicChange(e.target.value)}
            className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#C25E3A] capitalize min-h-[38px] cursor-pointer"
          >
            <option value="all">All Demographics</option>
            {demographics.map(d => (
              <option key={d} value={d} className="capitalize">{d}</option>
            ))}
          </select>

          {/* Genre */}
          <select
            value={selectedGenre}
            onChange={e => onGenreChange(e.target.value)}
            className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#C25E3A] min-h-[38px] cursor-pointer"
          >
            <option value="all">All Genres</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* License */}
          <select
            value={selectedLicense}
            onChange={e => onLicenseChange(e.target.value)}
            className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#C25E3A] min-h-[38px] cursor-pointer"
          >
            <option value="all">All Licenses</option>
            <option value="WORLDWIDE_PD">Worldwide Public Domain</option>
            <option value="CC0-1.0">CC0 (Public Domain)</option>
            <option value="CC-BY-4.0">CC BY 4.0</option>
            <option value="CC-BY-SA-4.0">CC BY-SA 4.0</option>
            <option value="CC-BY-NC-4.0">CC BY-NC 4.0</option>
            <option value="CC-BY-NC-SA-3.0">CC BY-NC-SA 3.0</option>
            <option value="LINK_OUT_ONLY">Link-Out Only</option>
          </select>

          {/* Sort */}
          <select
            value={selectedSort}
            onChange={e => onSortChange(e.target.value)}
            className="text-xs sm:text-sm py-2 sm:py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#C25E3A] min-h-[38px] cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Recently Added</option>
            <option value="title_asc">Title (A – Z)</option>
            <option value="year_desc">Year (Newest to Oldest)</option>
            <option value="year_asc">Year (Oldest to Newest)</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs sm:text-sm px-3 py-2 text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-200/60 dark:bg-stone-800 rounded-xl transition-colors flex items-center gap-1 font-semibold min-h-[38px] cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Jurisdiction Disclaimer Banner */}
      <div className="pt-2 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 font-sans">
        <Globe className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
        <span>
          <strong>Archival Jurisdiction Notice:</strong> Copyright durations differ across international territories. Filter to "Worldwide-Safe" to verify eligibility under both US 95-year and international Life+70 frameworks.
        </span>
      </div>
    </div>
  );
};
