import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Work } from '../../types';
import { generateGhostCoverSvg } from '../../services/coverService';

export const ContinueReadingShelf: React.FC = () => {
  const { works, progress } = useLibrary();
  const { navigate } = useRouter();

  // Gather user reading progress entries
  const userProgressWorkIds = Object.keys(progress);
  let activeTrackedItems: { work: Work; percent: number; lastReadAt?: string }[] = [];

  if (userProgressWorkIds.length > 0) {
    userProgressWorkIds.forEach((workId) => {
      const found = works.find((w) => w.id === workId);
      if (!found) return;
      const userProg = progress[workId];
      if (userProg && userProg.percent !== undefined) {
        const percent = Math.round(userProg.percent);
        // Exclude completed books (100% or greater)
        if (percent < 100 && percent > 0) {
          activeTrackedItems.push({
            work: found,
            percent,
            lastReadAt: userProg.lastReadAt,
          });
        }
      }
    });

    // Sort by lastReadAt descending
    activeTrackedItems.sort((a, b) => {
      const timeA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
      const timeB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  const items = activeTrackedItems.slice(0, 4);

  const handleContinue = (work: Work) => {
    const userProg = progress[work.id];
    const chapterId = userProg?.chapterId || work.chapters?.[0]?.id || '1';
    navigate(`/read/${work.id}/${chapterId}`);
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
          Continue Reading
        </h2>
        <button
          onClick={() => navigate('/history')}
          className="text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
        >
          <span>View all</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {items.map(({ work, percent }) => {
          const authorNames = work.authors?.map((a) => a.name).join(', ') || 'Anonymous';
          const coverSrc =
            work.coverImageUrl ||
            work.coverImage ||
            generateGhostCoverSvg(work.title, authorNames, work.type);

          return (
            <div
              key={work.id}
              onClick={() => handleContinue(work)}
              className="group flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#151820] border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-xs transition-all cursor-pointer min-h-[92px]"
            >
              {/* Thumbnail */}
              <div className="w-14 sm:w-14 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 shadow-2xs">
                <img
                  src={coverSrc}
                  alt={work.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Info & Progress */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-[#C25E3A] dark:group-hover:text-[#D9774F] transition-colors truncate">
                    {work.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans truncate">
                    {authorNames}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-stone-400 dark:text-stone-500">
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C25E3A] dark:bg-[#D9774F]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Continue button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue(work);
                }}
                className="px-3.5 py-2 text-xs sm:text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-[#C25E3A] hover:text-white dark:hover:bg-[#C25E3A] dark:hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer min-h-[36px]"
              >
                Continue
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
