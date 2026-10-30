import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { MediaCard } from '../components/catalog/MediaCard';
import { PublishWorkModal } from '../components/modals/PublishWorkModal';
import { sortWorksByLikes, useLikesSync } from '../services/interactionService';
import { searchUsers } from '../services/userSearchService';
import { UserSearchResultsSection, UserSearchDropdown } from '../components/common/UserSearchComponents';
import {
  Upload,
  Book,
  Layers,
  Palette,
  FolderPlus,
  Plus,
  Search,
  Users,
  User,
  ArrowRight,
  X,
  Check,
} from 'lucide-react';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Work } from '../types';

export const UserUploadsPage: React.FC = () => {
  const { works, removeWork } = useLibrary();
  const { navigate } = useRouter();
  const { currentUser, userProfile, openAuthModal, isAdmin } = useAuth();
  const likesVersion = useLikesSync();

  const [viewMode, setViewMode] = useState<'community' | 'my-uploads'>('community');
  const [activeCategory, setActiveCategory] = useState<'all' | 'book' | 'manga' | 'comic' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [workToDelete, setWorkToDelete] = useState<Work | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Matched users across all creators and registered readers
  const matchedUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchUsers(searchQuery, works);
  }, [searchQuery, works]);

  const toggleSectionExpand = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const activeUserId = currentUser?.uid || userProfile?.uid;

  const canDeleteWork = (w: Work) => {
    if (isAdmin) return true;
    if (activeUserId && (w.uploaderId === activeUserId || w.publisherId === activeUserId)) return true;
    if (currentUser?.email && w.publisherEmail && currentUser.email.toLowerCase() === w.publisherEmail.toLowerCase()) return true;
    return false;
  };

  const handlePublishClick = () => {
    const activeReader = currentUser || userProfile;
    if (!activeReader || (activeReader as any).isAnonymous) {
      openAuthModal('signin');
    } else {
      setIsPublishModalOpen(true);
    }
  };


  // Filter ONLY user-uploaded / community-published items
  const userUploads = useMemo(() => {
    return works.filter((w: Work) => {
      const isCommunity =
        w.jurisdictionStatus === 'COMMUNITY_OPEN' ||
        w.sourceName === 'Community Self-Published' ||
        w.sourceName?.toLowerCase().includes('community') ||
        w.sourceName?.toLowerCase().includes('user') ||
        w.sourceName?.toLowerCase().includes('upload') ||
        w.sourceName?.toLowerCase().includes('self') ||
        Boolean(w.publisherId) ||
        Boolean(w.publisherEmail) ||
        Boolean(w.publisherName) ||
        w.licenseCode === 'COMMUNITY_OPEN' ||
        w.licenseCode === 'CC0-1.0' ||
        w.licenseCode === 'CC-BY-4.0';

      if (!isCommunity) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (w.title || '').toLowerCase().includes(q);
        const authorMatch = w.authors?.some((a: any) =>
          (typeof a === 'string' ? a : a?.name || '').toLowerCase().includes(q)
        );
        const genreMatch = w.genres?.some((g) => (g || '').toLowerCase().includes(q));
        const publisherMatch =
          Boolean(w.publisherName && w.publisherName.toLowerCase().includes(q)) ||
          Boolean(w.publisherEmail && w.publisherEmail.toLowerCase().includes(q)) ||
          Boolean(w.uploaderId && w.uploaderId.toLowerCase().includes(q));
        return titleMatch || authorMatch || genreMatch || publisherMatch;
      }

      return true;
    });
  }, [works, searchQuery]);

  // Works uploaded specifically by the current user
  const myUploads = useMemo(() => {
    if (!activeUserId) return [];
    return userUploads.filter(
      (w) =>
        w.uploaderId === activeUserId ||
        w.publisherId === activeUserId ||
        (currentUser?.email && w.publisherEmail === currentUser.email)
    );
  }, [userUploads, activeUserId, currentUser?.email]);

  // Display items based on current viewMode
  const displayedWorks = viewMode === 'my-uploads' ? myUploads : userUploads;

  // Sub-categorized arrays sorted by most liked first (most liked stays on first)
  const uploadedBooks = useMemo(
    () => sortWorksByLikes(displayedWorks.filter((w) => w.type === 'book')),
    [displayedWorks, likesVersion]
  );
  const uploadedManga = useMemo(
    () => sortWorksByLikes(displayedWorks.filter((w) => w.type === 'manga')),
    [displayedWorks, likesVersion]
  );
  const uploadedComics = useMemo(
    () => sortWorksByLikes(displayedWorks.filter((w) => w.type === 'comic')),
    [displayedWorks, likesVersion]
  );
  const uploadedOther = useMemo(
    () => sortWorksByLikes(displayedWorks.filter((w) => w.type !== 'book' && w.type !== 'manga' && w.type !== 'comic')),
    [displayedWorks, likesVersion]
  );

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#12141A] min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ── Page Banner / Header Section ──────────────────────────────── */}
        <div className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#C25E3A]/10 text-[#C25E3A] dark:bg-[#C25E3A]/20 dark:text-amber-400 border border-[#C25E3A]/20">
                <Users className="w-3.5 h-3.5" />
                <span>Community &amp; Creator Portal</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight">
                User Uploads &amp; Self-Published Works
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
                A dedicated archive for books, manga, and comics published directly by our reader community. When readers like or comment on your creations, you receive live notifications in your panel.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3 flex-wrap">
              {currentUser && (
                <button
                  onClick={() => navigate(`/user/${activeUserId}`)}
                  className="px-4 py-3 text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <User className="w-4 h-4 text-[#C25E3A]" />
                  <span>My Public Profile</span>
                </button>
              )}
              <button
                onClick={handlePublishClick}
                className="px-5 py-3 text-xs sm:text-sm font-bold text-white bg-[#C25E3A] hover:bg-[#a84e2e] rounded-2xl transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-102"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Publish Your Work</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Feedback Toast */}
        {deleteToast && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span className="font-medium">{deleteToast}</span>
            </div>
            <button
              onClick={() => setDeleteToast(null)}
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Main View Tabs: All Community vs My Uploads ──────────────── */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('community')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'community'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-xs'
                  : 'bg-white dark:bg-[#151820] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Community Uploads ({userUploads.length})</span>
            </button>

            <button
              onClick={() => setViewMode('my-uploads')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'my-uploads'
                  ? 'bg-[#C25E3A] text-white shadow-xs'
                  : 'bg-white dark:bg-[#151820] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Uploads &amp; Creator Hub ({myUploads.length})</span>
            </button>
          </div>

          {/* Quick Search Field */}
          <div ref={searchContainerRef} className="relative min-w-[240px] sm:min-w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search uploads or username..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-[#151820] border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C25E3A]/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <UserSearchDropdown
              users={matchedUsers}
              isOpen={isSearchFocused && Boolean(searchQuery.trim()) && matchedUsers.length > 0}
              onClose={() => setIsSearchFocused(false)}
              onSelectUser={(u) => navigate(`/user/${u.uid}`)}
            />
          </div>
        </div>

        {/* ── Sub-Category Filters ─────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold py-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-950 font-bold'
                : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            All Categories ({displayedWorks.length})
          </button>

          {uploadedBooks.length > 0 && (
            <button
              onClick={() => setActiveCategory('book')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'book'
                  ? 'bg-amber-700 text-white dark:bg-amber-500 dark:text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Book className="w-3.5 h-3.5" />
              <span>Books ({uploadedBooks.length})</span>
            </button>
          )}

          {uploadedManga.length > 0 && (
            <button
              onClick={() => setActiveCategory('manga')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'manga'
                  ? 'bg-rose-700 text-white dark:bg-rose-500 dark:text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Manga ({uploadedManga.length})</span>
            </button>
          )}

          {uploadedComics.length > 0 && (
            <button
              onClick={() => setActiveCategory('comic')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'comic'
                  ? 'bg-purple-700 text-white dark:bg-purple-500 dark:text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Comics ({uploadedComics.length})</span>
            </button>
          )}

          {uploadedOther.length > 0 && (
            <button
              onClick={() => setActiveCategory('other')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'other'
                  ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Other ({uploadedOther.length})</span>
            </button>
          )}
        </div>

        {/* ── Matched Creators & Users Section ───────────────────────────── */}
        {searchQuery.trim() && matchedUsers.length > 0 && (
          <UserSearchResultsSection
            users={matchedUsers}
            query={searchQuery}
            onClearQuery={() => setSearchQuery('')}
            title={`Creators & Readers matching "${searchQuery}"`}
            subtitle="Click on any reader or creator to view their public profile, explore their uploads, or follow their account."
          />
        )}

        {/* ── MY UPLOADS EMPTY STATE (When viewMode is 'my-uploads' and user has 0 uploads) ── */}
        {viewMode === 'my-uploads' && myUploads.length === 0 && (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 text-center space-y-4 shadow-sm my-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C25E3A]/10 text-[#C25E3A] flex items-center justify-center">
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              You haven't uploaded any works yet
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              Publish a novel, comic chapter, or manga volume. When other users read, like, or comment on your creations, you'll receive notifications in real time.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handlePublishClick}
                className="px-5 py-2.5 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-102 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Work</span>
              </button>
            </div>
          </div>
        )}

        {/* ── GLOBAL EMPTY STATE (When no uploads match search or category) ── */}
        {displayedWorks.length === 0 && viewMode !== 'my-uploads' && (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 text-center space-y-4 shadow-sm my-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C25E3A]/10 text-[#C25E3A] flex items-center justify-center">
              {matchedUsers.length > 0 ? <Users className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {matchedUsers.length > 0
                ? `Found ${matchedUsers.length} user profile${matchedUsers.length === 1 ? '' : 's'} matching "${searchQuery}"`
                : 'No matching community uploads found'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {matchedUsers.length > 0
                ? 'Check out the matching reader and creator profiles displayed above to view their bios, public activity, and connect.'
                : 'Try adjusting your search query, searching for another username, or publish a new creation to the community catalog.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={handlePublishClick}
                className="px-6 py-2.5 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-102 inline-flex items-center gap-2"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Publish Work</span>
              </button>
            </div>
          </div>
        )}

        {/* ── SECTION 1: BOOKS ─────────────────────────────────────────── */}
        {(activeCategory === 'all' || activeCategory === 'book') && uploadedBooks.length > 0 && (() => {
          const isExpanded = Boolean(expandedSections['book']);
          const showcased = isExpanded ? uploadedBooks : uploadedBooks.slice(0, 10);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Book className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                      {viewMode === 'my-uploads' ? 'My Uploaded Books' : 'User Uploaded Books'}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Novels, classic adaptations, and speculative fiction submitted by creators.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400 font-semibold">
                    {uploadedBooks.length} {uploadedBooks.length === 1 ? 'title' : 'titles'}
                  </span>
                  {uploadedBooks.length > 10 ? (
                    <button
                      onClick={() => toggleSectionExpand('book')}
                      className="text-xs sm:text-sm font-semibold text-[#C25E3A] hover:text-[#a84e2e] dark:text-[#D9774F] dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>{isExpanded ? 'Show top 10' : 'View all'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                    </button>
                  ) : activeCategory === 'all' ? (
                    <button
                      onClick={() => setActiveCategory('book')}
                      className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {showcased.map((work) => (
                  <MediaCard
                    key={work.id}
                    work={work}
                    onDelete={canDeleteWork(work) ? (w) => setWorkToDelete(w) : undefined}
                  />
                ))}
              </div>

              {uploadedBooks.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-stone-200/50 dark:border-stone-800/50 gap-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {isExpanded
                      ? `Showing all ${uploadedBooks.length} titles sorted by most liked`
                      : `Showcasing top 10 most liked titles • ${uploadedBooks.length - 10} more available`}
                  </p>
                  <button
                    onClick={() => toggleSectionExpand('book')}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151820] hover:bg-[#FAF8F5] dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-[#C25E3A] dark:text-[#D9774F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:border-[#C25E3A]/40"
                  >
                    <span>{isExpanded ? 'Show top 10' : `View all ${uploadedBooks.length} titles`}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── SECTION 2: MANGA ─────────────────────────────────────────── */}
        {(activeCategory === 'all' || activeCategory === 'manga') && uploadedManga.length > 0 && (() => {
          const isExpanded = Boolean(expandedSections['manga']);
          const showcased = isExpanded ? uploadedManga : uploadedManga.slice(0, 10);
          return (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                      {viewMode === 'my-uploads' ? 'My Uploaded Manga' : 'User Uploaded Manga'}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Original manga chapters and indie Japanese-style panel creations.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400 font-semibold">
                    {uploadedManga.length} {uploadedManga.length === 1 ? 'title' : 'titles'}
                  </span>
                  {uploadedManga.length > 10 ? (
                    <button
                      onClick={() => toggleSectionExpand('manga')}
                      className="text-xs sm:text-sm font-semibold text-[#C25E3A] hover:text-[#a84e2e] dark:text-[#D9774F] dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>{isExpanded ? 'Show top 10' : 'View all'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                    </button>
                  ) : activeCategory === 'all' ? (
                    <button
                      onClick={() => setActiveCategory('manga')}
                      className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {showcased.map((work) => (
                  <MediaCard
                    key={work.id}
                    work={work}
                    onDelete={canDeleteWork(work) ? (w) => setWorkToDelete(w) : undefined}
                  />
                ))}
              </div>

              {uploadedManga.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-stone-200/50 dark:border-stone-800/50 gap-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {isExpanded
                      ? `Showing all ${uploadedManga.length} titles sorted by most liked`
                      : `Showcasing top 10 most liked titles • ${uploadedManga.length - 10} more available`}
                  </p>
                  <button
                    onClick={() => toggleSectionExpand('manga')}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151820] hover:bg-[#FAF8F5] dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-[#C25E3A] dark:text-[#D9774F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:border-[#C25E3A]/40"
                  >
                    <span>{isExpanded ? 'Show top 10' : `View all ${uploadedManga.length} titles`}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── SECTION 3: COMICS ────────────────────────────────────────── */}
        {(activeCategory === 'all' || activeCategory === 'comic') && uploadedComics.length > 0 && (() => {
          const isExpanded = Boolean(expandedSections['comic']);
          const showcased = isExpanded ? uploadedComics : uploadedComics.slice(0, 10);
          return (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                      {viewMode === 'my-uploads' ? 'My Uploaded Comics' : 'User Uploaded Comics'}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Graphic novels, webcomics, and illustrated sequential art creations.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400 font-semibold">
                    {uploadedComics.length} {uploadedComics.length === 1 ? 'title' : 'titles'}
                  </span>
                  {uploadedComics.length > 10 ? (
                    <button
                      onClick={() => toggleSectionExpand('comic')}
                      className="text-xs sm:text-sm font-semibold text-[#C25E3A] hover:text-[#a84e2e] dark:text-[#D9774F] dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>{isExpanded ? 'Show top 10' : 'View all'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                    </button>
                  ) : activeCategory === 'all' ? (
                    <button
                      onClick={() => setActiveCategory('comic')}
                      className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {showcased.map((work) => (
                  <MediaCard
                    key={work.id}
                    work={work}
                    onDelete={canDeleteWork(work) ? (w) => setWorkToDelete(w) : undefined}
                  />
                ))}
              </div>

              {uploadedComics.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-stone-200/50 dark:border-stone-800/50 gap-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {isExpanded
                      ? `Showing all ${uploadedComics.length} titles sorted by most liked`
                      : `Showcasing top 10 most liked titles • ${uploadedComics.length - 10} more available`}
                  </p>
                  <button
                    onClick={() => toggleSectionExpand('comic')}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151820] hover:bg-[#FAF8F5] dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-[#C25E3A] dark:text-[#D9774F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:border-[#C25E3A]/40"
                  >
                    <span>{isExpanded ? 'Show top 10' : `View all ${uploadedComics.length} titles`}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── SECTION 4: OTHER ITEMS ───────────────────────────────────── */}
        {(activeCategory === 'all' || activeCategory === 'other') && uploadedOther.length > 0 && (() => {
          const isExpanded = Boolean(expandedSections['other']);
          const showcased = isExpanded ? uploadedOther : uploadedOther.slice(0, 10);
          return (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                      {viewMode === 'my-uploads' ? 'My Other Formats' : 'Other Items &amp; Formats'}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Open-license documents, mixed media, and creative texts.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400 font-semibold">
                    {uploadedOther.length} {uploadedOther.length === 1 ? 'item' : 'items'}
                  </span>
                  {uploadedOther.length > 10 ? (
                    <button
                      onClick={() => toggleSectionExpand('other')}
                      className="text-xs sm:text-sm font-semibold text-[#C25E3A] hover:text-[#a84e2e] dark:text-[#D9774F] dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>{isExpanded ? 'Show top 10' : 'View all'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                    </button>
                  ) : activeCategory === 'all' ? (
                    <button
                      onClick={() => setActiveCategory('other')}
                      className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4">
                {showcased.map((work) => (
                  <MediaCard
                    key={work.id}
                    work={work}
                    onDelete={canDeleteWork(work) ? (w) => setWorkToDelete(w) : undefined}
                  />
                ))}
              </div>

              {uploadedOther.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-stone-200/50 dark:border-stone-800/50 gap-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {isExpanded
                      ? `Showing all ${uploadedOther.length} items sorted by most liked`
                      : `Showcasing top 10 most liked items • ${uploadedOther.length - 10} more available`}
                  </p>
                  <button
                    onClick={() => toggleSectionExpand('other')}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151820] hover:bg-[#FAF8F5] dark:hover:bg-stone-800 text-xs sm:text-sm font-semibold text-[#C25E3A] dark:text-[#D9774F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:border-[#C25E3A]/40"
                  >
                    <span>{isExpanded ? 'Show top 10' : `View all ${uploadedOther.length} items`}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* Upload Creation Modal */}
      <PublishWorkModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />

      {/* Confirm Delete Work Modal */}
      <ConfirmModal
        isOpen={Boolean(workToDelete)}
        title={`Delete "${workToDelete?.title}"?`}
        message={`Are you sure you want to permanently delete "${workToDelete?.title}"?\n\nThis will remove it from your public profile and the library catalog. All chapters, reader comments, and bookmarks will be removed. This action cannot be undone.`}
        confirmLabel="Delete Work"
        cancelLabel="Keep Work"
        isDestructive={true}
        onConfirm={() => {
          if (workToDelete) {
            const title = workToDelete.title;
            removeWork(workToDelete.id);
            setWorkToDelete(null);
            setDeleteToast(`"${title}" was permanently deleted from your public profile and catalog.`);
            setTimeout(() => setDeleteToast(null), 4500);
          }
        }}
        onCancel={() => setWorkToDelete(null)}
      />
    </div>
  );
};
