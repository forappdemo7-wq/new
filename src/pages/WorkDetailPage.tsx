import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Heart, Bookmark, ExternalLink, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { ExportEreaderModal } from '../components/modals/ExportEreaderModal';

interface WorkDetailPageProps {
  slug: string;
}

export const WorkDetailPage: React.FC<WorkDetailPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { getWorkBySlug, isFavorite, toggleFavoriteWork } = useLibrary();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);

  const cleanSlug = (slug || '').split('#')[0].split('?')[0];
  const work = getWorkBySlug(cleanSlug);

  if (!work) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#0B0D13] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-serif text-2xl font-bold mb-2">Work Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">The requested book or manga could not be found.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const isFav = isFavorite(work.id);

  const handleStartRead = () => {
    const firstChapterId = work.chapters?.[0]?.id || '1';
    navigate(`/read/${work.id}/${firstChapterId}`);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#0B0D13] text-stone-900 dark:text-stone-100 pb-20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 items-start">
          <div className="space-y-4">
            <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900">
              <img
                src={work.coverImageUrl || work.coverImage}
                alt={work.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStartRead}
                className="flex-1 py-3 px-4 bg-[#C25E3A] hover:bg-[#a84e2e] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Now</span>
              </button>
              <button
                onClick={() => toggleFavoriteWork(work.id)}
                aria-label="Favorite"
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  isFav
                    ? 'bg-rose-500/10 border-rose-500 text-rose-600'
                    : 'bg-white dark:bg-[#151820] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  {work.type}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  {work.originalPublicationYear || 'Classic'}
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white">
                {work.title}
              </h1>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                By {work.authors?.map((a) => a.name).join(', ') || 'Community Creator'}
              </p>
            </div>

            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {work.synopsis || work.description}
            </p>

            <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-4">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                Chapters ({work.chapters?.length || 0})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {work.chapters?.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => navigate(`/read/${work.id}/${ch.id}`)}
                    className="w-full text-left p-3 rounded-xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 hover:border-[#C25E3A] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {ch.title}
                    </span>
                    <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showExportModal && <ExportEreaderModal work={work} onClose={() => setShowExportModal(false)} />}
    </div>
  );
};
