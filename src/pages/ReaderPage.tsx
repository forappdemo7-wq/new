import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { BookReader } from '../components/reader/BookReader';
import { ComicReader } from '../components/reader/ComicReader';
import { Work, Chapter } from '../types';

interface ReaderPageProps {
  workId: string;
  chapterId: string;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ workId, chapterId }) => {
  const { navigate } = useRouter();
  const { works } = useLibrary();

  // Find by id or slug
  const work = works.find((w: Work) => w.id === workId || w.slug === workId);

  if (!work) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#12141A] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 text-center transition-colors">
        <h2 className="font-serif text-2xl font-semibold mb-2">Work Not Found</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">The book or comic you are attempting to read does not exist.</p>
        <button
          onClick={() => navigate('/library')}
          className="px-4 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          Return to Library
        </button>
      </div>
    );
  }

  // Find chapter safely by id, number, or slug
  const chapters = work.chapters || [];
  const chapter =
    chapters.find((c: Chapter) => c && (c.id === chapterId || c.slug === chapterId || String(c.number) === chapterId || String(c.chapterNumber) === chapterId)) ||
    chapters[0];

  if (!chapter) {
    const prefix = work.type === 'book' ? 'book' : work.type === 'comic' ? 'comic' : work.type === 'manga' ? 'manga' : 'work';
    return (
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#12141A] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 text-center transition-colors">
        <h2 className="font-serif text-2xl font-semibold mb-2">Chapter Not Available</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">No readable chapter content was found for this work yet.</p>
        <button
          onClick={() => navigate(`/${prefix}/${work.slug || work.id}`)}
          className="px-4 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          Return to Work Overview
        </button>
      </div>
    );
  }

  if (work.type === 'comic' || work.type === 'manga') {
    return <ComicReader work={work} currentChapter={chapter} />;
  }

  return <BookReader work={work} currentChapter={chapter} />;
};
