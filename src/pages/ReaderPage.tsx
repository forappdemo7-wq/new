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
      <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col items-center justify-center p-6 text-center transition-colors">
        <h2 className="font-serif text-2xl font-semibold mb-2">Work Not Found</h2>
        <p className="text-xs text-stone-500 mb-4">The book or comic you are attempting to read does not exist.</p>
        <button
          onClick={() => navigate('/library')}
          className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors"
        >
          Return to Library
        </button>
      </div>
    );
  }

  // Find chapter by id or number or slug safely
  const chaptersList = Array.isArray(work.chapters) ? work.chapters : [];
  const chapter = chaptersList.find((c: Chapter) => c.id === chapterId || c.slug === chapterId || String(c.number) === chapterId) || chaptersList[0];

  if (!chapter) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col items-center justify-center p-6 text-center transition-colors">
        <h2 className="font-serif text-2xl font-semibold mb-2">Chapter Not Found</h2>
        <p className="text-xs text-stone-500 mb-4">No content found for this chapter identifier.</p>
        <button
          onClick={() => navigate(`/work/${work.slug}`)}
          className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors"
        >
          Work Overview
        </button>
      </div>
    );
  }

  if (work.type === 'comic' || work.type === 'manga') {
    return <ComicReader work={work} currentChapter={chapter} />;
  }

  return <BookReader work={work} currentChapter={chapter} />;
};
