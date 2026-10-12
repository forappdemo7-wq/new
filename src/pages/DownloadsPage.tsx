import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useRouter } from '../context/RouterContext';
import { Download as DownloadIcon, BookOpen, Compass, FileText, HardDrive, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';

export const DownloadsPage: React.FC = () => {
  const { works } = useLibrary();
  const { navigate } = useRouter();

  // For downloaded works, we can feature hosted community works and verified public domain works
  const downloadedWorks = works.filter((w) => w.isHosted || w.fileFormat === 'epub' || w.fileFormat === 'pdf' || w.fileFormat === 'images');

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
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DownloadIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
                  Offline Downloads & Cache
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Cached EPUB, PDF, and comic archive files available for offline reading and export.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <HardDrive className="w-4 h-4" />
              <span>Storage Status: Ready for Offline Use</span>
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloadedWorks.map((work) => {
            const prefix =
              work.type === 'book' ? 'book' : work.type === 'comic' ? 'comic' : work.type === 'manga' ? 'manga' : 'work';
            const formatLabel = (work.fileFormat || 'epub').toUpperCase();

            return (
              <div
                key={work.id}
                className="group bg-white dark:bg-[#151820] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-16 aspect-[2/3] rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-900 shrink-0 border border-stone-200 dark:border-stone-800">
                      <img
                        src={work.coverImage || work.coverImageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          {formatLabel} Ready
                        </span>
                        <span className="text-[10px] text-stone-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Cached
                        </span>
                      </div>
                      <h3
                        onClick={() => navigate(`/${prefix}/${work.slug}`)}
                        className="font-bold text-stone-900 dark:text-white text-base truncate cursor-pointer hover:text-emerald-600 transition-colors"
                      >
                        {work.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        By {work.publisherName || work.authors?.[0]?.name || 'Community Author'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {work.description || work.synopsis}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-stone-400">
                    File size: ~{work.chapters?.length ? work.chapters.length * 320 : 450} KB
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/${prefix}/${work.slug}`)}
                      className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => navigate(`/read/${work.id}/1`)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Offline</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
