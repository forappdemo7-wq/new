import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useRouter } from '../context/RouterContext';
import { History as HistoryIcon, BookOpen, Trash2, ArrowLeft, Clock, Play } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { works, progress, clearReadingProgress } = useLibrary();
  const { navigate } = useRouter();

  // Get works that have reading progress entries
  const progressEntries = Object.values(progress).sort((a, b) => {
    return new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime();
  });

  const historyItems = progressEntries
    .map((p) => {
      const work = works.find((w) => w.id === p.workId);
      return { progress: p, work };
    })
    .filter((item): item is { progress: typeof item.progress; work: NonNullable<typeof item.work> } => Boolean(item.work));

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12141A] text-stone-900 dark:text-stone-100 py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
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
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <HistoryIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
                  Reading History
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Pick up right where you left off across all your books, mangas, and comics.
                </p>
              </div>
            </div>
          </div>
          {historyItems.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your reading history?')) {
                  clearReadingProgress();
                }
              }}
              className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-red-500 hover:text-white text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Content */}
        {historyItems.length === 0 ? (
          <div className="text-center py-24 px-4 bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">No Reading History Yet</h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Start reading any book, manga, or comic in the library to automatically track your reading progress and history.
              </p>
            </div>
            <button
              onClick={() => navigate('/library')}
              className="px-5 py-2.5 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Library</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {historyItems.map(({ progress: p, work }) => {
              const prefix =
                work.type === 'book' ? 'book' : work.type === 'comic' ? 'comic' : work.type === 'manga' ? 'manga' : 'work';
              const formattedDate = new Date(p.lastReadAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={work.id}
                  onClick={() => navigate(`/read/${work.id}/${p.chapterId || '1'}`)}
                  className="group bg-white dark:bg-[#151820] p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#C25E3A] dark:hover:border-[#C25E3A] transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-900 shrink-0 border border-stone-200 dark:border-stone-800">
                      <img
                        src={work.coverImage || work.coverImageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#C25E3A]/10 text-[#C25E3A] text-[10px] font-bold uppercase tracking-wider">
                          {work.type}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formattedDate}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-white text-base truncate group-hover:text-[#C25E3A] transition-colors">
                        {work.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        {p.chapterTitle || `Chapter ${p.chapterNumber || 1}`}
                      </p>
                      {/* Progress Bar */}
                      <div className="w-48 sm:w-64 bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#C25E3A] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(5, p.percent || 10)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                      {p.percent || 15}% completed
                    </span>
                    <button className="px-4 py-2 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
