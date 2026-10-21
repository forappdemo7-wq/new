import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { ArrowRight } from 'lucide-react';
import heroLibraryBg from '../../assets/images/hero_candlelit_library_1790844657495.jpg';
import comicScifiBg from '../../assets/images/comic_scifi_odyssey_1790759577653.jpg';
import mangaHokusaiBg from '../../assets/images/manga_hokusai_woodblock_1790760941217.jpg';

export const CategoryBanners: React.FC = () => {
  const { navigate } = useRouter();

  const categories = [
    {
      id: 'books',
      title: 'Books',
      subtitle: 'Fantasy, Romance, Sci-Fi & more',
      bgImg: heroLibraryBg,
      href: '/library?type=book'
    },
    {
      id: 'comics',
      title: 'Comics',
      subtitle: 'Superheroes, Graphic Novels & more',
      bgImg: comicScifiBg,
      href: '/library?type=comic'
    },
    {
      id: 'manga',
      title: 'Manga',
      subtitle: 'Action, Romance, Isekai & more',
      bgImg: mangaHokusaiBg,
      href: '/library?type=manga'
    }
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
          Browse by Category
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(cat.href)}
            className="relative h-40 rounded-2xl overflow-hidden border border-stone-200/90 dark:border-white/[0.08] bg-stone-900 dark:bg-[#0B101D] p-5 sm:p-6 flex flex-col justify-end cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 select-none"
          >
            {/* Background Image with Gradient and Smooth Zoom */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <img
                src={cat.bgImg}
                alt={cat.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-55 dark:opacity-40 mix-blend-screen"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent dark:from-[#0B101D] dark:via-[#0B101D]/70 dark:to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex items-end justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 font-semibold">
                  Collection
                </span>
                <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white group-hover:text-amber-300 transition-colors tracking-tight">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-200 dark:text-slate-300 font-sans">
                  {cat.subtitle}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-[#FF5733] group-hover:border-[#FF5733] transition-all shrink-0">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
