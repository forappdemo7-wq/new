import React from 'react';
import { useRouter } from '../context/RouterContext';
import { Lock, CheckCircle2 } from 'lucide-react';

interface StaticPageProps {
  page: 'about' | 'privacy' | 'terms' | 'dmca' | 'contribute';
}

export const StaticPages: React.FC<StaticPageProps> = ({ page }) => {
  const { navigate } = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 transition-colors duration-150">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
      >
        <span>← Return to Home</span>
      </button>

      {/* ===================== ABOUT PAGE ===================== */}
      {page === 'about' && (
        <article className="space-y-8 bg-white p-8 sm:p-12 rounded-xl border border-stone-200">
          <div className="space-y-2 border-b border-stone-200 pb-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-900">
              Curatorial Philosophy
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
              About wanna read?
            </h1>
            <p className="text-sm text-stone-600">
              An ad-free, tracking-free, completely open sanctuary for human culture.
            </p>
          </div>

          <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
            <p>
              Human culture belongs to everyone. Throughout history, stories, philosophies, scientific explorations, and visual narratives have been the bedrock of civilization. Yet in the modern internet era, reading has become besieged by invasive tracker scripts, paywalls, mandatory account creations, pop-up ads, and DRM locks.
            </p>

            <h3 className="font-serif text-xl font-semibold text-stone-900 pt-4">
              Our Core Commitments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-serif font-bold text-stone-900 text-sm block">1. 100% Free &amp; Ad-Free</span>
                <p className="text-xs text-stone-600">
                  No subscription models, no sponsored placements, no banner networks, and no hidden monetization.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-serif font-bold text-stone-900 text-sm block">2. Privacy First</span>
                <p className="text-xs text-stone-600">
                  No mandatory accounts. Your bookmarks, reading progress, and favorites are stored purely on your own device.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-serif font-bold text-stone-900 text-sm block">3. Strict Legal Integrity</span>
                <p className="text-xs text-stone-600">
                  We only host or index works whose copyright terms have expired or creators who have granted explicit open distribution licenses.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-serif font-bold text-stone-900 text-sm block">4. Reader-First Accessibility</span>
                <p className="text-xs text-stone-600">
                  Customizable typography, responsive formatting, and comfortable reading themes on mobile, tablet, and desktop.
                </p>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* ===================== PRIVACY PLEDGE ===================== */}
      {page === 'privacy' && (
        <article className="space-y-8 bg-white p-8 sm:p-12 rounded-xl border border-stone-200">
          <div className="space-y-2 border-b border-stone-200 pb-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
              Privacy Declaration
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
              Privacy Policy &amp; Zero-Tracking Pledge
            </h1>
            <p className="text-sm text-stone-600">
              Effective date: {new Date().getFullYear()} · Transparent, local-first computing.
            </p>
          </div>

          <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <strong>Summary in Plain Language:</strong> wanna read? does not collect personal identity data, does not use advertising tracking cookies, and does not sell or share any user behavior.
              </div>
            </div>

            <h3 className="font-serif text-lg font-semibold text-stone-900">1. Local-First Client Storage</h3>
            <p>
              All features that remember your reading state—such as your current chapter, scroll position, bookmarked passages, theme preferences, and favorited titles—are stored locally in your web browser using HTML5 LocalStorage and IndexedDB. This data never leaves your device and is never uploaded to our servers.
            </p>

            <h3 className="font-serif text-lg font-semibold text-stone-900">2. No Third-Party Tracking Scripts</h3>
            <p>
              We do not embed Google Analytics, Facebook Pixels, marketing beacons, or telemetry surveillance software. If aggregate traffic metrics are ever utilized, they will be strictly anonymized privacy-respecting platforms such as self-hosted Umami or Plausible with zero personal identifiers.
            </p>

            <h3 className="font-serif text-lg font-semibold text-stone-900">3. Deleting Your Data</h3>
            <p>
              You can instantly clear all wanna read? reading progress, favorites, and settings by clicking "Clear Storage" in the Admin settings or by clearing your browser's site data.
            </p>
          </div>
        </article>
      )}

      {/* ===================== TERMS OF USE ===================== */}
      {page === 'terms' && (
        <article className="space-y-8 bg-white p-8 sm:p-12 rounded-xl border border-stone-200">
          <div className="space-y-2 border-b border-stone-200 pb-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Legal Framework
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
              Terms of Use
            </h1>
            <p className="text-sm text-stone-600">
              Guidelines for accessing and redistributing open library materials.
            </p>
          </div>

          <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
            <h3 className="font-serif text-lg font-semibold text-stone-900">1. Respect for Open Licenses</h3>
            <p>
              All content hosted on or indexed by wanna read? is governed by the specific license displayed on that work’s catalog page. Users are free to enjoy, study, and share works according to their respective license deeds (e.g., CC BY, CC BY-SA, Public Domain). You agree not to misrepresent the authorship or licensing terms of any work.
            </p>

            <h3 className="font-serif text-lg font-semibold text-stone-900">2. Commercial Use &amp; Non-Commercial Flags</h3>
            <p>
              Works flagged with CC-BY-NC or CC-BY-NC-SA may be freely distributed for educational and personal use, but may not be resold or paywalled without explicit agreement from the original creator.
            </p>

            <h3 className="font-serif text-lg font-semibold text-stone-900">3. Disclaimer of Warranty</h3>
            <p>
              Works and services on wanna read? are provided "as is" for cultural and educational enrichment.
            </p>
          </div>
        </article>
      )}

      {/* ===================== DMCA & TAKEDOWN ===================== */}
      {page === 'dmca' && (
        <article className="space-y-8 bg-white p-8 sm:p-12 rounded-xl border border-stone-200">
          <div className="space-y-2 border-b border-stone-200 pb-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-800">
              Copyright Compliance
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
              DMCA &amp; Takedown Procedure
            </h1>
            <p className="text-sm text-stone-600">
              Our prompt, transparent protocol for intellectual property verification.
            </p>
          </div>

          <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
            <p>
              wanna read? takes intellectual property rights with the utmost seriousness. We respect authors, illustrators, and copyright holders. If you believe any material hosted or indexed here infringes upon your copyright, our registered agent will review and resolve your request within 24 hours.
            </p>

            <h3 className="font-serif text-lg font-semibold text-stone-900">
              How to Submit a Valid DMCA Notice
            </h3>
            <p>
              Pursuant to 17 U.S.C. § 512(c)(3), please provide our designated compliance desk with the following:
            </p>

            <ul className="list-disc list-inside space-y-2 text-xs text-stone-600 pl-2">
              <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
              <li>Identification of the copyrighted work claimed to have been infringed, including original publication proof.</li>
              <li>Identification of the specific wanna read? URL or work title you wish removed.</li>
              <li>Information reasonably sufficient to permit us to contact you (e.g. email address, phone number).</li>
              <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act.</li>
            </ul>

            <div className="p-4 rounded-lg bg-stone-50 border border-stone-200">
              <h4 className="font-semibold text-xs text-stone-900 uppercase tracking-wider mb-1">
                Direct Contact &amp; Takedown Desk
              </h4>
              <p className="text-xs text-stone-600 font-mono">
                Email: compliance@getnow.library (or use the built-in "Report Work" button on any catalog page)
              </p>
            </div>
          </div>
        </article>
      )}

      {/* ===================== CONTRIBUTE PAGE ===================== */}
      {page === 'contribute' && (
        <article className="space-y-8 bg-white p-8 sm:p-12 rounded-xl border border-stone-200">
          <div className="space-y-2 border-b border-stone-200 pb-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-900">
              Community &amp; Authors
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
              Contribute Open Works
            </h1>
            <p className="text-sm text-stone-600">
              How creators, translators, and archivists can submit verified open literature and comics.
            </p>
          </div>

          <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
            <p>
              Are you an author, webcomic artist, translator, or archivist who has released works under Creative Commons or into the public domain? We welcome your work into wanna read?’s permanent, ad-free collection.
            </p>

            <h3 className="font-serif text-lg font-semibold text-stone-900">
              Legal Pre-Submission Checklist
            </h3>

            <div className="space-y-3">
              {[
                {
                  title: '1. Sole or Authorized Rights Holder',
                  desc: 'You must be the original creator or have explicit written authority to license the work under an open standard.'
                },
                {
                  title: '2. Unencumbered Third-Party Assets',
                  desc: 'All illustrations, fonts, textures, and quotes contained inside the work must also be openly licensed or created by you.'
                },
                {
                  title: '3. Explicit Open License Declaration',
                  desc: 'The work must carry a visible Creative Commons (CC0, CC BY, CC BY-SA, CC BY-NC) or Public Domain mark on its frontmatter or colophon.'
                },
                {
                  title: '4. Non-Proprietary Open Formats',
                  desc: 'Works must be available in EPUB, HTML, CBZ, PDF, or high-resolution PNG/SVG images.'
                }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg bg-stone-50 border border-stone-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-xs text-stone-900">{item.title}</h4>
                    <p className="text-xs text-stone-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Ready to add or test a work directly?
              </span>
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded transition-colors"
              >
                Open Admin Curator Console
              </button>
            </div>
          </div>
        </article>
      )}
    </div>
  );
};
