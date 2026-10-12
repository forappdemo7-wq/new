import React from 'react';
import { useRouter } from '../context/RouterContext';
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldAlert, ShieldCheck, Link as LinkIcon, BookOpen, AlertOctagon } from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 transition-colors duration-150">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      {/* Header */}
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs uppercase tracking-wider font-semibold text-amber-900">
          Catalog Provenance &amp; Compliance Policy
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
          Source Registry &amp; Strict Blocklist
        </h1>
        <p className="text-sm text-stone-600 max-w-3xl leading-relaxed">
          In strict compliance with Part 1 of our legal charter, wanna read? only hosts content that is verifiably free to redistribute worldwide. Below is our complete matrix of approved hostable archives, authorized link-out platforms, and strictly forbidden piracy domains.
        </p>
      </div>

      {/* SECTION 1: APPROVED HOSTABLE SOURCES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-stone-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="font-serif text-2xl font-semibold">
            1. Approved Hostable Archives (Redistribution Verified)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
          These institutions, archives, and authors release works under incontestable Public Domain status or open Creative Commons / Free Art licenses explicitly allowing digital hosting.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Project Gutenberg',
              type: 'Books (Public Domain)',
              desc: '75,000+ public domain literary works. Verified expiration of US and worldwide copyright terms.',
              url: 'https://www.gutenberg.org'
            },
            {
              name: 'Standard Ebooks',
              type: 'Books (Public Domain)',
              desc: 'Professionally formatted, typography-first public domain editions carefully proofed from original scans.',
              url: 'https://standardebooks.org'
            },
            {
              name: 'Smithsonian Libraries',
              type: 'Manga (CC0 1.0 Universal)',
              desc: 'Hosts high-resolution scans of Katsushika Hokusai’s complete 15-volume manga sketchbooks under CC0.',
              url: 'https://library.si.edu'
            },
            {
              name: 'Comic Book Plus',
              type: 'Comics (Public Domain)',
              desc: '48,000+ staff-verified Golden Age and Silver Age comic books in the public domain.',
              url: 'https://comicbookplus.com'
            },
            {
              name: 'Digital Comic Museum',
              type: 'Comics (Public Domain)',
              desc: '15,000+ Golden Age titles verified copyright-free and unrenewed under historical US copyright register.',
              url: 'https://digitalcomicmuseum.com'
            },
            {
              name: 'National Diet Library (Japan)',
              type: 'Manga / Scrolls (PD-Japan)',
              desc: 'Historic Japanese digital collections with public domain declarations and expired term clearances.',
              url: 'https://www.ndl.go.jp/en/'
            },
            {
              name: 'Wikimedia Commons',
              type: 'Comics & Manga (PD / CC)',
              desc: 'Media repository hosting PD-Japan historical manga (Kitazawa Rakuten), NASA comics, and CC0 sequential art.',
              url: 'https://commons.wikimedia.org'
            },
            {
              name: 'Pepper & Carrot (David Revoy)',
              type: 'Comic / Webtoon (CC BY 4.0)',
              desc: 'Pioneering open-source fantasy webcomic created in Krita, fully redistributable with creator credit.',
              url: 'https://www.peppercarrot.com'
            },
            {
              name: 'Ubunchu! (Hiroshi Seo)',
              type: 'Manga (CC BY-NC 3.0)',
              desc: 'Official Japanese high-school sysadmin manga series released under Creative Commons Attribution-NonCommercial.',
              url: 'https://www.aerialline.com'
            },
            {
              name: 'xkcd (Randall Munroe)',
              type: 'Webcomic (CC BY-NC 2.5)',
              desc: 'Iconic math, sarcasm, and romance webcomic licensed for non-commercial distribution.',
              url: 'https://xkcd.com'
            },
            {
              name: 'LibriVox / Internet Archive',
              type: 'Books & Audiobooks (Public Domain)',
              desc: 'Volunteer-narrated public domain audio recordings and verified public domain texts.',
              url: 'https://librivox.org'
            },
            {
              name: 'DOAB & OAPEN',
              type: 'Open Access Books (Various CC)',
              desc: 'Directory of Open Access Books and academic monographs under Creative Commons licenses.',
              url: 'https://www.doabooks.org'
            }
          ].map((src, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-stone-900">{src.name}</span>
                <a href={src.url} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-stone-700">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                {src.type}
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">{src.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: APPROVED LINK-OUT-ONLY PLATFORMS */}
      <section className="space-y-6 pt-6 border-t border-stone-200">
        <div className="flex items-center gap-2 text-stone-900">
          <LinkIcon className="w-5 h-5 text-amber-700" />
          <h2 className="font-serif text-2xl font-semibold">
            2. Approved Link-Out Platforms (Never Hosted)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
          Per Non-Negotiable Legal Rule 2, official publisher promotional platforms and author-permitted archives that do not grant a general redistribution license are <strong>NEVER hosted, cached, or mirrored</strong> on wanna read?. We provide verified, legal direct links opening in a new browser tab.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Manga Library Z (マンガ図書館Z)',
              policy: 'Author Permission (No redistribution license)',
              desc: 'Founded by Ken Akamatsu for out-of-print titles. Permitted to read on their domain only. wanna read? links directly without hosting.',
              url: 'https://www.mangaz.com'
            },
            {
              name: 'MANGA MILLION / Shonen Jump+',
              policy: 'Publisher Promotional Campaign',
              desc: 'Official Shueisha time-limited free preview campaigns. Linking only; no scraping or proxying permitted.',
              url: 'https://shonenjumpplus.com'
            },
            {
              name: 'COMIC メテオ (Akita Shoten)',
              policy: 'Official Web Manga Portal',
              desc: 'Japanese publisher portal for official serialized web comics. Direct navigation link provided.',
              url: 'https://comic-meteor.jp'
            }
          ].map((src, i) => (
            <div key={i} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
              <span className="font-serif font-bold text-sm text-stone-900 block">{src.name}</span>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded inline-block">
                {src.policy}
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">{src.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: FORBIDDEN SOURCES BLOCKLIST */}
      <section className="space-y-6 pt-6 border-t border-stone-200">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertOctagon className="w-5 h-5" />
          <h2 className="font-serif text-2xl font-semibold">
            3. Strictly Forbidden Blocklist (Zero Tolerance)
          </h2>
        </div>
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2 leading-relaxed">
          <p className="font-bold">
            CRITICAL WARNING FOR CURATORS, AUDITORS, AND CONTRIBUTORS:
          </p>
          <p>
            wanna read? strictly prohibits scraping, mirroring, embedding, linking, or referencing scanlation aggregators, unauthorized translation groups, piracy mirrors, or direct download portals. Any work submitted from these domains is immediately rejected and permanently blacklisted.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            'MangaDex',
            'MangaFreak',
            'MangaKakalot',
            'Bato.to',
            'KissManga',
            'Unauthorized Scanlation Portals',
            'Torrent / DDL Manga Aggregators',
            'Pirated Ebook Locker Networks'
          ].map((site, i) => (
            <div key={i} className="p-3 rounded-lg bg-stone-100 border border-stone-300 font-mono text-stone-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>{site}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
