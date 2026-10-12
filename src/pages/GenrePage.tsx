import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { WorkCard } from '../components/catalog/WorkCard';
import { ArrowLeft } from 'lucide-react';
import { Work } from '../types';

interface GenrePageProps {
  slug: string;
}

export const GenrePage: React.FC<GenrePageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { getWorksByGenre } = useLibrary();

  const decodedGenre = decodeURIComponent(slug);
  const works = getWorksByGenre(decodedGenre);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-stone-900 dark:text-stone-100 transition-colors duration-150">
      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      <div className="border-b border-stone-200 dark:border-stone-800 pb-6 space-y-2">
        <div className="text-xs uppercase tracking-wider font-semibold text-[#C25E3A] dark:text-[#D9774F]">
          Genre Collection
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold capitalize text-stone-900 dark:text-white">
          {decodedGenre}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          Showing {works.length} openly licensed works tagged in this category.
        </p>
      </div>

      {works.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {works.map((w: Work) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-stone-500 dark:text-stone-400">
          No works found under this genre category.
        </div>
      )}
    </div>
  );
};
