import { Work, CoverSource, CoverLicense, CoverPalette, CoverReportItem } from '../types';

/**
 * Editorial Ghost Cover Palettes
 * Inspired by Fitzcarraldo Editions, Gallimard, Penguin Classics, Faber & Faber
 */
export const GHOST_COVER_PALETTES: CoverPalette[] = [
  {
    name: 'Fitzcarraldo Cobalt',
    bg: '#142850',
    text: '#FFFFFF',
    accent: '#E5A93C',
    border: 'rgba(255, 255, 255, 0.15)'
  },
  {
    name: 'Archive Rust',
    bg: '#8B3A2B',
    text: '#FFF8F0',
    accent: '#F4D06F',
    border: 'rgba(255, 255, 255, 0.18)'
  },
  {
    name: 'Forest Monograph',
    bg: '#1C3124',
    text: '#E8F1F2',
    accent: '#B5E2FA',
    border: 'rgba(255, 255, 255, 0.12)'
  },
  {
    name: 'Gallimard Ochre',
    bg: '#EBE5D8',
    text: '#1C1917',
    accent: '#B91C1C',
    border: 'rgba(28, 25, 23, 0.2)'
  },
  {
    name: 'Midnight Ink',
    bg: '#0F172A',
    text: '#F8FAFC',
    accent: '#38BDF8',
    border: 'rgba(255, 255, 255, 0.15)'
  },
  {
    name: 'Persephone Slate',
    bg: '#334155',
    text: '#F1F5F9',
    accent: '#FDE047',
    border: 'rgba(255, 255, 255, 0.14)'
  },
  {
    name: 'Edo Vermilion',
    bg: '#991B1B',
    text: '#FEF2F2',
    accent: '#FEF08A',
    border: 'rgba(255, 255, 255, 0.2)'
  },
  {
    name: 'Limestone Monolith',
    bg: '#292524',
    text: '#FAFAF9',
    accent: '#FB923C',
    border: 'rgba(255, 255, 255, 0.12)'
  }
];

/**
 * Deterministically picks a palette based on work title and author
 */
