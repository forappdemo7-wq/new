import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { WorkCard } from '../components/catalog/WorkCard';
import { ArrowLeft } from 'lucide-react';
import { Demographic, Work } from '../types';

interface DemographicPageProps {
  slug: string;
}

export const DemographicPage: React.FC<DemographicPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { getWorksByDemographic } = useLibrary();

  const norm = slug.toLowerCase() as Demographic;
  const works = getWorksByDemographic(norm);

  const demographicMeta: Record<string, { label: string; desc: string }> = {
    shonen: {
      label: 'Shōnen (少年)',
      desc: 'Action, high adventure, sysadmin camaraderie, and technical growth narratives.'
    },
    shojo: {
      label: 'Shōjo (少女)',
      desc: 'Interpersonal bonds, whimsical botanical journeys, and expressive artistic design.'
    },
    seinen: {
      label: 'Seinen (青年)',
      desc: 'Mature philosophical fiction, historical social satire, hard sci-fi, and contemplative ink art.'
    },
    josei: {
      label: 'Josei (女性)',
      desc: 'Reflective folklore, historical picture scrolls, and adult slice-of-life storytelling.'
    },
    kodomomuke: {
      label: 'Kodomomuke (子供向け)',
      desc: 'All-ages family literature, whimsical fairy tales, and cheerful animal adventures.'
    },
    general: {
      label: 'General Audience',
      desc: 'Literary classics and universal open-access monographs.'
    }
  };

  const currentMeta = demographicMeta[norm] || {
    label: slug.toUpperCase(),
    desc: 'Cataloged titles in this demographic grouping.'
  };

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
          Demographic Curation
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 dark:text-white">
          {currentMeta.label}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
          {currentMeta.desc}
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
          No works cataloged under this demographic yet.
        </div>
      )}
    </div>
  );
};
