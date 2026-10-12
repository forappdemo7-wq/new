import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { ArrowRight } from 'lucide-react';
import bannerClassics from '../../assets/images/collection_classics_1791353492726.jpg';
import bannerManga from '../../assets/images/collection_manga_hist_1791353537481.jpg';
import bannerScifi from '../../assets/images/collection_scifi_fantasy_1791353561476.jpg';
import bannerComics from '../../assets/images/collection_comics_graphic_1791353583162.jpg';

export const FeaturedCollectionsShelf: React.FC = () => {
  const { navigate } = useRouter();

  const collections = [
    {
      id: 'classics',
      title: 'Classics',
      subtitle: 'Timeless literature',
      image: bannerClassics,
      href: '/library?genre=classics'
    },
    {
      id: 'manga',
      title: 'Manga & Historical',
      subtitle: 'Art and culture',
      image: bannerManga,
      href: '/library?type=manga'
    },
    {
      id: 'scifi',
      title: 'Sci-Fi & Fantasy',
      subtitle: 'Imagination knows no bounds',
      image: bannerScifi,
      href: '/library?genre=sci-fi'
    },
    {
      id: 'comics',
      title: 'Comics & Graphic Novels',
      subtitle: 'Stories in every frame',
      image: bannerComics,
      href: '/library?type=comic'
    }
  ];

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
          Featured Collections
        </h2>
        <button
          onClick={() => navigate('/collections')}
          className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {collections.map((col) => (
          <div
            key={col.id}
            onClick={() => navigate(col.href)}
            className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-stone-900 cursor-pointer shadow-xs hover:shadow-md transition-all duration-300"
          >
            {/* Background Image */}
            <img
              src={col.image}
              alt={col.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-75 dark:opacity-60"
            />
            
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end text-white select-none">
              <h3 className="font-serif text-lg font-bold tracking-tight leading-snug group-hover:text-[#F4EFEA] transition-colors">
                {col.title}
              </h3>
              <p className="text-xs text-stone-300 font-sans mt-0.5">
                {col.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
