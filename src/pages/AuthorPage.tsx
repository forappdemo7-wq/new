import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { WorkCard } from '../components/catalog/WorkCard';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { AUTHORS } from '../data/authors';
import { Author, Work } from '../types';

interface AuthorPageProps {
  slug: string;
}

export const AuthorPage: React.FC<AuthorPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { getWorksByAuthor } = useLibrary();

  const author: Author | undefined = AUTHORS[slug] || (Object.values(AUTHORS) as Author[]).find(a => a.slug === slug);
  const works = getWorksByAuthor(slug);

  if (!author) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-stone-900">Creator Not Found</h1>
        <p className="text-sm text-stone-600">The author or artist requested could not be located in our registry.</p>
        <button
          onClick={() => navigate('/library')}
          className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-stone-900 dark:text-stone-100 transition-colors duration-150">
      {/* Back button */}
      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      {/* Author Profile Header */}
      <div className="bg-white dark:bg-[#151820] rounded-xl border border-stone-200 dark:border-stone-800 p-8 sm:p-10 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C25E3A] dark:text-[#D9774F]">
              <span>{author.role}</span>
              {author.birthDeath && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{author.birthDeath}</span>
                </>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 dark:text-white">
              {author.name}
            </h1>
          </div>

          {author.verifiedOpenLicense && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Open Creator</span>
            </div>
          )}
        </div>

        <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed max-w-3xl">
          {author.bio}
        </p>

        {author.website && (
          <div className="pt-2">
            <a
              href={author.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C25E3A] dark:text-[#D9774F] hover:underline"
            >
              <span>Official Reference &amp; Archives</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Works by this author */}
      <section className="space-y-6">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
          <h2 className="font-serif text-2xl font-semibold text-stone-900 dark:text-white">
            Cataloged Works ({works.length})
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            All titles by {author.name} legally available to read free on wanna read?.
          </p>
        </div>

        {works.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {works.map((w: Work) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500 dark:text-stone-400 py-10 text-center">
            No active publications cataloged under this creator.
          </p>
        )}
      </section>
    </div>
  );
};
