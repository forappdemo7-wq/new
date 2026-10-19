import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { Bookmark, Sun, Moon, Menu, X, Search, User, Users, Plus, Shield, ChevronDown, LogOut } from 'lucide-react';
import { PublishWorkModal } from '../modals/PublishWorkModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { BrandLogo } from '../common/BrandLogo';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar: React.FC = () => {
  const { path, searchParams, navigate } = useRouter();
  const { favorites, bookmarks, siteTheme, toggleSiteTheme } = useLibrary();
  const { currentUser, userProfile, openAuthModal, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  // Global hotkey '/' or 'Cmd/Ctrl+K' to open global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return;

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const savedCount = favorites.length + bookmarks.length;

  const navLinks = [
    { label: 'Discover', href: '/' },
    { label: 'Library', href: '/library' },
    { label: 'User Uploads', href: '/user-uploads' },
    { label: 'Comics & Manga', href: '/library?type=manga' },
    { label: 'Collections', href: '/collections' },
  ];

  const handleNav = (href: string) => {
    navigate(href);
    setMobileMenuOpen(false);
  };

  const handlePublishClick = () => {
    const activeReader = currentUser || userProfile;
    if (!activeReader || (activeReader as any).isAnonymous) {
      openAuthModal('signin');
    } else {
      setPublishModalOpen(true);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    if (href === '/library') {
      return path === '/library' && !searchParams.get('type') && !searchParams.get('genre') && !searchParams.get('filter');
    }
    if (href === '/library?type=manga') {
      return path === '/library' && (searchParams.get('type') === 'manga' || searchParams.get('type') === 'comic');
    }
    if (href === '/collections') {
      return path === '/collections' || (path === '/library' && searchParams.get('genre') === 'classics');
    }
    return path === href;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#12141A]/95 border-b border-stone-200/80 dark:border-stone-800/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 h-16 sm:h-20">
            
            {/* ── Brand Identity: wanna read? ──────────────────────────────── */}
            <button
              onClick={() => handleNav('/')}
              className="flex items-center focus:outline-none cursor-pointer shrink-0 group py-1 text-stone-900 dark:text-stone-100"
              aria-label="wanna read? library home"
            >
              <BrandLogo size="md" />
            </button>

            {/* ── Center Navigation Links (Desktop) ─────────────────────── */}
            <nav
              className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-sans font-medium text-stone-600 dark:text-stone-300"
              aria-label="Primary Navigation"
            >
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <button
                    key={link.label}
                    onClick={() => handleNav(link.href)}
                    aria-current={active ? 'page' : undefined}
                    className={`py-2 transition-colors cursor-pointer text-[14px] xl:text-[15px] ${
                      active
                        ? 'text-stone-950 dark:text-white font-semibold'
                        : 'hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* ── Right Actions: Search, Theme, Saved, Publish, Profile ─── */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Global Quick Search Button */}
              <button
                onClick={() => setIsGlobalSearchOpen(true)}
                title="Search literature, manga, comics, or any username (Press / to search)"
                aria-label="Search Library & Users"
                className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100/70 hover:bg-stone-200/70 dark:bg-stone-800/60 dark:hover:bg-stone-800 rounded-xl transition-all border border-stone-200/80 dark:border-stone-700/80 cursor-pointer shadow-2xs group"
              >
                <Search className="w-4.5 h-4.5 text-stone-500 group-hover:text-[#C25E3A] transition-colors" />
                <span className="hidden md:inline text-xs text-stone-500 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">
                  Search folios or users...
                </span>
                <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 text-stone-400 border border-stone-200 dark:border-stone-700">
                  /
                </kbd>
              </button>

              {/* Theme Toggle Button (Desktop & Tablet) */}
              <button
                onClick={toggleSiteTheme}
                title={siteTheme === 'dark' ? 'Switch to light parchment' : 'Switch to dark mode'}
                aria-label="Toggle theme"
                className="hidden sm:flex p-2.5 sm:p-3 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800/60 rounded-xl transition-colors cursor-pointer"
              >
                {siteTheme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Saved list / Bookmarks (Desktop & Tablet) */}
              <button
                onClick={() => handleNav('/reading-list')}
                title="Saved works & bookmarks"
                aria-label="Saved works & bookmarks"
                className="hidden sm:flex p-2.5 sm:p-3 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800/60 rounded-xl transition-colors relative cursor-pointer"
              >
                <Bookmark className="w-5 h-5" />
                {savedCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#C25E3A]" />
                )}
              </button>

              {/* Notification Center Bell Dropdown */}
              <NotificationDropdown />


              {/* Publish Work Button */}
              <button
                onClick={handlePublishClick}
                title="Self-publish or upload your creation"
                className="p-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#C25E3A] hover:bg-[#a84e2e] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[38px] sm:min-h-[40px]"
              >
                <Plus className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">Publish</span>
              </button>

              {/* User Profile Avatar & Menu Dropdown */}
              {currentUser || userProfile ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-100/60 dark:bg-stone-800/40 hover:bg-stone-200/50 dark:hover:bg-stone-800/80 transition-all cursor-pointer group"
                    aria-label="Account menu"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 shrink-0 group-hover:ring-2 group-hover:ring-[#C25E3A]/40 transition-all">
                      <img
                        src={userProfile?.photoURL || currentUser?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=scholar'}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-stone-800 dark:text-stone-200 max-w-[110px] truncate">
                      @{userProfile?.displayName || 'Reader'}
                    </span>
                    <ChevronDown className={`hidden sm:inline w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Sleek User Profile Dropdown */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#12141A] border border-stone-200 dark:border-stone-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* User Info Header */}
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#1A1D26] border border-stone-200/60 dark:border-stone-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 shrink-0">
                          <img
                            src={userProfile?.photoURL || currentUser?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=scholar'}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                            @{userProfile?.displayName || 'Reader'}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                            {userProfile?.email || currentUser?.email || 'Reader account'}
                          </div>
                        </div>
                      </div>

                      {/* Menu Actions */}
                      <div className="mt-1.5 space-y-0.5">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            const myUid = userProfile?.uid || currentUser?.uid;
                            if (myUid) {
                              handleNav(`/user/${myUid}`);
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/70 rounded-xl transition-colors cursor-pointer text-left"
                        >
                          <Users className="w-4 h-4 text-emerald-500" />
                          <span>View Public Profile</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            openAuthModal('profile');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/70 rounded-xl transition-colors cursor-pointer text-left"
                        >
                          <User className="w-4 h-4 text-[#C25E3A]" />
                          <span>Profile &amp; Username</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleNav('/reading-list');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/70 rounded-xl transition-colors cursor-pointer text-left"
                        >
                          <Bookmark className="w-4 h-4 text-blue-500" />
                          <span>Saved Works &amp; Bookmarks</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              handleNav('/admin');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-stone-200/80 dark:border-stone-800/80" />

                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            await logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('signin')}
                  className="p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px] sm:min-h-[40px]"
                  title="Sign In / Account"
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="hidden sm:inline">Account</span>
                </button>
              )}

              {/* Mobile & Tablet Menu Toggle (Dropdown) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className={`lg:hidden p-2 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-xl cursor-pointer transition-colors shrink-0 ${
                  mobileMenuOpen
                    ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-950 dark:text-white'
                    : 'hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                }`}
              >
                {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200/90 dark:border-stone-800/90 bg-[#FAF8F5] dark:bg-[#12141A] px-4 pt-3 pb-6 space-y-3 shadow-xl max-h-[calc(100vh-4.5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
            {/* Mobile User Profile Summary if logged in */}
            {userProfile && (
              <div className="p-3 bg-white dark:bg-[#1A1D26] rounded-2xl flex items-center justify-between border border-stone-200/80 dark:border-stone-800 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 border-2 border-[#C25E3A] shrink-0">
                    <img
                      src={userProfile.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=scholar'}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-stone-900 dark:text-white truncate">
                      @{userProfile.displayName}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {userProfile.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('profile');
                  }}
                  className="text-xs font-semibold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Profile
                </button>
              </div>
            )}

            {/* Mobile Search Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsGlobalSearchOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 text-sm font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4.5 h-4.5 text-[#C25E3A]" />
                <span>Search Folios &amp; Users</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 text-stone-400">
                Press /
              </span>
            </button>

            {/* Mobile Publish CTA */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setPublishModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 text-sm font-semibold rounded-xl bg-[#C25E3A] hover:bg-[#a84e2e] text-white shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Publish Your Creation</span>
            </button>

            <nav className="flex flex-col space-y-1.5 pt-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <button
                    key={link.label}
                    onClick={() => handleNav(link.href)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      active
                        ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-950 dark:text-white font-semibold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/40 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Utility Controls Row */}
            <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800/60 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleNav('/reading-list')}
                className="flex items-center justify-center gap-2 p-3.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#1A1D26] border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 cursor-pointer shadow-2xs"
              >
                <Bookmark className="w-4.5 h-4.5 text-[#C25E3A]" />
                <span>Saved ({savedCount})</span>
              </button>

              <button
                onClick={toggleSiteTheme}
                className="flex items-center justify-center gap-2 p-3.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#1A1D26] border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 cursor-pointer shadow-2xs"
              >
                {siteTheme === 'dark' ? (
                  <>
                    <Sun className="w-4.5 h-4.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4.5 h-4.5" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Admin Link (Only visible to authenticated administrators) */}
            {isAdmin && (
              <div className="pt-2">
                <button
                  onClick={() => handleNav('/admin')}
                  className="w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin &amp; Content Moderation</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

    {/* Self-Publishing / Upload Creation Modal */}
    <PublishWorkModal
      isOpen={publishModalOpen}
      onClose={() => setPublishModalOpen(false)}
    />

    {/* Universal Global Search Modal (Search Works & Users) */}
    <GlobalSearchModal
      isOpen={isGlobalSearchOpen}
      onClose={() => setIsGlobalSearchOpen(false)}
    />
  </>
);
};
