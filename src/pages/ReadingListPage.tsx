import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useRouter } from '../context/RouterContext';
import { MediaCard } from '../components/catalog/MediaCard';
import { Bookmark, BookOpen, Compass, Trash2, ArrowLeft } from 'lucide-react';

export const ReadingListPage: React.FC = () => {
  const { works, bookmarks, removeUserBookmark, favorites, toggleFavoriteWork } = useLibrary();
  const { navigate } = useRouter();

  // Find works that are bookmarked or favorited
  const bookmarkedWorkIds = new Set(bookmarks.map((b) => b.workId));
  const savedWorkIds = new Set([...bookmarkedWorkIds, ...favorites]);

  const savedWorks = works.filter((w) => savedWorkIds.has(w.id));

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12141A] text-stone-900 dark:text-stone-100 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/library')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-300 transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Library</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
                  Reading List & Bookmarks
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Your curated collection of saved stories, books, mangas, and articles.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300">
              {savedWorks.length} {savedWorks.length === 1 ? 'Title Saved' : 'Titles Saved'}
            </span>
            <button
              onClick={() => navigate('/library')}
              className="px-4 py-2 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Discover More</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {savedWorks.length === 0 ? (
          <div className="text-center py-24 px-4 bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">Your Reading List is Empty</h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Explore the library and click the bookmark or favorite icon on any book, manga, or comic to save it here for later.
              </p>
            </div>
            <button
              onClick={() => navigate('/library')}
              className="px-5 py-2.5 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Library Catalog</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {savedWorks.map((work) => (
              <MediaCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
