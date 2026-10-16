import { Bookmark, ReadingProgress, ReportItem, Work, ReaderSettings, LicenseAudit, TextHighlight, BannedUser } from '../types';
import { SEED_WORKS } from '../data/seedWorks';
import { INITIAL_AUDIT_LOGS } from '../data/auditLogs';

const STORAGE_KEYS = {
  WORKS: 'getnow_catalog_works_v10_verified_manga',
  PROGRESS: 'getnow_reading_progress_v6',
  FAVORITES: 'getnow_favorites_v6',
  BOOKMARKS: 'getnow_bookmarks_v6',
  HIGHLIGHTS: 'getnow_highlights_v1',
  REPORTS: 'getnow_reports_v6',
  SETTINGS: 'getnow_reader_settings_v6',
  AUDIT_LOGS: 'getnow_audit_logs_v6',
  JURISDICTION_PREF: 'getnow_jurisdiction_pref_v6',
  BANNED_USERS: 'getnow_banned_users_v1',
  DELETED_WORKS: 'getnow_deleted_works_v1',
  DELETED_USERS: 'getnow_deleted_users_v1'
};


export function getDeletedWorkIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_WORKS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markWorkAsDeleted(workId: string, slug?: string): void {
  try {
    const deleted = getDeletedWorkIds();
    if (workId) deleted.add(workId);
    if (slug) deleted.add(slug);
    safeSetLocalStorage(STORAGE_KEYS.DELETED_WORKS, JSON.stringify(Array.from(deleted)));
  } catch {}
}

export function clearDeletedWorks(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELETED_WORKS);
  } catch {}
}

export function getDeletedUserIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_USERS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markUserAsDeleted(userIdOrEmail: string): void {
  try {
    const deleted = getDeletedUserIds();
    if (userIdOrEmail) {
      const clean = userIdOrEmail.trim();
      deleted.add(clean.toLowerCase());
      deleted.add(clean);
    }
    safeSetLocalStorage(STORAGE_KEYS.DELETED_USERS, JSON.stringify(Array.from(deleted)));
  } catch {}
}

export function isRemovedWork(work: Work): boolean {
  if (!work) return true;
  const deleted = getDeletedWorkIds();
  if (deleted.has(work.id) || (work.slug && deleted.has(work.slug))) return true;
  return false;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.75,
  fontFamily: 'serif',
  theme: 'light',
  mode: 'scroll',
  maxWidth: 'normal',
  comicMode: 'single',
  fitMode: 'width',
  readingDirection: 'rtl',
  zoom: 100,
  lowBandwidth: false,
  incognito: false,
};

// ================= CHAPTER CONTENT STORAGE HELPERS =================

const memoryChapterCache = new Map<string, string>();

export function saveChapterContent(chapterId: string, content: string): void {
  if (!chapterId || !content) return;
  memoryChapterCache.set(chapterId, content);
  try {
    localStorage.setItem(`getnow_ch_txt_${chapterId}`, content);
  } catch (e) {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('getnow_ch_txt_') && k !== `getnow_ch_txt_${chapterId}`) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(`getnow_ch_txt_${chapterId}`, content);
    } catch (err) {
      console.warn(`LocalStorage quota exceeded for chapter ${chapterId}, keeping in-memory cache:`, err);
    }
  }
}

export function getChapterContent(chapterId: string): string | null {
  if (!chapterId) return null;
  if (memoryChapterCache.has(chapterId)) {
    return memoryChapterCache.get(chapterId) || null;
  }
  try {
    const fromStorage = localStorage.getItem(`getnow_ch_txt_${chapterId}`);
    if (fromStorage) {
      memoryChapterCache.set(chapterId, fromStorage);
      return fromStorage;
    }
    return null;
  } catch {
    return null;
  }
}

// ================= CATALOG / WORKS =================

