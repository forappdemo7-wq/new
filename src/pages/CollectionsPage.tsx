import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { MediaCard } from '../components/catalog/MediaCard';
import bannerClassics from '../assets/images/collection_classics_1791353492726.jpg';
import bannerManga from '../assets/images/collection_manga_hist_1791353537481.jpg';
import bannerScifi from '../assets/images/collection_scifi_fantasy_1791353561476.jpg';
import bannerComics from '../assets/images/collection_comics_graphic_1791353583162.jpg';

export const CollectionsPage: React.FC = () => {
  const { works } = useLibrary();

  const curatedGroups = [
    {
      id: 'classics',
      title: 'Classics & World Literature',
      subtitle: 'Masterpieces of philosophy, psychology, and narrative literature preserved in the global public domain.',
      banner: bannerClassics,
      works: works.filter((w) => w.type === 'book' && ((w.genres || []).includes('Classics') || (w.genres || []).includes('Romance') || (w.genres || []).includes('Mystery'))).slice(0, 6)
    },
    {
      id: 'manga',
      title: 'Historical Manga & Woodblock Folios',
      subtitle: 'From Katsushika Hokusai’s early sketchbooks to modern open-distribution medical manga.',
      banner: bannerManga,
      works: works.filter((w) => w.type === 'manga').slice(0, 6)
    },
    {
      id: 'scifi',
      title: 'Sci-Fi & Speculative Horizons',
      subtitle: 'Visionary works exploring Martian frontiers, mechanical time travel, and dimensional geometry.',
      banner: bannerScifi,
      works: works.filter((w) => (w.genres || []).includes('Sci-Fi') || (w.genres || []).includes('Fantasy')).slice(0, 6)
    },
    {
      id: 'comics',
      title: 'Graphic Novels & Webcomics',
      subtitle: 'Permissively licensed webcomics, vintage newspaper serials, and community translations.',
      banner: bannerComics,
      works: works.filter((w) => w.type === 'comic').slice(0, 6)
    },
  ];

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#12141A] min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Header */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
            Archival Anthologies
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            Curated Collections
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 font-sans max-w-xl">
            Thematic archives curated by era, artistic style, narrative tradition, and licensing provenance.
          </p>
        </div>

        {/* Collections Groups */}
        <div className="space-y-14">
          {curatedGroups.map((group) => (
            <section key={group.id} className="space-y-5">
              {/* Group Banner Header */}
              <div className="relative aspect-[21/6] rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-stone-900 shadow-xs">
                <img
                  src={group.banner}
                  alt={group.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent p-6 sm:p-8 flex flex-col justify-end text-white">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                    {group.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300 font-sans max-w-lg mt-1">
                    {group.subtitle}
                  </p>
                </div>
              </div>

              {/* Works Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {group.works.map((work) => (
                  <MediaCard key={work.id} work={work} />
                ))}
              </div>
            </section>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CollectionsPage;
