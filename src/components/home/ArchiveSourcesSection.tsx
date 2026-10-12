import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Globe, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

export const ArchiveSourcesSection: React.FC = () => {
  const { navigate } = useRouter();

  const sources = [
    {
      name: 'Project Gutenberg',
      role: 'World Literature Repository',
      description: 'Over 70,000 free public-domain classics digitized with complete verbatim textual fidelity.',
      url: 'https://www.gutenberg.org',
      accessionBadge: 'US Public Domain Pre-1929',
    },
    {
      name: 'Internet Archive',
      role: 'Open Digital Media Library',
      description: 'Preserving millions of historical texts, illustrated journals, and early 20th-century magazines.',
      url: 'https://archive.org',
      accessionBadge: 'Open Access & CC0',
    },
    {
      name: 'National Diet Library',
      role: 'Japanese Cultural Heritage',
      description: 'Digitized rare woodblock scrolls, Hokusai Manga sketchbooks, and Meiji/Taisho era sequential art.',
      url: 'https://www.ndl.go.jp/en/',
      accessionBadge: 'NDL Public Domain',
    },
    {
      name: 'Smithsonian Libraries',
      role: 'Historical Scientific & Art Folios',
      description: 'Open access scientific monographs, archival natural history drawings, and public domain folios.',
      url: 'https://library.si.edu/',
      accessionBadge: 'Smithsonian Open Access',
    },
  ];

  return (
    <section className="space-y-4 pt-4 border-t border-stone-200/70 dark:border-stone-800/70">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
            Archival Provenance
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-100 tracking-tight">
            Trusted Archive Sources
          </h2>
        </div>
        <button
          onClick={() => navigate('/sources')}
          className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View archival registry</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sources.map((src) => (
          <div
            key={src.name}
            className="p-4 rounded-xl bg-white dark:bg-[#151820] border border-stone-200/80 dark:border-stone-800/80 space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C25E3A] dark:text-[#D9774F] font-semibold">
                  {src.role}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {src.accessionBadge}
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {src.name}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
                {src.description}
              </p>
            </div>

            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white pt-2 border-t border-stone-100 dark:border-stone-800"
            >
              <span>Visit repository</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};
