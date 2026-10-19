import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { Download, BookOpen, ArrowLeft } from 'lucide-react';

export const DownloadsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { works } = useLibrary();

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#0B0D13] text-stone-900 dark:text-stone-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Offline Downloads &amp; E-Reader Cache</h1>
          <p className="text-xs text-stone-500">Cached EPUB, PDF, and comic archive files available for offline reading.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {works.slice(0, 6).map((work) => (
            <div
              key={work.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 flex items-center gap-4 shadow-xs"
            >
              <img
                src={work.coverImageUrl || work.coverImage}
                alt={work.title}
                className="w-16 h-24 object-cover rounded-lg shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-serif font-bold text-sm truncate">{work.title}</h3>
                <p className="text-[11px] text-stone-500">{work.type.toUpperCase()}</p>
                <button
                  onClick={() => navigate(`/work/${work.slug}`)}
                  className="mt-2 px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Work</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
