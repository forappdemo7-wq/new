import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { ArrowLeft, Copy, Check, Download, Rss, ExternalLink } from 'lucide-react';
import { Work } from '../types';

export const OpdsFeedPage: React.FC = () => {
  const { navigate } = useRouter();
  const { works } = useLibrary();
  const [copied, setCopied] = useState(false);

  const [feedFormat, setFeedFormat] = useState<'opds1' | 'opds2'>('opds1');

  // Generate OPDS 2.0 JSON Feed
  const opdsJson = JSON.stringify(
    {
      metadata: {
        title: 'wanna read? Open Reading Library',
        subtitle: 'Ad-Free Openly Licensed Books, Comics, and Manga',
        identifier: 'urn:uuid:wannaread-library-opds-catalog',
        updated: new Date().toISOString(),
        author: {
          name: 'wanna read? Curatorial Collective',
          uri: 'https://wannaread.library'
        }
      },
      links: [
        { rel: 'self', href: '/api/opds/v2/catalog.json', type: 'application/opds+json' }
      ],
      publications: works.filter((w) => w.isHosted).map((w) => ({
        metadata: {
          '@type': 'http://schema.org/Book',
          title: w.title,
          identifier: `urn:getnow:work:${w.id}`,
          author: w.authors?.map((a: any) => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ') || 'Unknown',
          language: w.language,
          published: String(w.originalPublicationYear),
          description: w.description || '',
          rights: `${w.licenseCode || ''} - ${w.attribution || ''}`
        },
        images: [
          { href: w.coverImage, type: 'image/jpeg' }
        ],
        links: [
          { href: `/read/${w.id}/${w.chapters?.[0]?.id || '1'}`, type: 'text/html', rel: 'http://opds-spec.org/acquisition' }
        ]
      }))
    },
    null,
    2
  );
  // Generate OPDS 1.2 Atom Feed XML
  const opdsXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:dc="http://purl.org/dc/terms/"
      xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:uuid:wannaread-library-opds-catalog</id>
  <title>wanna read? Open Reading Library</title>
  <subtitle>Ad-Free Openly Licensed Books, Comics, and Manga</subtitle>
  <updated>${new Date().toISOString()}</updated>
  <author>
    <name>wanna read? Curatorial Collective</name>
    <uri>https://wannaread.library</uri>
  </author>
  <link rel="self" href="/opds" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
  <link rel="start" href="/opds" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>

${works
  .filter((w: Work) => w.isHosted)
  .map(
    (w: Work) => `  <entry>
    <title>${w.title}</title>
    <id>urn:wannaread:work:${w.id}</id>
    <updated>${w.updatedAt || new Date().toISOString()}</updated>
    <author>
      <name>${w.authors?.map((a: any) => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ') || 'Unknown'}</name>
    </author>
    <dc:language>${w.language}</dc:language>
    <dc:issued>${w.originalPublicationYear}</dc:issued>
    <summary>${(w.description || '').replace(/[&<>'"]/g, '')}</summary>
    <link rel="http://opds-spec.org/image" href="${w.coverImage}" type="image/jpeg"/>
    <link rel="http://opds-spec.org/image/thumbnail" href="${w.coverImage}" type="image/jpeg"/>
    <link rel="http://opds-spec.org/acquisition" href="/read/${w.id}/${w.chapters?.[0]?.id || '1'}" type="text/html"/>
    <category term="${(w.genres && w.genres[0]) || 'General'}" label="${(w.genres && w.genres[0]) || 'General'}"/>
    <dc:rights>${w.licenseCode || ''} - ${(w.attribution || '').replace(/[&<>'"]/g, '')}</dc:rights>
  </entry>`
  )
  .join('\n\n')}
</feed>`;

  const handleCopyUrl = () => {
    const fullUrl = window.location.origin + '/opds';
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadXml = () => {
    const blob = new Blob([opdsXml], { type: 'application/atom+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'getnow-opds-feed.atom';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 transition-colors duration-150">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-amber-900">
          <Rss className="w-4 h-4 text-amber-700" />
          <span>Syndication &amp; Reader App Integration</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
          OPDS 1.2 Open Catalog Feed
        </h1>
        <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
          Open Publication Distribution System (OPDS) is an open industry standard that allows e-readers, tablets, and comic reader apps to subscribe and read wanna read? titles directly.
        </p>
      </div>

      {/* Integration Card */}
      <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-semibold text-stone-900">
          Connect Your Favorite Reader App
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Compatible with <strong>KOReader</strong>, <strong>Moon+ Reader</strong>, <strong>Tachiyomi / Mihon</strong>, <strong>Marvin</strong>, <strong>FBReader</strong>, and <strong>Calibre</strong>. Copy your feed endpoint below:
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            readOnly
            value={window.location.origin + '/opds'}
            className="flex-1 p-2.5 bg-stone-50 rounded border border-stone-300 font-mono text-xs text-stone-800 select-all"
          />
          <button
            onClick={handleCopyUrl}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Feed URL!' : 'Copy Feed URL'}</span>
          </button>
          <button
            onClick={handleDownloadXml}
            className="px-4 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Download XML</span>
          </button>
        </div>
      </div>

      {/* Live Feed Output */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedFormat('opds1')}
              className={`px-3 py-1.5 rounded text-xs font-semibold font-mono transition-all ${
                feedFormat === 'opds1'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              OPDS 1.2 (Atom XML)
            </button>
            <button
              onClick={() => setFeedFormat('opds2')}
              className={`px-3 py-1.5 rounded text-xs font-semibold font-mono transition-all ${
                feedFormat === 'opds2'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              OPDS 2.0 (JSON-LD)
            </button>
          </div>

          <span className="text-xs font-mono text-stone-500">
            {works.filter((w) => w.isHosted).length} Hosted Titles
          </span>
        </div>

        <pre className="p-4 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed select-all">
          {feedFormat === 'opds1' ? opdsXml : opdsJson}
        </pre>
      </div>
    </div>
  );
};
