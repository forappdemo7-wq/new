export const GHOST_COVER_PALETTES = ['#C25E3A', '#3A68C2', '#3AC285', '#853AC2', '#C23A85', '#3AC2C2'];

export interface CoverReport {
  id: string;
  workId: string;
  workTitle: string;
  reason: string;
  reportedBy: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export function generateGhostCoverSvg(
  title: string,
  author: string,
  type: string,
  year?: number,
  palette?: string
): string {
  const bg = palette || '#C25E3A';
  const cleanTitle = title || 'Untitled';
  const cleanAuthor = author || 'Unknown Author';
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="45%" font-size="28" font-family="serif" font-weight="bold" fill="white" text-anchor="middle">${encodeURIComponent(cleanTitle)}</text><text x="50%" y="55%" font-size="16" font-family="sans-serif" fill="white" opacity="0.8" text-anchor="middle">${encodeURIComponent(cleanAuthor)}</text></svg>`;
}

export function getOpenLibraryCoverUrl(isbn?: string, olid?: string, size: 'S' | 'M' | 'L' = 'L'): string {
  if (isbn) {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').trim();
    if (cleanIsbn) {
      return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-${size}.jpg`;
    }
  }
  if (olid) {
    const cleanOlid = olid.trim();
    if (cleanOlid) {
      return `https://covers.openlibrary.org/b/olid/${cleanOlid}-${size}.jpg`;
    }
  }
  return '';
}

export async function autoFetchCoverForWork(work: any): Promise<string> {
  if (!work) return '';
  if (work.isbn) {
    const url = getOpenLibraryCoverUrl(work.isbn, undefined, 'L');
    if (url) return url;
  }
  if (work.olid) {
    const url = getOpenLibraryCoverUrl(undefined, work.olid, 'L');
    if (url) return url;
  }
  return generateGhostCoverSvg(work.title, work.author, work.type);
}

export function isCoverLegallyPublishable(license?: string): boolean {
  if (!license) return true;
  const l = license.toLowerCase();
  if (l.includes('public_domain') || l.includes('creative_commons') || l.includes('cc0') || l.includes('gutenberg') || l.includes('permissive')) {
    return true;
  }
  return true;
}

export function getStoredCoverReports(): CoverReport[] {
  try {
    const raw = localStorage.getItem('getnow_cover_reports');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export function resolveCoverReport(reportId: string, status: 'resolved' | 'dismissed' = 'resolved'): void {
  try {
    const reports = getStoredCoverReports();
    const updated = reports.map(r => r.id === reportId ? { ...r, status } : r);
    localStorage.setItem('getnow_cover_reports', JSON.stringify(updated));
  } catch {}
}

export function saveCoverReport(report: Omit<CoverReport, 'id' | 'timestamp' | 'status'>): void {
  try {
    const reports = getStoredCoverReports();
    const newReport: CoverReport = {
      ...report,
      id: 'rep-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    reports.unshift(newReport);
    localStorage.setItem('getnow_cover_reports', JSON.stringify(reports));
  } catch {}
}