export function getStoredWorks(): Work[] {
  try {
    // Purge legacy storage keys that may contain removed copyrighted works
    try {
      localStorage.removeItem('getnow_catalog_works_v9_verified_covers');
      localStorage.removeItem('getnow_catalog_works_v8_clean_reseed');
      localStorage.removeItem('getnow_catalog_works_v7_clean');
    } catch {}

    const deletedIds = getDeletedWorkIds();
    const raw = localStorage.getItem(STORAGE_KEYS.WORKS);
    if (!raw) {
      const initialWorks = SEED_WORKS.filter(s => !deletedIds.has(s.id) && !deletedIds.has(s.slug) && !isRemovedWork(s));
      saveStoredWorks(initialWorks);
      return initialWorks;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initialWorks = SEED_WORKS.filter(s => !deletedIds.has(s.id) && !deletedIds.has(s.slug) && !isRemovedWork(s));
      saveStoredWorks(initialWorks);
      return initialWorks;
    }

    // Available seed works exclude any deleted or banned works
    const availableSeedWorks = SEED_WORKS.filter(s => !deletedIds.has(s.id) && !deletedIds.has(s.slug) && !isRemovedWork(s));

    // Merge with available seed works.
    // If a work was in parsed, we retain and update it.
    // If it was NOT in parsed (e.g. deleted), we do NOT resurrect it!
    const merged: Work[] = [];
    const seenIds = new Set<string>();

    // First, process parsed works that are not deleted or banned
    parsed.forEach((p: Work) => {
      if (!p || !p.id) return;
      if (deletedIds.has(p.id) || (p.slug && deletedIds.has(p.slug)) || isRemovedWork(p)) return;

      const matchingSeed = availableSeedWorks.find(s => s.id === p.id || (s.slug && p.slug === s.slug));
      const rehydratedChapters = (p.chapters || []).map(ch => ({
        ...ch,
        content: ch.content || getChapterContent(ch.id) || ''
      }));

      if (matchingSeed) {
        merged.push({
          ...p,
          ...matchingSeed,
          chapters: matchingSeed.chapters?.length ? matchingSeed.chapters : rehydratedChapters
        });
      } else {
        merged.push({
          ...p,
          chapters: rehydratedChapters
        });
      }
      seenIds.add(p.id);
      if (p.slug) seenIds.add(p.slug);
    });

    // If this is a pristine/first-time state where parsed only had some items, add untouched seed works
    availableSeedWorks.forEach(seed => {
      if (!seenIds.has(seed.id) && (!seed.slug || !seenIds.has(seed.slug)) && !deletedIds.has(seed.id) && (!seed.slug || !deletedIds.has(seed.slug))) {
        // Only if seed was never explicitly deleted
        merged.push(seed);
        seenIds.add(seed.id);
      }
    });

    const cleaned = merged.filter(w => !deletedIds.has(w.id) && (!w.slug || !deletedIds.has(w.slug)) && !isRemovedWork(w));
    return cleaned;
  } catch (err) {
    console.error('Failed to load works from localStorage', err);
    const deletedIds = getDeletedWorkIds();
    return SEED_WORKS.filter(s => !deletedIds.has(s.id) && (!s.slug || !deletedIds.has(s.slug)) && !isRemovedWork(s));
  }
}

export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      // Clear legacy/cached keys to reclaim quota
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('getnow_ch_txt_') ||
           k.startsWith('getnow_reading_progress_v') ||
           k.includes('_v4') ||
           k.includes('_v5') ||
           k.includes('_v7') ||
           k.includes('_v8') ||
           k.includes('_v9'))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });

      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export function saveStoredWorks(works: Work[]): void {
  try {
    // 1. For each work, strip heavy contents, huge base64 images, and pages from localStorage copy
    const lightweightWorks = works.map(w => {
      const isSeed = SEED_WORKS.some(s => s.id === w.id);
      const lightweightChapters = (w.chapters || []).map(ch => {
        if (ch.content && ch.content.length > 500) {
          saveChapterContent(ch.id, ch.content);
        }
        // Never store heavy manga/comic pages or huge texts inside the main catalog JSON
        return {
          ...ch,
          content: isSeed ? ch.content : '',
          pages: []
        };
      });

      // Avoid storing massive base64 data URLs in localStorage (preserve them in state / server)
      const isHeavyCover = Boolean(w.coverImage && w.coverImage.startsWith('data:') && w.coverImage.length > 40000);

      return {
        ...w,
        coverImage: isHeavyCover ? '' : w.coverImage,
        coverImageUrl: isHeavyCover ? '' : w.coverImageUrl,
        chapters: lightweightChapters
      };
    });

    // 2. Save lightweight catalog to localStorage safely
    const payload = JSON.stringify(lightweightWorks);
    if (!safeSetLocalStorage(STORAGE_KEYS.WORKS, payload)) {
      // Fallback: Save only non-Gutenberg user works or seeds to stay within quota
      const minimalWorks = lightweightWorks.filter(w => !w.id.startsWith('work-gut-'));
      if (!safeSetLocalStorage(STORAGE_KEYS.WORKS, JSON.stringify(minimalWorks))) {
        safeSetLocalStorage(STORAGE_KEYS.WORKS, JSON.stringify(SEED_WORKS));
      }
    }
  } catch {
    // Graceful fallback without throwing unhandled quota error
  }
}

export function resetWorksToSeed(): Work[] {
  clearDeletedWorks();
  saveStoredWorks(SEED_WORKS);
  saveStoredAudits(INITIAL_AUDIT_LOGS);
  return SEED_WORKS;
}

// ================= AUDIT LOGS =================

export function getStoredAudits(): LicenseAudit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      saveStoredAudits(INITIAL_AUDIT_LOGS);
      return INITIAL_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveStoredAudits(audits: LicenseAudit[]): void {
  try {
    safeSetLocalStorage(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(audits));
  } catch {}
}

export function logLicenseAudit(audit: Omit<LicenseAudit, 'id' | 'verifiedAt'>): LicenseAudit {
  const current = getStoredAudits();
  const newAudit: LicenseAudit = {
    ...audit,
    id: 'audit-' + Date.now(),
    verifiedAt: new Date().toISOString()
  };
  const next = [newAudit, ...current];
  saveStoredAudits(next);
  return newAudit;
}

// ================= READING PROGRESS =================

