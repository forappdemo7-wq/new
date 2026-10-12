import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer className="border-t border-stone-200/80 dark:border-stone-800/80 bg-[#FAF8F5] dark:bg-[#12141A] text-stone-600 dark:text-stone-300 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <button
              onClick={() => navigate('/')}
              className="text-left cursor-pointer group text-stone-900 dark:text-stone-100"
            >
              <BrandLogo size="sm" />
            </button>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-sm font-sans">
              An ad-free, privacy-first, free-to-read online library for openly licensed literature, historical Japanese manga, and independent comics.
            </p>
            <div className="text-[11px] text-stone-500 dark:text-stone-500 pt-1 font-mono">
              <span>Public domain verified · Zero ads · No tracking</span>
            </div>
          </div>

          {/* Catalog */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-900 dark:text-white">
              Catalog
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 font-sans">
              <li>
                <button
                  onClick={() => navigate('/library?type=book')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Classic Literature
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/library?type=manga')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Historical &amp; Open Manga
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/library?type=comic')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Graphic Novels &amp; Comics
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/collections')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Curated Collections
                </button>
              </li>
            </ul>
          </div>

          {/* Technology & Formats */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-900 dark:text-white">
              Portability
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 font-sans">
              <li>
                <button
                  onClick={() => navigate('/opds')}
                  className="hover:text-[#C25E3A] dark:hover:text-[#D9774F] transition-colors font-mono cursor-pointer"
                >
                  OPDS 1.2 Feed
                </button>
              </li>
              <li>
                <span className="text-stone-500 dark:text-stone-400">Standard .EPUB3 Downloads</span>
              </li>
              <li>
                <span className="text-stone-500 dark:text-stone-400">Comic Archive (.CBZ)</span>
              </li>
              <li>
                <span className="text-stone-500 dark:text-stone-400">Offline PWA Installation</span>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-900 dark:text-white">
              Archive &amp; Ethics
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 font-sans">
              <li>
                <button
                  onClick={() => navigate('/about')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  About &amp; Manifesto
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/license/overview')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  License Registry
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/sources')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Archival Provenance
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/privacy')}
                  className="hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Privacy &amp; Terms
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
          <p>© {new Date().getFullYear()} wanna read? · An open digital library built for readers.</p>
          <div className="flex items-center gap-4">
            <span>WCAG 2.1 AA</span>
            <span>·</span>
            <span>Distraction-Free</span>
            <span>·</span>
            <span>Worldwide Public Domain</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
