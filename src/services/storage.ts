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
  BANNED_USERS: 'getnow_banned_users_v1'
};

const BANNED_WORK_IDS = new Set([
  'work-dune',
  'dune',
  'work-solo-leveling',
  'solo-leveling',
  'work-one-piece',
  'one-piece',
  'work-linkout-mangaz',
  'work-linkout-jump',
  'work-linkout-meteor'
]);

export function isRemovedWork(work: Work): boolean {
  if (BANNED_WORK_IDS.has(work.id) || BANNED_WORK_IDS.has(work.slug)) return true;
  const titleLower = (work.title || '').toLowerCase().trim();
  if (titleLower === 'dune' || titleLower === 'solo leveling' || titleLower === 'one piece') return true;
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
    // If individual chapter save fails due to localStorage quota limit, memory cache preserves it
    console.warn(`LocalStorage quota exceeded for chapter ${chapterId}, keeping in-memory session cache:`, e);
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

    const raw = localStorage.getItem(STORAGE_KEYS.WORKS);
    if (!raw) {
      saveStoredWorks(SEED_WORKS);
      return SEED_WORKS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveStoredWorks(SEED_WORKS);
      return SEED_WORKS;
    }
    // Merge with SEED_WORKS to ensure latest cover images and chapters are up to date
    const merged = SEED_WORKS.map(seed => {
      const existing = parsed.find((p: Work) => p.id === seed.id || p.slug === seed.slug);
      if (!existing) return seed;
      return {
        ...existing,
        ...seed,
        chapters: seed.chapters?.length ? seed.chapters : existing.chapters
      };
    });
    // Also include any user-created or dynamically ingested works, excluding banned/removed works
    parsed.forEach((p: Work) => {
      if (!merged.some(m => m.id === p.id) && !isRemovedWork(p)) {
        // Re-hydrate chapter content if stripped
        const rehydratedChapters = (p.chapters || []).map(ch => ({
          ...ch,
          content: ch.content || getChapterContent(ch.id) || ''
        }));
        merged.push({
          ...p,
          chapters: rehydratedChapters
        });
      }
    });
    const cleaned = merged.filter(w => !isRemovedWork(w));
    return cleaned;
  } catch (err) {
    console.error('Failed to load works from localStorage', err);
    return SEED_WORKS;
  }
}

export function saveStoredWorks(works: Work[]): void {
  try {
    // 1. For each work, store heavy chapter content separately in localStorage
    const lightweightWorks = works.map(w => {
      const isSeed = SEED_WORKS.some(s => s.id === w.id);
      const lightweightChapters = (w.chapters || []).map(ch => {
        if (ch.content && ch.content.length > 500) {
          saveChapterContent(ch.id, ch.content);
        }
        // If it's not a seed work (e.g. dynamically ingested Gutenberg work), don't embed huge text inside main catalog JSON
        return {
          ...ch,
          content: isSeed ? ch.content : ''
        };
      });

      return {
        ...w,
        chapters: lightweightChapters
      };
    });

    // 2. Save lightweight catalog to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(lightweightWorks));
    } catch (quotaError) {
      console.warn('LocalStorage quota exceeded on main catalog, saving minimal seed catalog fallback:', quotaError);
      // Fallback: Save only non-Gutenberg user works or seeds to avoid breaking localStorage
      const minimalWorks = lightweightWorks.filter(w => !w.id.startsWith('work-gut-'));
      localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(minimalWorks));
    }
  } catch (err) {
    console.error('Failed to save works to localStorage', err);
  }
}

export function resetWorksToSeed(): Work[] {
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
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(audits));
  } catch (err) {
    console.error('Failed to save audit logs to localStorage', err);
  }
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
    all[progress.workId] = {
      ...progress,
      lastReadAt: new Date().toISOString()
    };
    const key = getProgressStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save reading progress', err);
  }
}

export function saveAllProgress(progressMap: Record<string, ReadingProgress>, userId?: string): void {
  try {
    const key = getProgressStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(progressMap));
  } catch (err) {
    console.error('Failed to save progress map', err);
  }
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