export function getProgressStorageKey(userId?: string): string {
  return userId ? `getnow_reading_progress_usr_${userId}` : STORAGE_KEYS.PROGRESS;
}

export function getStoredProgress(userId?: string): Record<string, ReadingProgress> {
  try {
    const key = getProgressStorageKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ReadingProgress, incognito: boolean = false, userId?: string): void {
  if (incognito) return; // Incognito toggle prevents local storage recording
  try {
    const all = getStoredProgress(userId);
    // Sanitize progress record: avoid storing multi-megabyte data URLs in progress cache
    const cleanCover = progress.coverImage?.startsWith('data:') && progress.coverImage.length > 2000
      ? ''
      : (progress.coverImage || '');

    all[progress.workId] = {
      ...progress,
      coverImage: cleanCover,
      lastReadAt: new Date().toISOString()
    };
    const key = getProgressStorageKey(userId);
    safeSetLocalStorage(key, JSON.stringify(all));
  } catch {}
}

export function saveAllProgress(progressMap: Record<string, ReadingProgress>, userId?: string): void {
  try {
    const cleanMap: Record<string, ReadingProgress> = {};
    for (const [workId, prog] of Object.entries(progressMap || {})) {
      cleanMap[workId] = {
        ...prog,
        coverImage: prog.coverImage?.startsWith('data:') && prog.coverImage.length > 2000 ? '' : (prog.coverImage || '')
      };
    }
    const key = getProgressStorageKey(userId);
    safeSetLocalStorage(key, JSON.stringify(cleanMap));
  } catch {}
}

export function clearStoredProgress(userId?: string): void {
  try {
    if (userId) {
      localStorage.removeItem(getProgressStorageKey(userId));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      try {
        localStorage.removeItem('getnow_reading_progress_guest');
      } catch {}
    }
  } catch (err) {
    console.error('Failed to clear stored progress', err);
  }
}

export function clearAllStoredProgress(userId?: string): void {
  try {
    if (userId) {
      localStorage.removeItem(getProgressStorageKey(userId));
    }
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    try {
      localStorage.removeItem('getnow_reading_progress_guest');
      localStorage.removeItem('getnow_reading_progress_v5');
      localStorage.removeItem('getnow_reading_progress_v4');
    } catch {}
  } catch (err) {
    console.error('Failed to clear all stored progress', err);
  }
}

// ================= FAVORITES =================

export function getStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(workId: string): string[] {
  const current = getStoredFavorites();
  const next = current.includes(workId)
    ? current.filter(id => id !== workId)
    : [...current, workId];
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to toggle favorite', err);
  }
  return next;
}

// ================= BOOKMARKS =================

export function getStoredBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark[] {
  const current = getStoredBookmarks();
  const newBookmark: Bookmark = {
    ...bookmark,
    id: 'bm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString()
  };
  const next = [newBookmark, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to save bookmark', err);
  }
  return next;
}

export function removeBookmark(id: string): Bookmark[] {
  const current = getStoredBookmarks();
  const next = current.filter(b => b.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to remove bookmark', err);
  }
  return next;
}

// ================= REPORTS =================

export function getStoredReports(): ReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function submitReport(report: Omit<ReportItem, 'id' | 'submittedAt' | 'status'>): ReportItem {
  const current = getStoredReports();
  const newReport: ReportItem = {
    ...report,
    id: 'rep-' + Date.now(),
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };
  const next = [newReport, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to submit report', err);
  }
  return newReport;
}

// ================= SETTINGS =================

export function getStoredReaderSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_READER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_READER_SETTINGS;
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export function saveReaderSettings(settings: Partial<ReaderSettings>): ReaderSettings {
  try {
    const current = getStoredReaderSettings();
    const next = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
    return next;
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

// ================= TEXT HIGHLIGHTS & MARGIN NOTES =================

export function getStoredHighlights(workId?: string): TextHighlight[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HIGHLIGHTS);
    if (!raw) return [];
    const list: TextHighlight[] = JSON.parse(raw);
    if (workId) {
      return list.filter(h => h.workId === workId);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveStoredHighlight(highlight: TextHighlight): TextHighlight[] {
  const current = getStoredHighlights();
  const existingIdx = current.findIndex(h => h.id === highlight.id);
  let next: TextHighlight[];
  if (existingIdx >= 0) {
    next = [...current];
    next[existingIdx] = highlight;
  } else {
    next = [highlight, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to save highlight', err);
  }
  return next;
}

export function deleteStoredHighlight(id: string): TextHighlight[] {
  const current = getStoredHighlights();
  const next = current.filter(h => h.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to delete highlight', err);
  }
  return next;
}

export function updateStoredHighlightNote(id: string, note: string): TextHighlight[] {
  const current = getStoredHighlights();
  const next = current.map(h => (h.id === id ? { ...h, note } : h));
  try {
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to update highlight note', err);
  }
  return next;
}

// ================= BANNED CREATORS / MODERATION =================

export function getStoredBannedUsers(): BannedUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BANNED_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredBannedUsers(banned: BannedUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANNED_USERS, JSON.stringify(banned));
  } catch (err) {
    console.error('Failed to save banned users', err);
  }
}


