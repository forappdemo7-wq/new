import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { LICENSES_REGISTRY, getLicenseInfo } from '../data/licenses';
import { WorkCard } from '../components/catalog/WorkCard';
import { ArrowLeft, Check, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { LicenseInfo, Work } from '../types';

interface LicensePageProps {
  code: string;
}

export const LicensePage: React.FC<LicensePageProps> = ({ code }) => {
  const { navigate } = useRouter();
  const { getWorksByLicense } = useLibrary();

  const isOverview = code === 'overview' || !code;
  const currentLicense = getLicenseInfo(code.toUpperCase());
  const worksWithLicense = !isOverview ? getWorksByLicense(currentLicense.code) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 text-stone-900 dark:text-stone-100 transition-colors duration-150">
      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6 space-y-2">
        <div className="text-xs uppercase tracking-wider font-semibold text-[#C25E3A] dark:text-[#D9774F]">
          Rights &amp; Compliance Directory
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 dark:text-white">
          {isOverview ? 'Open Licenses & Public Domain Standards' : currentLicense.name}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Every work on wanna read? is verified under an open cultural license or public domain determination. We ensure readers, educators, and creators can legally access, quote, and celebrate human creativity.
        </p>
      </div>

      {isOverview ? (
        // Overview of all licenses
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(Object.values(LICENSES_REGISTRY) as LicenseInfo[]).map((lic: LicenseInfo) => (
            <div
              key={lic.code}
              className="bg-white dark:bg-[#151820] rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-4 hover:border-stone-400 dark:hover:border-stone-600 transition-colors shadow-2xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-xs font-bold text-[#C25E3A] dark:text-[#D9774F]">
                    {lic.code}
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-stone-900 dark:text-white mt-1">
                    {lic.name}
                  </h3>
                </div>

                <a
                  href={lic.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded"
                  title="Official Legal Deed"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {lic.shortDesc}
              </p>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/license/${lic.code.toLowerCase()}`)}
                  className="text-xs font-semibold text-[#C25E3A] dark:text-[#D9774F] hover:underline cursor-pointer"
                >
                  Full details &amp; titles →
                </button>
                <button
                  onClick={() => navigate(`/library?license=${lic.code}`)}
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                >
                  Filter library
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Single License Deep Dive
        <div className="space-y-12">
          <div className="bg-white dark:bg-[#151820] rounded-xl border border-stone-200 dark:border-stone-800 p-8 space-y-6 shadow-2xs">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-[#C25E3A] dark:text-[#D9774F] font-bold">
                {currentLicense.code} · LEGAL DEED BREAKDOWN
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-white">
                {currentLicense.name}
              </h2>
              <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed max-w-3xl">
                {currentLicense.fullDesc}
              </p>
            </div>

            {/* Permissions, Requirements, Prohibitions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>You are free to</span>
                </h4>
                <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc list-inside">
                  {currentLicense.permissions.map((p: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Under these terms</span>
                </h4>
                <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc list-inside">
                  {currentLicense.requirements.map((r: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{r}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Restrictions</span>
                </h4>
                <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc list-inside">
                  {currentLicense.prohibitions.map((pr: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{pr}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              <a
                href={currentLicense.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C25E3A] dark:text-[#D9774F] hover:underline"
              >
                <span>Read Official Legal Deed at Creative Commons / Open Registry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Works using this license */}
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-semibold text-stone-900 dark:text-white">
              Works Cataloged Under {currentLicense.code} ({worksWithLicense.length})
            </h3>
            {worksWithLicense.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {worksWithLicense.map((w: Work) => (
                  <WorkCard key={w.id} work={w} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                No titles in the demo catalog currently use this exact license code.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
