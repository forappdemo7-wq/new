import { Work, ReaderSettings, Bookmark, ReadingProgress, ReportItem, LicenseAudit, BannedUser } from '../types';
import { SEED_WORKS } from '../data/communityWorks';

export const STORAGE_KEYS = {
  WORKS: 'getnow_catalog_works_v10',
  DELETED_WORKS: 'getnow_deleted_works_v1',
  DELETED_USERS: 'getnow_deleted_users_v1',
  PROGRESS: 'getnow_reading_progress_v1',
  FAVORITES: 'getnow_favorites_v1',
  BOOKMARKS: 'getnow_bookmarks_v1',
  READER_SETTINGS: 'getnow_reader_settings_v1',
  REPORTS: 'getnow_reports_v1',
  AUDITS: 'getnow_audits_v1',
  BANNED_USERS: 'getnow_banned_users_v1',
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

export function isRemovedWork(work: Work): boolean {
  if (!work) return true;
  const deleted = getDeletedWorkIds();
  return deleted.has(work.id) || (Boolean(work.slug) && deleted.has(work.slug));
}

export function getStoredWorks(): Work[] {
  try {
    const deletedIds = getDeletedWorkIds();
    const raw = localStorage.getItem(STORAGE_KEYS.WORKS);
    if (!raw) {
      const initial = SEED_WORKS.filter((s) => !deletedIds.has(s.id) && !isRemovedWork(s));
      saveStoredWorks(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = SEED_WORKS.filter((s) => !deletedIds.has(s.id) && !isRemovedWork(s));
      saveStoredWorks(initial);
      return initial;
    }
    return parsed.filter((w: Work) => !isRemovedWork(w));
  } catch {
    return SEED_WORKS;
  }
}

export function saveStoredWorks(works: Work[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(works));
  } catch {}
}

export function resetWorksToSeed(): Work[] {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELETED_WORKS);
    localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(SEED_WORKS));
    return SEED_WORKS;
  } catch {
    return SEED_WORKS;
  }
}

export function markWorkAsDeleted(workId: string): void {
  try {
    const deleted = getDeletedWorkIds();
    deleted.add(workId);
    localStorage.setItem(STORAGE_KEYS.DELETED_WORKS, JSON.stringify(Array.from(deleted)));
  } catch {}
}

export function clearDeletedWorks(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELETED_WORKS);
  } catch {}
}

export function getStoredProgress(): Record<string, ReadingProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(workId: string, progress: ReadingProgress): void {
  try {
    const all = getStoredProgress();
    all[workId] = progress;
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  } catch {}
}

export function saveAllProgress(progressMap: Record<string, ReadingProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressMap));
  } catch {}
}

export function clearStoredProgress(workId: string): void {
  try {
    const all = getStoredProgress();
    delete all[workId];
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  } catch {}
}

export function clearAllStoredProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  } catch {}
}

export function getStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(workId: string): string[] {
  try {
    const favs = getStoredFavorites();
    const index = favs.indexOf(workId);
    let updated: string[];
    if (index >= 0) {
      updated = favs.filter(id => id !== workId);
    } else {
      updated = [...favs, workId];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getStoredBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addBookmark(bookmark: Bookmark): Bookmark[] {
  try {
    const list = getStoredBookmarks();
    const updated = [bookmark, ...list.filter(b => b.id !== bookmark.id)];
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeBookmark(id: string): Bookmark[] {
  try {
    const list = getStoredBookmarks();
    const updated = list.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getStoredReaderSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READER_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_READER_SETTINGS;
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export function saveReaderSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.READER_SETTINGS, JSON.stringify(settings));
  } catch {}
}

export function submitReport(report: ReportItem): ReportItem[] {
  try {
    const reports = getStoredReports();
    const updated = [report, ...reports];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getStoredReports(): ReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStoredAudits(): LicenseAudit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDITS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logLicenseAudit(audit: LicenseAudit): LicenseAudit[] {
  try {
    const audits = getStoredAudits();
    const updated = [audit, ...audits];
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getStoredBannedUsers(): BannedUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BANNED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredBannedUsers(banned: BannedUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANNED_USERS, JSON.stringify(banned));
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
    localStorage.setItem(STORAGE_KEYS.DELETED_USERS, JSON.stringify(Array.from(deleted)));
  } catch {}
}

export function getChapterContent(chapterId: string): string {
  try {
    return localStorage.getItem(`getnow_ch_txt_${chapterId}`) || '';
  } catch {
    return '';
  }
}

export function saveChapterContent(chapterId: string, content: string): void {
  try {
    localStorage.setItem(`getnow_ch_txt_${chapterId}`, content);
  } catch {}
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 'normal',
  theme: 'sepia',
  fontFamily: 'serif',
  textAlign: 'left',
  margin: 'medium',
  paginated: false,
  brightness: 100,
  incognito: false,
};