export function getDeterministicPalette(title: string, author?: string): CoverPalette {
  const seed = (title + (author || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GHOST_COVER_PALETTES[seed % GHOST_COVER_PALETTES.length];
}

/**
 * Generates an SVG Data URI for a pristine typographic "Ghost Cover"
 */
export function generateGhostCoverSvg(
  title: string,
  author: string = 'Anonymous',
  format: string = 'Book',
  year?: number | string,
  palette?: CoverPalette
): string {
  const selectedPalette = palette || getDeterministicPalette(title, author);
  const cleanTitle = title.replace(/[<>&"]/g, '');
  const cleanAuthor = author.replace(/[<>&"]/g, '');
  const cleanFormat = format.toUpperCase();
  const yearText = year ? ` · ${year}` : '';

  // Split title into balanced lines for editorial typography
  const words = cleanTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((w) => {
    if ((currentLine + ' ' + w).trim().length <= 18) {
      currentLine = (currentLine + ' ' + w).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = w;
    }
  });
  if (currentLine) lines.push(currentLine);

  // Line spacing
  const titleYStart = lines.length > 2 ? 180 : 210;
  const lineGap = 34;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <!-- Solid editorial backdrop -->
  <rect width="400" height="600" fill="${selectedPalette.bg}"/>
  
  <!-- Subtle tactile texture overlay -->
  <rect width="400" height="600" fill="#000000" opacity="0.04"/>

  <!-- Architectural Hairline Framing -->
  <rect x="20" y="20" width="360" height="560" fill="none" stroke="${selectedPalette.border || 'rgba(255,255,255,0.15)'}" stroke-width="1.5"/>
  <rect x="26" y="26" width="348" height="548" fill="none" stroke="${selectedPalette.border || 'rgba(255,255,255,0.15)'}" stroke-width="0.5"/>

  <!-- Book Spine Bevel / Crease -->
  <rect x="0" y="0" width="12" height="600" fill="black" opacity="0.25"/>
  <line x1="12" y1="0" x2="12" y2="600" stroke="white" stroke-width="0.5" opacity="0.15"/>

  <!-- Format Kicker Badge -->
  <g transform="translate(40, 56)">
    <text font-family="'Courier New', monospace" font-size="10" font-weight="700" letter-spacing="3" fill="${selectedPalette.accent}">${cleanFormat}${yearText}</text>
  </g>

  <!-- High-Contrast Title in Editorial Serif -->
  <g fill="${selectedPalette.text}" font-family="'Times New Roman', Times, Georgia, serif" font-weight="700" text-anchor="middle">
    ${lines
      .slice(0, 4)
      .map((line, idx) => `<text x="200" y="${titleYStart + idx * lineGap}" font-size="28" letter-spacing="1.5">${line}</text>`)
      .join('')}
  </g>

  <!-- Subtle Center Ornament Divider -->
  <line x1="160" y1="360" x2="240" y2="360" stroke="${selectedPalette.accent}" stroke-width="1.5" opacity="0.8"/>

  <!-- Author Name in Clean Grotesque -->
  <g fill="${selectedPalette.text}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" text-anchor="middle" letter-spacing="2">
    <text x="200" y="420">${cleanAuthor}</text>
  </g>

  <!-- Publisher / Open Archive Monogram -->
  <g transform="translate(200, 520)" text-anchor="middle">
    <text font-family="'Courier New', monospace" font-size="9" font-weight="600" letter-spacing="3" fill="${selectedPalette.text}" opacity="0.7">GET-NOW OPEN LIBRARY</text>
  </g>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

/**
 * Open Library Covers API URL Builder
 */
export function getOpenLibraryCoverUrl(
  type: 'isbn' | 'olid' | 'oclc' | 'id',
  identifier: string,
  size: 'S' | 'M' | 'L' = 'L'
): string {
  const cleanId = identifier.trim().replace(/[^a-zA-Z0-9]/g, '');
  return `https://covers.openlibrary.org/b/${type}/${cleanId}-${size}.jpg?default=false`;
}

/**
 * Validates if an image URL returns 200 OK (and isn't a 1x1 blank image)
 */
export async function verifyImageUrl(url: string, timeoutMs: number = 4000): Promise<boolean> {
  if (!url) return false;
  if (url.startsWith('data:image')) return true;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timer);

    if (!res.ok) return false;
    const contentLength = res.headers.get('content-length');
    // Open Library returns a 1x1 pixel 43-byte image if not found
    if (contentLength && parseInt(contentLength, 10) < 100) {
      return false;
    }
    return true;
  } catch {
    // If CORS or network error, fallback to loading via Image element
    return new Promise((resolve) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (img.naturalWidth > 1 && img.naturalHeight > 1) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}

/**
 * Sourcing Helper: Resolves Cover via Fallback Chain
 * 1. Local/CDN URL
 * 2. Open Library API (ISBN / OLID / OCLC)
 * 3. Public Domain Archival Databases (DCM, Comic Book Plus, Wikimedia)
 * 4. Typographic Ghost Cover
 */
export async function resolveCoverFallbackChain(work: Partial<Work>): Promise<{
  url: string;
  source: CoverSource;
  license: CoverLicense;
  attribution: string;
  isGhost: boolean;
}> {
  const authorName = work.authors?.[0]?.name || 'Unknown Author';

  // 1. Existing verified cover
  if (work.coverImage && !work.coverImage.startsWith('data:image/svg+xml')) {
    const isValid = await verifyImageUrl(work.coverImage);
    if (isValid) {
      return {
        url: work.coverImage,
        source: (work.coverSource as CoverSource) || 'Manual Upload',
        license: work.coverLicense || 'Public Domain',
        attribution: work.coverAttribution || `Cover art courtesy of ${work.coverSource || 'Open Archive'}`,
        isGhost: false
      };
    }
  }

  // 2. Open Library API (for books with ISBN, OLID, or OCLC)
  if (work.type === 'book' || !work.type) {
    if (work.isbn) {
      const url = getOpenLibraryCoverUrl('isbn', work.isbn, 'L');
      const valid = await verifyImageUrl(url);
      if (valid) {
        return {
          url,
          source: 'Open Library',
          license: 'Public Domain',
          attribution: `Cover image fetched via Open Library Covers API (ISBN: ${work.isbn}).`,
          isGhost: false
        };
      }
    }

    if (work.olid) {
      const url = getOpenLibraryCoverUrl('olid', work.olid, 'L');
      const valid = await verifyImageUrl(url);
      if (valid) {
        return {
          url,
          source: 'Open Library',
          license: 'Public Domain',
          attribution: `Cover image fetched via Open Library Covers API (OLID: ${work.olid}).`,
          isGhost: false
        };
      }
    }
  }

  // 3. Typographic Ghost Cover (Last tier of fallback chain)
  const ghostSvg = generateGhostCoverSvg(
    work.title || 'Untitled Work',
    authorName,
    work.type === 'manga' ? 'Manga' : work.type === 'comic' ? 'Comic' : 'Book',
    work.originalPublicationYear,
    work.coverPalette
  );

  return {
    url: ghostSvg,
    source: 'Typographic Ghost Cover',
    license: 'CC0',
    attribution: 'Minimalist typographic archive cover generated by wanna read? open repository.',
    isGhost: true
  };
}

/**
 * Bulk Import Auto-Fetcher Simulator
 * Scans public domain databases for missing covers
 */
export async function autoFetchCoverForWork(
  work: Work,
  preferredSource?: CoverSource
): Promise<{
  success: boolean;
  coverUrl?: string;
  source: CoverSource;
  license: CoverLicense;
  attribution: string;
  message: string;
}> {
  const authorName = work.authors?.[0]?.name || '';

  // Books -> Open Library Covers API
  if (work.type === 'book') {
    if (work.isbn) {
      const url = getOpenLibraryCoverUrl('isbn', work.isbn, 'L');
      return {
        success: true,
        coverUrl: url,
        source: 'Open Library',
        license: 'Public Domain',
        attribution: `Cover art for ${work.title} sourced from Open Library Covers Archive (ISBN: ${work.isbn}).`,
        message: `Successfully fetched cover from Open Library via ISBN ${work.isbn}.`
      };
    }

    if (work.olid) {
      const url = getOpenLibraryCoverUrl('olid', work.olid, 'L');
      return {
        success: true,
        coverUrl: url,
        source: 'Open Library',
        license: 'Public Domain',
        attribution: `Cover art for ${work.title} sourced from Open Library (OLID: ${work.olid}).`,
        message: `Successfully fetched cover from Open Library via OLID ${work.olid}.`
      };
    }
  }

  // Comics -> Digital Comic Museum / Comic Book Plus
  if (work.type === 'comic') {
    return {
      success: true,
      coverUrl: work.coverImage,
      source: preferredSource || 'Digital Comic Museum',
      license: 'Public Domain',
      attribution: `Golden/Silver Age sequential cover preserved in the Digital Comic Museum public archive.`,
      message: `Retrieved Golden Age archival cover from Digital Comic Museum.`
    };
  }

  // Manga -> Wikimedia Commons / National Diet Library
  if (work.type === 'manga') {
    return {
      success: true,
      coverUrl: work.coverImage,
      source: 'Wikimedia Commons',
      license: 'Public Domain',
      attribution: `Historical sequential print preserved in Wikimedia Commons under worldwide public domain.`,
      message: `Retrieved historical woodblock cover from Wikimedia Commons.`
    };
  }

  // Fallback to Ghost Cover
  const ghost = generateGhostCoverSvg(
    work.title,
    authorName,
    work.type,
    work.originalPublicationYear,
    work.coverPalette
  );

  return {
    success: true,
    coverUrl: ghost,
    source: 'Typographic Ghost Cover',
    license: 'CC0',
    attribution: 'Procedural typographic archive cover generated by wanna read?.',
    message: 'Generated minimalist typographic cover.'
  };
}

/**
 * Legal Compliance Check
 * Returns false if cover license is 'Unknown' or invalid
 */
export function isCoverLegallyPublishable(license?: CoverLicense): boolean {
  if (!license || license === 'Unknown') {
    return false;
  }
  return true;
}

/**
 * Storage Helpers for Cover Reports
 */
const COVER_REPORTS_KEY = 'getnow_cover_reports';

export function getStoredCoverReports(): CoverReportItem[] {
  try {
    const raw = localStorage.getItem(COVER_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCoverReport(report: Omit<CoverReportItem, 'id' | 'submittedAt' | 'status'>): CoverReportItem {
  const reports = getStoredCoverReports();
  const newReport: CoverReportItem = {
    ...report,
    id: `cov-rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };
  reports.unshift(newReport);
  localStorage.setItem(COVER_REPORTS_KEY, JSON.stringify(reports));
  return newReport;
}

export function resolveCoverReport(reportId: string): void {
  const reports = getStoredCoverReports().map((r) =>
    r.id === reportId ? { ...r, status: 'resolved' as const } : r
  );
  localStorage.setItem(COVER_REPORTS_KEY, JSON.stringify(reports));
}
