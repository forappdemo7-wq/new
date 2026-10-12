import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { searchUsers, SearchableUser } from '../../services/userSearchService';
import { UserSearchCard } from './UserSearchComponents';
import { Work } from '../../types';
import {
  Search,
  X,
  Users,
  BookOpen,
  ArrowRight,
  Layers,
  Palette,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { navigate } = useRouter();
  const { works } = useLibrary();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'works'>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveTab('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const cleanQuery = query.trim().toLowerCase();

  // Matched users
  const matchedUsers = useMemo(() => {
    if (!cleanQuery) return [];
    return searchUsers(cleanQuery, works);
  }, [cleanQuery, works]);

  // Matched works
  const matchedWorks = useMemo(() => {
    if (!cleanQuery) return [];
    const q = cleanQuery;
    return works.filter((w) => {
      const titleMatch = w.title.toLowerCase().includes(q);
      const authorMatch = w.authors?.some((a) => a.name.toLowerCase().includes(q));
      const genreMatch = w.genres?.some((g) => g.toLowerCase().includes(q));
      const tagMatch = w.tags?.some((t) => t.toLowerCase().includes(q));
      const publisherMatch =
        Boolean(w.publisherName && w.publisherName.toLowerCase().includes(q)) ||
        Boolean(w.publisherEmail && w.publisherEmail.toLowerCase().includes(q)) ||
        Boolean(w.uploaderId && w.uploaderId.toLowerCase().includes(q));
      return titleMatch || authorMatch || genreMatch || tagMatch || publisherMatch;
    }).slice(0, 8);
  }, [cleanQuery, works]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cleanQuery) return;
    onClose();
    navigate(`/library?q=${encodeURIComponent(cleanQuery)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-stone-200 dark:border-stone-800 p-4 sm:p-5 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Search books, manga, comics, or any username…"
            className="flex-1 bg-transparent text-sm sm:text-base text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              title="Clear text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            title="Close"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters (When query is active) */}
        {cleanQuery && (matchedUsers.length > 0 || matchedWorks.length > 0) && (
          <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/40 flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
              }`}
            >
              All Results ({matchedUsers.length + matchedWorks.length})
            </button>

            {matchedUsers.length > 0 && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'users'
                    ? 'bg-[#C25E3A] text-white'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Users &amp; Creators ({matchedUsers.length})</span>
              </button>
            )}

            {matchedWorks.length > 0 && (
              <button
                onClick={() => setActiveTab('works')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'works'
                    ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Works ({matchedWorks.length})</span>
              </button>
            )}
          </div>
        )}

        {/* Results Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {!cleanQuery ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C25E3A]/10 text-[#C25E3A] flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                Search Open Archive &amp; Community
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Type any book title, author name, or username to find creators, readers, manga, and classic literature.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                <span className="text-[11px] text-stone-400">Popular suggestions:</span>
                {['Elena Rostova', 'Kenji Sato', 'Frankenstein', 'Manga', 'Alice'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : matchedUsers.length === 0 && matchedWorks.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No users or folios found matching "{query}"
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try searching by a different username, title fragment, or exploring the library.
              </p>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-[#C25E3A] hover:bg-[#a84e2e] rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Search full library for "{query}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── Users & Creators ── */}
              {(activeTab === 'all' || activeTab === 'users') && matchedUsers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    <span className="flex items-center gap-1.5 font-bold text-[#C25E3A] dark:text-amber-400">
                      <Users className="w-3.5 h-3.5" />
                      Matching Users &amp; Creators ({matchedUsers.length})
                    </span>
                    <span className="text-[10px]">Click to view profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {matchedUsers.slice(0, 6).map((user) => (
                      <UserSearchCard
                        key={user.uid}
                        user={user}
                        compact
                        onSelect={() => onClose()}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Folios & Works ── */}
              {(activeTab === 'all' || activeTab === 'works') && matchedWorks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    <span className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300">
                      <BookOpen className="w-3.5 h-3.5" />
                      Matching Folios &amp; Publications ({matchedWorks.length})
                    </span>
                    <button
                      onClick={handleSubmit}
                      className="text-[11px] text-[#C25E3A] hover:underline flex items-center gap-1"
                    >
                      <span>View all in Library</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {matchedWorks.map((work) => (
                      <div
                        key={work.id}
                        onClick={() => {
                          onClose();
                          navigate(`/work/${work.slug || work.id}`);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/60 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/70 dark:border-stone-800 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {work.coverImage || work.coverImageUrl ? (
                            <img
                              src={work.coverImage || work.coverImageUrl}
                              alt={work.title}
                              className="w-10 h-14 object-cover rounded-md border border-stone-200 dark:border-stone-700 shrink-0 bg-stone-100"
                            />
                          ) : (
                            <div className="w-10 h-14 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-stone-400" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-[#C25E3A] transition-colors">
                              {work.title}
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                              {work.authors?.map((a) => a.name).join(', ') || work.publisherName || 'Community Creator'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-stone-400">
                              <span className="capitalize">{work.type}</span>
                              {work.publisherName && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 dark:text-amber-400">By {work.publisherName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#C25E3A] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-stone-200/60 dark:bg-stone-800 px-2 py-0.5 rounded">
              <CornerDownLeft className="w-3 h-3" />
              Press Enter
            </span>
            <span>to open full search</span>
          </div>

          <button
            onClick={handleSubmit}
            className="text-xs font-semibold text-[#C25E3A] hover:text-[#a84e2e] flex items-center gap-1 cursor-pointer"
          >
            <span>Explore all results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
