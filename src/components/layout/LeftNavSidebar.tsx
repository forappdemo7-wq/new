import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  BookOpen,
  Book,
  Palette,
  Layers,
  Upload,
  Flame,
  Compass,
  Heart,
  Search,
  Ghost,
  FileText,
  Bookmark,
  History,
  Download,
  User,
  Settings,
  Shield
} from 'lucide-react';

export const LeftNavSidebar: React.FC = () => {
  const { path, searchParams, navigate } = useRouter();
  const { currentUser, userProfile, openAuthModal, isAdmin } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/' && path === '/') return true;
    if (href !== '/' && path.startsWith(href)) return true;
    return false;
  };

  const currentType = searchParams.get('type');
  const currentGenre = searchParams.get('genre');

  return (
    <aside className="w-60 xl:w-64 shrink-0 hidden lg:block border-r border-stone-200 dark:border-stone-800 bg-[#FAF8F5]/80 dark:bg-[#12141A] p-4 min-h-[calc(100vh-4rem)] space-y-6 select-none sticky top-16 transition-colors duration-200">
      {/* ── Main Navigation Group ─────────────────────── */}
      <div className="space-y-1">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isLinkActive('/')
              ? 'bg-stone-200/90 dark:bg-[#1A1D26] text-stone-950 dark:text-stone-100 font-bold border border-stone-300/60 dark:border-stone-700/60 shadow-2xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
          }`}
        >
          <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Home</span>
        </button>

        <button
          onClick={() => navigate('/library')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isLinkActive('/library') && !currentType && !currentGenre
              ? 'bg-stone-200/90 dark:bg-[#1A1D26] text-stone-950 dark:text-stone-100 font-bold border border-stone-300/60 dark:border-stone-700/60 shadow-2xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <span>Library</span>
        </button>

        <button
          onClick={() => navigate('/library?type=book')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            path === '/library' && currentType === 'book'
              ? 'bg-stone-200/90 dark:bg-[#1A1D26] text-stone-950 dark:text-stone-100 font-bold border border-stone-300/60 dark:border-stone-700/60 shadow-2xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
          }`}
        >
          <Book className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Books</span>
        </button>

        <button
          onClick={() => navigate('/library?type=comic')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            path === '/library' && currentType === 'comic'
              ? 'bg-stone-200/90 dark:bg-[#1A1D26] text-stone-950 dark:text-stone-100 font-bold border border-stone-300/60 dark:border-stone-700/60 shadow-2xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Comics</span>
        </button>

        <button
          onClick={() => navigate('/library?type=manga')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            path === '/library' && currentType === 'manga'
              ? 'bg-stone-200/90 dark:bg-[#1A1D26] text-stone-950 dark:text-stone-100 font-bold border border-stone-300/60 dark:border-stone-700/60 shadow-2xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
          }`}
        >
          <Layers className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Manga</span>
        </button>

        <button
          onClick={() => navigate('/user-uploads')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            path === '/user-uploads'
              ? 'bg-stone-200/90 dark:bg-[#1A1D26] text-stone-950 dark:text-stone-100 font-bold border border-stone-300/60 dark:border-stone-700/60 shadow-2xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
          }`}
        >
          <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>User Uploads</span>
        </button>
      </div>

      {/* ── Browse by Genre ───────────────────────────── */}
      <div className="space-y-1 pt-3 border-t border-stone-200 dark:border-stone-800">
        <div className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Browse by Genre
        </div>

        <button
          onClick={() => navigate('/library?genre=fantasy')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Fantasy</span>
        </button>

        <button
          onClick={() => navigate('/library?genre=sci-fi')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 text-sky-500" />
          <span>Sci-Fi</span>
        </button>

        <button
          onClick={() => navigate('/library?genre=adventure')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4 text-emerald-500" />
          <span>Adventure</span>
        </button>

        <button
          onClick={() => navigate('/library?genre=romance')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Heart className="w-4 h-4 text-pink-500" />
          <span>Romance</span>
        </button>

        <button
          onClick={() => navigate('/library?genre=mystery')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 text-indigo-500" />
          <span>Mystery</span>
        </button>

        <button
          onClick={() => navigate('/library?genre=horror')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Ghost className="w-4 h-4 text-rose-500" />
          <span>Horror</span>
        </button>

        <button
          onClick={() => navigate('/library?genre=non-fiction')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4 text-stone-500" />
          <span>Non-Fiction</span>
        </button>
      </div>

      {/* ── Your Reading ──────────────────────────────── */}
      <div className="space-y-1 pt-3 border-t border-stone-200 dark:border-stone-800">
        <div className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Your Reading
        </div>

        <button
          onClick={() => navigate('/reading-list')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          <span>Reading List</span>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <History className="w-4 h-4 text-sky-500" />
          <span>History</span>
        </button>

        <button
          onClick={() => navigate('/downloads')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-500" />
          <span>Downloads</span>
        </button>
      </div>

      {/* ── Reader Account Profile Box ─────────────────── */}
      <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
        {currentUser ? (
          <div
            onClick={() => openAuthModal('profile')}
            className="p-3 rounded-xl bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-800 hover:border-[#C25E3A] dark:hover:border-[#C25E3A] transition-all cursor-pointer space-y-2 group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 border-2 border-[#C25E3A] shrink-0">
                <img
                  src={userProfile?.photoURL || currentUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=scholar'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-[#C25E3A] dark:group-hover:text-amber-400">
                  {userProfile?.displayName || currentUser.displayName || 'Reader'}
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                  {currentUser.email ? 'Synced Member' : 'Guest Reader'}
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200" />
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
              <User className="w-4 h-4 text-[#C25E3A]" />
              <span>Reader Account</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
              Create your reader account, choose your avatar, and sync reading progress.
            </p>
            <button
              onClick={() => openAuthModal('signup')}
              className="w-full py-2 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Create Account</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Curator & Admin Panel Link (Only visible when logged in as Admin) ─────────────────── */}
      {isAdmin && (
        <div className="pt-2">
          <button
            onClick={() => navigate('/admin')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              path === '/admin'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-900/60'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
            }`}
          >
            <Shield className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Admin &amp; Moderation</span>
          </button>
        </div>
      )}
    </aside>
  );
};
