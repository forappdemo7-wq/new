import React, { useMemo } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useRouter } from '../context/RouterContext';
import { HeroSection } from '../components/home/HeroSection';
import { ContinueReadingShelf } from '../components/home/ContinueReadingShelf';
import { FeaturedCollectionsShelf } from '../components/home/FeaturedCollectionsShelf';
import { ArchiveSourcesSection } from '../components/home/ArchiveSourcesSection';
import { MediaCard } from '../components/catalog/MediaCard';
import { ArrowRight, Shuffle } from 'lucide-react';
import { Work } from '../types';
import { sortWorksByLikes, useLikesSync } from '../services/interactionService';

export const HomePage: React.FC = () => {
  const { works } = useLibrary();
  const { navigate } = useRouter();
  const likesVersion = useLikesSync();

  // Curated Classics for Top Showcase matching Mockup
  const showcaseIds = [
    'work-frankenstein',
    'work-dracula',
    'work-time-machine',
    'work-pride-prejudice',
    'work-great-gatsby',
    'work-moby-dick',
  ];

  const classicsWorks = showcaseIds
    .map((id) => works.find((w) => w.id === id))
    .filter((w): w is Work => Boolean(w));

  // Comics & Manga showcase matching Mockup
  const mangaIds = [
    'work-black-jack-yoroshiku-1',
    'work-hokusai-1',
    'work-little-nemo-1',
    'work-peppercarrot-1',
    'work-ubunchu-1',
    'work-kaguya-1',
  ];

  const mangaWorks = mangaIds
    .map((id) => works.find((w) => w.id === id))
    .filter((w): w is Work => Boolean(w));

  const isCommunityWork = (w: Work) => {
    return (
      w.jurisdictionStatus === 'COMMUNITY_OPEN' ||
      w.sourceName === 'Community Self-Published' ||
      w.sourceName?.toLowerCase().includes('community') ||
      w.sourceName?.toLowerCase().includes('user') ||
      w.sourceName?.toLowerCase().includes('upload') ||
      w.sourceName?.toLowerCase().includes('self') ||
      Boolean(w.publisherId) ||
      Boolean(w.publisherEmail) ||
      Boolean(w.publisherName) ||
      w.licenseCode === 'COMMUNITY_OPEN'
    );
  };

  // User Uploaded Books (sorted by most liked first, max 10 showcased)
  const uploadedBooks = useMemo(() => {
    return sortWorksByLikes(works.filter((w: Work) => isCommunityWork(w) && w.type === 'book'));
  }, [works, likesVersion]);

  // User Uploaded Manga (sorted by most liked first, max 10 showcased)
  const uploadedManga = useMemo(() => {
    return sortWorksByLikes(works.filter((w: Work) => isCommunityWork(w) && w.type === 'manga'));
  }, [works, likesVersion]);

  const genres = [
    { label: 'Classics', href: '/library?genre=classics' },
    { label: 'Sci-Fi', href: '/library?genre=sci-fi' },
    { label: 'Fantasy', href: '/library?genre=fantasy' },
    { label: 'Horror', href: '/library?genre=horror' },
    { label: 'Mystery', href: '/library?genre=mystery' },
    { label: 'Romance', href: '/library?genre=romance' },
    { label: 'History', href: '/library?genre=non-fiction' },
    { label: 'Graphic Novel', href: '/library?type=comic' },
    { label: 'Manga', href: '/library?type=manga' },
  ];

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#12141A] min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12 sm:space-y-14">
        
        {/* 1. Editorial Hero */}
        <HeroSection />

        {/* 2. Continue Reading */}
        <ContinueReadingShelf />

        {/* 3. Featured Collections */}
        <FeaturedCollectionsShelf />

        {/* 3.5 User Uploaded Books Section (Showcase top 10 most liked) */}
        {uploadedBooks.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/60 dark:border-stone-800/60 pb-3 gap-2.5">
              <div>
                <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
                  Community Showcase
                </div>
                <h2 className="font-serif text-2xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
                  User Uploaded Books
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  Literature and novels published directly by our reader community (most liked first)
                </p>
              </div>
              <button
                onClick={() => navigate('/user-uploads')}
                className="self-start sm:self-auto text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
              >
                <span>View all user uploads</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {uploadedBooks.slice(0, 10).map((work) => (
                <MediaCard key={work.id} work={work} />
              ))}
            </div>
          </section>
        )}

        {/* 3.6 User Uploaded Manga Section (Showcase top 10 most liked) */}
        {uploadedManga.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/60 dark:border-stone-800/60 pb-3 gap-2.5">
              <div>
                <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
                  Community Showcase
                </div>
                <h2 className="font-serif text-2xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
                  User Uploaded Manga
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  Indie chapters and sequential manga panels by community artists (most liked first)
                </p>
              </div>
              <button
                onClick={() => navigate('/user-uploads')}
                className="self-start sm:self-auto text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
              >
                <span>View all user uploads</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {uploadedManga.slice(0, 10).map((work) => (
                <MediaCard key={work.id} work={work} />
              ))}
            </div>
          </section>
        )}

        {/* 4. "Because You Read Frankenstein" & Surprise Me Discovery */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/60 dark:border-stone-800/60 pb-3 gap-2.5">
            <div>
              <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
                Contextual Recommendation
              </div>
              <h2 className="font-serif text-2xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
                Because you read <span className="italic">Frankenstein</span>
              </h2>
            </div>
            <button
              onClick={() => {
                const surprise = works[Math.floor(Math.random() * works.length)];
                if (surprise) navigate(`/work/${surprise.slug}`);
              }}
              className="self-start sm:self-auto px-4 py-2 text-xs sm:text-sm font-semibold text-[#C25E3A] dark:text-[#D9774F] bg-[#C25E3A]/10 hover:bg-[#C25E3A]/20 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer min-h-[38px]"
            >
              <Shuffle className="w-4 h-4" />
              <span>Surprise Me</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {classicsWorks.map((work) => (
              <MediaCard key={work.id} work={work} />
            ))}
          </div>
        </section>

        {/* 5. Comics & Manga Showcase */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
                Comics &amp; Sequential Art
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Japanese woodblock manga, early comic strips, and Creative Commons series
              </p>
            </div>
            <button
              onClick={() => navigate('/library?type=manga')}
              className="self-start sm:self-auto text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              <span>Explore all visual works</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {mangaWorks.map((work) => (
              <MediaCard key={work.id} work={work} />
            ))}
          </div>
        </section>

        {/* 6. Mood-Based Discovery & Catalog Taxonomy */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
                Atmospheric Reading
              </div>
              <h2 className="font-serif text-2xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
                Curated by Mood
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Select a mood to filter the archive
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-3.5">
            {[
              { label: 'Something eerie', query: 'eerie gothic horror', icon: '🕯️' },
              { label: 'A short read', query: 'short novella quick read', icon: '⏳' },
              { label: 'Quiet evening', query: 'quiet gentle classic drama', icon: '☕' },
              { label: 'Epic fantasy', query: 'epic world building fantasy adventure', icon: '⚔️' },
              { label: 'Dark gothic', query: 'dark gothic psychological ambition', icon: '🦇' },
              { label: 'Historical', query: 'historical archive 19th century', icon: '📜' },
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => navigate(`/library?search=${encodeURIComponent(m.query)}`)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200 bg-white dark:bg-[#151820] hover:bg-[#FAF8F5] dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80 rounded-xl transition-all cursor-pointer shadow-2xs group hover:border-[#C25E3A]/40 text-left min-h-[46px]"
              >
                <span className="text-base group-hover:scale-110 transition-transform">{m.icon}</span>
                <span className="line-clamp-1">{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 7. Explore by Genre Chips */}
        <section className="space-y-4">
          <div>
            <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
              Catalog Taxonomy
            </div>
            <h2 className="font-serif text-2xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
              Explore by Genre
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-1">
            {genres.map((g) => (
              <button
                key={g.label}
                onClick={() => navigate(g.href)}
                className="px-4.5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-[#151820] hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[38px]"
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        {/* 7. Archive Sources & Provenance */}
        <ArchiveSourcesSection />

      </div>
    </div>
  );
};

export default HomePage;
