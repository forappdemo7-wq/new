import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Bookmark, ReadingProgress, ReportItem, Work, ReaderSettings, Author, LicenseAudit, Demographic, BannedUser } from '../types';
import {
  getStoredWorks,
  saveStoredWorks,
  resetWorksToSeed,
  getStoredProgress,
  saveProgress,
  saveAllProgress,
  clearAllStoredProgress,
  getStoredFavorites,
  toggleFavorite,
  getStoredBookmarks,
  addBookmark,
  removeBookmark,
  getStoredReaderSettings,
  saveReaderSettings,
  submitReport,
  getStoredReports,
  getStoredAudits,
  logLicenseAudit,
  getStoredBannedUsers,
  saveStoredBannedUsers,
  markWorkAsDeleted,
  clearDeletedWorks,
  getDeletedWorkIds
} from '../services/storage';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer';

interface LibraryContextType {
  works: Work[];
  favorites: string[];
  bookmarks: Bookmark[];
  progress: Record<string, ReadingProgress>;
  readerSettings: ReaderSettings;
  reports: ReportItem[];
  audits: LicenseAudit[];
  bannedUsers: BannedUser[];
  worldwideSafeOnly: boolean;
  setWorldwideSafeOnly: (val: boolean) => void;
  siteTheme: 'light' | 'dark';
  toggleSiteTheme: () => void;
  setSiteTheme: (theme: 'light' | 'dark') => void;
  // Actions
  toggleFavoriteWork: (workId: string) => void;
  isFavorite: (workId: string) => boolean;
  saveReadingProgress: (prog: ReadingProgress) => void;
  clearReadingProgress: () => Promise<void>;
  addNewBookmark: (bm: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeUserBookmark: (id: string) => void;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  createOrUpdateWork: (work: Work) => void;
  removeWork: (workId: string) => void;
  restoreSeedCatalog: () => void;
  sendReport: (report: Omit<ReportItem, 'id' | 'submittedAt' | 'status'>) => ReportItem;
  addAuditLog: (audit: Omit<LicenseAudit, 'id' | 'verifiedAt'>) => LicenseAudit;
  banUser: (userId: string, email: string, reason: string, purgeContent?: boolean) => void;
  unbanUser: (userId: string) => void;
  isUserBanned: (userId?: string, email?: string) => boolean;
  // Getters
  getWorkBySlug: (slug: string) => Work | undefined;
  getWorkById: (id: string) => Work | undefined;
  getWorksByAuthor: (authorSlug: string) => Work[];
  getWorksByGenre: (genre: string) => Work[];
  getWorksByDemographic: (demo: Demographic) => Work[];
  getWorksByLicense: (licenseCode: string) => Work[];
  getAllAuthors: () => Author[];
  getAllGenres: () => string[];
  getAllDemographics: () => Demographic[];
}

const LibraryContext = createContext<LibraryContextType | null>(null);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const activeUserId = userProfile?.uid || currentUser?.uid;

  const [works, setWorks] = useState<Work[]>(() => getStoredWorks());
  const [favorites, setFavorites] = useState<string[]>(() => getStoredFavorites());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => getStoredBookmarks());
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>(() => {
    // If an authenticated user ID is available on initial boot, load their scoped progress
    const savedProfile = localStorage.getItem('getnow_active_user_profile_v3');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.uid) {
          return getStoredProgress(parsed.uid);
        }
      } catch {}
    }
    return getStoredProgress();
  });
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => getStoredReaderSettings());
  const [reports, setReports] = useState<ReportItem[]>(() => getStoredReports());
  const [audits, setAudits] = useState<LicenseAudit[]>(() => getStoredAudits());
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>(() => getStoredBannedUsers());
  const [worldwideSafeOnly, setWorldwideSafeOnly] = useState<boolean>(true);
  const [siteTheme, setSiteThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('getnow_site_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  // Switch progress store whenever activeUserId changes
  useEffect(() => {
    if (activeUserId) {
      const userProg = getStoredProgress(activeUserId);
      setProgress(userProg);
    } else {
      setProgress(getStoredProgress());
    }
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem('getnow_site_theme', siteTheme);
    if (siteTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [siteTheme]);

  const toggleSiteTheme = () => {
    setSiteThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setSiteTheme = (theme: 'light' | 'dark') => {
    setSiteThemeState(theme);
  };

  // Sync Bookmarks, Reading Progress, & Custom Works from Firestore
  useEffect(() => {
    if (!db) return;

    let unsubUserBookmarks: (() => void) | null = null;
    let unsubUserProgress: (() => void) | null = null;
    let unsubUserFavorites: (() => void) | null = null;

    if (activeUserId) {
      // 1. Sync User Reading Progress from /users/{uid}/reading_progress
      const progressCol = collection(db, 'users', activeUserId, 'reading_progress');
      unsubUserProgress = onSnapshot(progressCol, (snapshot) => {
        const remoteProg: Record<string, ReadingProgress> = {};
        snapshot.forEach((d) => {
          const data = d.data() as ReadingProgress;
          if (data && data.workId) {
            remoteProg[data.workId] = data;
          }
        });
        // For authenticated user: remote is authoritative. If newly created account, remoteProg is {} (0 books)!
        setProgress(remoteProg);
        saveAllProgress(remoteProg, activeUserId);
      }, (err) => {
        console.warn('Sync user progress error:', err);
      });

      // 2. Sync User Bookmarks from /users/{uid}/bookmarks
      const bookmarksCol = collection(db, 'users', activeUserId, 'bookmarks');
      unsubUserBookmarks = onSnapshot(bookmarksCol, (snapshot) => {
        const remoteBm: Bookmark[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Bookmark;
          if (data && data.workId) {
            remoteBm.push({ ...data, id: d.id });
          }
        });
        setBookmarks(remoteBm);
      }, (err) => {
        console.warn('Sync user bookmarks error:', err);
      });

      // 3. Sync User Favorites from /users/{uid}/favorites
      const favsCol = collection(db, 'users', activeUserId, 'favorites');
      unsubUserFavorites = onSnapshot(favsCol, (snapshot) => {
        const remoteFavs: string[] = [];
        snapshot.forEach((d) => {
          remoteFavs.push(d.id);
        });
        setFavorites(remoteFavs);
      }, (err) => {
        console.warn('Sync user favorites error:', err);
      });
    }

    return () => {
      if (unsubUserBookmarks) unsubUserBookmarks();
      if (unsubUserProgress) unsubUserProgress();
      if (unsubUserFavorites) unsubUserFavorites();
    };
  }, [activeUserId]);

  // Listen to custom works and engagement counters in Firestore in real-time
  useEffect(() => {
    if (!db) return;
    const pathWorks = 'works';
    const unsubWorks = onSnapshot(
      collection(db, pathWorks),
      (snapshot) => {
        if (snapshot.empty) return;

        const changes = snapshot.docChanges();
        if (changes.length === 0) return;

        const modifiedMap = new Map<string, any>();
        const addedList: Work[] = [];
        const removedIds = new Set<string>();

        changes.forEach((change) => {
          const docSnap = change.doc;
          const data = docSnap.data() as any;
          const docId = docSnap.id;
          if (change.type === 'removed') {
            removedIds.add(docId);
            if (data?.id) removedIds.add(data.id);
            if (data?.slug) removedIds.add(data.slug.toLowerCase());
          } else {
            const fullItem: Work = {
              ...data,
              id: data?.id || docId,
            };
            modifiedMap.set(docId, fullItem);
            if (fullItem.id) modifiedMap.set(fullItem.id, fullItem);
            if (fullItem.slug) modifiedMap.set(fullItem.slug.toLowerCase(), fullItem);
            if (change.type === 'added' && fullItem.title && fullItem.slug) {
              addedList.push(fullItem);
            }
          }
        });

        setWorks((prev) => {
          let hadEngagementChange = false;
          const deletedIds = getDeletedWorkIds();

          // Process modifications and removals in a single linear pass
          const next = prev
            .filter((w) => !deletedIds.has(w.id) && (!w.slug || !deletedIds.has(w.slug)) && !removedIds.has(w.id) && (!w.slug || !removedIds.has(w.slug.toLowerCase())))
            .map((w) => {
              const remote =
                modifiedMap.get(w.id) ||
                (w.slug ? modifiedMap.get(w.slug.toLowerCase()) : undefined);

              if (remote) {
                const newLikes =
                  typeof remote.likesCount === 'number'
                    ? Math.max(0, remote.likesCount)
                    : w.likesCount;
                const newComments =
                  typeof remote.commentsCount === 'number'
                    ? Math.max(0, remote.commentsCount)
                    : w.commentsCount;

                if (newLikes !== w.likesCount || newComments !== w.commentsCount) {
                  hadEngagementChange = true;
                }

                const hasFullInfo = Boolean(remote.title && remote.slug);

                return {
                  ...w,
                  ...(hasFullInfo ? remote : {}),
                  // Keep full chapter contents if local was hydrated
                  chapters:
                    w.chapters && w.chapters.length > 0
                      ? w.chapters.map((ch, idx) => ({
                          ...ch,
                          ...(remote.chapters?.[idx] || {}),
                          content: ch.content || remote.chapters?.[idx]?.content || '',
                        }))
                      : remote.chapters || w.chapters,
                  likesCount: newLikes,
                  commentsCount: newComments,
                };
              }
              return w;
            });

          // Append newly added items from remote that are not in next
          addedList.forEach((rw) => {
            if (deletedIds.has(rw.id) || (rw.slug && deletedIds.has(rw.slug))) {
              return;
            }
            if (
              !next.some(
                (w) =>
                  w.id === rw.id ||
                  (w.slug && rw.slug && w.slug.toLowerCase() === rw.slug.toLowerCase())
              )
            ) {
              next.unshift(rw);
              hadEngagementChange = true;
            }
          });

          saveStoredWorks(next);

          if (hadEngagementChange) {
            try {
              window.dispatchEvent(new CustomEvent('getnow:comments-updated'));
            } catch {}
          }

          return next;
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathWorks);
      }
    );

    // Mobile device tab-switching / sleep recovery listener
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        try {
          window.dispatchEvent(new CustomEvent('getnow:comments-updated'));
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      unsubWorks();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);

  // Storage sync across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('getnow')) {
        setWorks(getStoredWorks());
        setFavorites(getStoredFavorites());
        setBookmarks(getStoredBookmarks());
        setProgress(getStoredProgress());
        setReaderSettings(getStoredReaderSettings());
        setReports(getStoredReports());
        setAudits(getStoredAudits());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleFavoriteWork = useCallback((workId: string) => {
    const updated = toggleFavorite(workId);
    setFavorites(updated);

    // Sync to user favorites in Firestore
    const user = auth.currentUser;
    if (user && db) {
      const isFav = updated.includes(workId);
      const favRef = doc(db, 'users', user.uid, 'favorites', workId);
      if (isFav) {
        setDoc(favRef, { workId, addedAt: new Date().toISOString() }).catch(e => {
          console.warn('Sync favorite error:', e);
        });
      } else {
        deleteDoc(favRef).catch(e => {
          console.warn('Delete favorite error:', e);
        });
      }
    }
  }, []);

  const isFavorite = useCallback((workId: string) => favorites.includes(workId), [favorites]);

  const saveReadingProgress = useCallback((prog: ReadingProgress) => {
    saveProgress(prog, readerSettings.incognito, activeUserId);
    if (!readerSettings.incognito) {
      const updatedProg = {
        ...prog,
        lastReadAt: new Date().toISOString()
      };

      setProgress(prev => ({
        ...prev,
        [prog.workId]: updatedProg
      }));

      // Async write reading progress to Firestore (user scoped + global fallback)
      if (db) {
        const targetUid = auth.currentUser?.uid || activeUserId;
        if (targetUid) {
          const userProgRef = doc(db, 'users', targetUid, 'reading_progress', prog.workId);
          setDoc(userProgRef, sanitizeFirestoreData(updatedProg), { merge: true }).catch(err => {
            console.warn('Failed to sync user reading progress to cloud:', err);
          });
        }
      }
    }
  }, [readerSettings.incognito, activeUserId]);

  const clearReadingProgress = useCallback(async () => {
    setProgress({});
    clearAllStoredProgress(activeUserId);
    if (db) {
      const targetUid = auth.currentUser?.uid || activeUserId;
      if (targetUid) {
        try {
          const progressCol = collection(db, 'users', targetUid, 'reading_progress');
          const snap = await getDocs(progressCol);
          snap.forEach(d => {
            deleteDoc(doc(db, 'users', targetUid, 'reading_progress', d.id)).catch(() => {});
          });
        } catch (err) {
          console.warn('Failed to clear remote reading progress:', err);
        }
      }
    }
  }, [activeUserId]);

  const addNewBookmark = useCallback((bm: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const updated = addBookmark(bm);
    setBookmarks(updated);

    const newBookmark = updated.find(b => b.workId === bm.workId && b.chapterId === bm.chapterId);
    if (newBookmark && db) {
      const user = auth.currentUser;
      if (user) {
        const userBmRef = doc(db, 'users', user.uid, 'bookmarks', newBookmark.id);
        setDoc(userBmRef, sanitizeFirestoreData({ ...newBookmark, userId: user.uid })).catch(err => {
          console.warn('Failed to sync bookmark to cloud:', err);
        });
      } else {
        const path = `bookmarks/${newBookmark.id}`;
        setDoc(doc(db, 'bookmarks', newBookmark.id), sanitizeFirestoreData(newBookmark)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, path);
        });
      }
    }
  }, []);

  const removeUserBookmark = useCallback((id: string) => {
    const updated = removeBookmark(id);
    setBookmarks(updated);

    if (db) {
      const user = auth.currentUser;
      if (user) {
        const userBmRef = doc(db, 'users', user.uid, 'bookmarks', id);
        deleteDoc(userBmRef).catch(err => {
          console.warn('Failed to remove bookmark from cloud:', err);
        });
      } else {
        const path = `bookmarks/${id}`;
        deleteDoc(doc(db, 'bookmarks', id)).catch(err => {
          handleFirestoreError(err, OperationType.DELETE, path);
        });
      }
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<ReaderSettings>) => {
    const next = saveReaderSettings(partial);
    setReaderSettings(next);
  }, []);

  const createOrUpdateWork = useCallback((work: Work) => {
    const updatedWork = {
      ...work,
      updatedAt: new Date().toISOString(),
      createdAt: work.createdAt || new Date().toISOString()
    };

    setWorks(prevWorks => {
      const existingIndex = prevWorks.findIndex(w => w.id === work.id);
      let next: Work[];
      if (existingIndex >= 0) {
        next = [...prevWorks];
        next[existingIndex] = updatedWork;
      } else {
        next = [updatedWork, ...prevWorks];
      }
      saveStoredWorks(next);
      return next;
    });

    if (db) {
      // Create lightweight work document for main works collection (under 1MB Firestore limit)
      const sanitizedChapters = (updatedWork.chapters || []).map(ch => {
        const item: any = {
          id: ch.id || '',
          workId: ch.workId || work.id,
          chapterNumber: ch.chapterNumber ?? ch.number ?? 1,
          number: ch.number ?? ch.chapterNumber ?? 1,
          title: ch.title || `Chapter ${ch.number || 1}`,
          slug: ch.slug || `chapter-${ch.number || 1}`,
          content: ch.content && ch.content.length > 500 ? ch.content.substring(0, 200) + '...' : (ch.content || '')
        };
        if (typeof ch.wordCount === 'number') item.wordCount = ch.wordCount;
        if (typeof ch.pagesCount === 'number') item.pagesCount = ch.pagesCount;
        else if (Array.isArray(ch.pages)) item.pagesCount = ch.pages.length;
        if (typeof ch.volumeNumber === 'number') item.volumeNumber = ch.volumeNumber;
        if (ch.releaseDate) item.releaseDate = ch.releaseDate;
        if (ch.language) item.language = ch.language;
        // Do NOT embed heavy comic/manga page arrays in the root work document;
        // Chapter pages are stored in 'works/{workId}/chapters/{chapterId}' subdocuments.
        return item;
      });

      // Avoid embedding multi-megabyte base64 strings in the main work document
      let coverImageClean = updatedWork.coverImage || '';
      let coverImageUrlClean = updatedWork.coverImageUrl || '';

      if (coverImageClean.startsWith('data:') && coverImageClean.length > 100000) {
        // If an oversized raw base64 data URL was provided, strip for root document to stay well under Firestore 1MB
        coverImageClean = '';
      }
      if (coverImageUrlClean.startsWith('data:') && coverImageUrlClean.length > 100000) {
        coverImageUrlClean = '';
      }

      const workMeta = sanitizeFirestoreData({
        id: updatedWork.id,
        title: updatedWork.title,
        slug: updatedWork.slug || '',
        description: (updatedWork.description || '').substring(0, 2000),
        coverImage: coverImageClean.startsWith('data:') && coverImageClean.length > 50000 ? '' : coverImageClean,
        coverImageUrl: coverImageUrlClean.startsWith('data:') && coverImageUrlClean.length > 50000 ? '' : coverImageUrlClean,
        authors: updatedWork.authors || [],
        genres: updatedWork.genres || [],
        demographic: updatedWork.demographic || 'all',
        licenseCode: updatedWork.licenseCode || 'CC-BY-4.0',
        verificationStatus: updatedWork.verificationStatus || 'verified',
        verifiedBy: updatedWork.verifiedBy || '',
        sourceUrl: updatedWork.sourceUrl || '',
        jurisdictionNotes: updatedWork.jurisdictionNotes || '',
        publisherId: updatedWork.publisherId || '',
        publisherEmail: updatedWork.publisherEmail || '',
        publisherName: updatedWork.publisherName || '',
        chaptersCount: (updatedWork.chapters || []).length,
        chapters: sanitizedChapters,
        createdAt: updatedWork.createdAt,
        updatedAt: updatedWork.updatedAt
      });

      const path = `works/${work.id}`;
      setDoc(doc(db, 'works', work.id), workMeta).then(() => {
        // Save each chapter with content into subcollection 'works/{workId}/chapters/{chapterId}'
        (updatedWork.chapters || []).forEach(ch => {
          if (ch && ch.id) {
            // Ensure each chapter subdocument is safely under 800KB
            const maxLen = 800000;
            const safeContent = (ch.content || '').substring(0, maxLen);
            const cleanChapterDoc = sanitizeFirestoreData({
              ...ch,
              content: safeContent
            });
            setDoc(doc(db, 'works', work.id, 'chapters', ch.id), cleanChapterDoc).catch(err => {
              console.warn(`Could not save chapter ${ch.id} subdocument:`, err);
            });
          }
        });
      }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, path);
      });
    }

    logLicenseAudit({
      workId: work.id,
      workTitle: work.title,
      verifiedBy: work.verifiedBy || 'Admin Registrar',
      evidenceUrl: work.sourceUrl,
      jurisdictionNotes: work.jurisdictionNotes || `Verified under license ${work.licenseCode}`,
      status: work.verificationStatus
    });
    setAudits(getStoredAudits());
  }, []);

  const removeWork = useCallback((workId: string) => {
    if (!workId) return;

    let targetId = workId;
    let targetSlug: string | undefined;

    setWorks(prevWorks => {
      const target = prevWorks.find(w => w.id === workId || w.slug === workId);
      if (target) {
        targetId = target.id || workId;
        targetSlug = target.slug;
      }
      markWorkAsDeleted(targetId, targetSlug);

      const next = prevWorks.filter(
        w => w.id !== targetId && w.id !== workId && (!targetSlug || w.slug !== targetSlug)
      );
      saveStoredWorks(next);
      return next;
    });

    try {
      window.dispatchEvent(
        new CustomEvent('getnow:work-deleted', { detail: { workId, targetId, slug: targetSlug } })
      );
    } catch {}

    if (db) {
      const docsToDelete = new Set<string>();
      if (targetId) docsToDelete.add(targetId);
      if (workId) docsToDelete.add(workId);
      if (targetSlug) docsToDelete.add(targetSlug);

      docsToDelete.forEach((docId) => {
        const path = `works/${docId}`;
        deleteDoc(doc(db, 'works', docId)).catch(err => {
          handleFirestoreError(err, OperationType.DELETE, path);
        });
      });
    }
  }, []);

  const restoreSeedCatalog = useCallback(() => {
    clearDeletedWorks();
    const seeded = resetWorksToSeed();
    setWorks(seeded);
    setAudits(getStoredAudits());
  }, []);

  const sendReport = useCallback((report: Omit<ReportItem, 'id' | 'submittedAt' | 'status'>) => {
    const newRep = submitReport(report);
    setReports(prev => [newRep, ...prev]);
    return newRep;
  }, []);

  const addAuditLog = useCallback((audit: Omit<LicenseAudit, 'id' | 'verifiedAt'>) => {
    const newAudit = logLicenseAudit(audit);
    setAudits(getStoredAudits());
    return newAudit;
  }, []);

  const banUser = useCallback((userId: string, email: string, reason: string, purgeContent: boolean = true) => {
    const newBannedUser: BannedUser = {
      id: userId,
      email,
      reason: reason || 'Violation of community publishing guidelines',
      bannedAt: new Date().toISOString(),
      bannedBy: auth.currentUser?.email || 'Administrator',
      purgedWorksCount: 0
    };

    let purgedCount = 0;
    if (purgeContent) {
      setWorks(prevWorks => {
        const remainingWorks = prevWorks.filter(w => {
          const isMatch = 
            (userId && w.publisherId === userId) || 
            (email && w.publisherEmail && w.publisherEmail.toLowerCase() === email.toLowerCase());
          
          if (isMatch) {
            purgedCount++;
            if (db) {
              deleteDoc(doc(db, 'works', w.id)).catch(err => {
                console.warn(`Failed to delete banned work ${w.id}:`, err);
              });
            }
            return false;
          }
          return true;
        });
        saveStoredWorks(remainingWorks);
        return remainingWorks;
      });
    }

    newBannedUser.purgedWorksCount = purgedCount;

    setBannedUsers(prev => {
      const updated = [newBannedUser, ...prev.filter(u => u.id !== userId && u.email !== email)];
      saveStoredBannedUsers(updated);
      return updated;
    });

    if (db) {
      setDoc(doc(db, 'banned_users', userId), sanitizeFirestoreData(newBannedUser)).catch(err => {
        console.warn('Failed to sync banned user to Firestore:', err);
      });
    }
  }, []);

  const unbanUser = useCallback((userId: string) => {
    setBannedUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      saveStoredBannedUsers(updated);
      return updated;
    });

    if (db) {
      deleteDoc(doc(db, 'banned_users', userId)).catch(err => {
        console.warn('Failed to unban user in Firestore:', err);
      });
    }
  }, []);

  const isUserBanned = useCallback((userId?: string, email?: string): boolean => {
    if (!userId && !email) return false;
    return bannedUsers.some(b => 
      (userId && b.id === userId) || 
      (email && b.email.toLowerCase() === email.toLowerCase())
    );
  }, [bannedUsers]);

  const getWorkBySlug = useCallback((slug: string) => {
    if (!slug) return undefined;
    let clean = slug.split('#')[0].split('?')[0].trim();
    try {
      clean = decodeURIComponent(clean);
    } catch {}
    const cleanLower = clean.toLowerCase();
    return works.find(w => 
      (w.slug && w.slug.toLowerCase() === cleanLower) ||
      (w.id && w.id.toLowerCase() === cleanLower) ||
      w.slug === clean ||
      w.id === clean ||
      w.slug === slug ||
      w.id === slug
    );
  }, [works]);

  const getWorkById = useCallback((id: string) => works.find(w => w.id === id), [works]);

  const getWorksByAuthor = useCallback((authorSlug: string) => {
    return works.filter(w => (w.authors || []).some(a => a.slug === authorSlug));
  }, [works]);

  const getWorksByGenre = useCallback((genre: string) => {
    const norm = genre.toLowerCase().trim();
    return works.filter(w => (w.genres || []).some(g => g.toLowerCase() === norm));
  }, [works]);

  const getWorksByDemographic = useCallback((demo: Demographic) => {
    return works.filter(w => w.demographic === demo);
  }, [works]);

  const getWorksByLicense = useCallback((licenseCode: string) => {
    return works.filter(w => (w.licenseCode || '').toLowerCase() === licenseCode.toLowerCase());
  }, [works]);

  const getAllAuthors = useCallback((): Author[] => {
    const map = new Map<string, Author>();
    works.forEach(w => {
      (w.authors || []).forEach(a => {
        if (a && a.slug && !map.has(a.slug)) {
          map.set(a.slug, a);
        }
      });
    });
    return Array.from(map.values());
  }, [works]);

  const getAllGenres = useCallback((): string[] => {
    const set = new Set<string>();
    works.forEach(w => (w.genres || []).forEach(g => { if (g) set.add(g); }));
    return Array.from(set).sort();
  }, [works]);

  const getAllDemographics = useCallback((): Demographic[] => {
    return ['shonen', 'shojo', 'seinen', 'josei', 'kodomomuke', 'general'];
  }, []);

  const contextValue = React.useMemo<LibraryContextType>(() => ({
    works,
    favorites,
    bookmarks,
    progress,
    readerSettings,
    reports,
    audits,
    bannedUsers,
    worldwideSafeOnly,
    setWorldwideSafeOnly,
    siteTheme,
    toggleSiteTheme,
    setSiteTheme,
    toggleFavoriteWork,
    isFavorite,
    saveReadingProgress,
    clearReadingProgress,
    addNewBookmark,
    removeUserBookmark,
    updateSettings,
    createOrUpdateWork,
    removeWork,
    restoreSeedCatalog,
    sendReport,
    addAuditLog,
    banUser,
    unbanUser,
    isUserBanned,
    getWorkBySlug,
    getWorkById,
    getWorksByAuthor,
    getWorksByGenre,
    getWorksByDemographic,
    getWorksByLicense,
    getAllAuthors,
    getAllGenres,
    getAllDemographics
  }), [
    works,
    favorites,
    bookmarks,
    progress,
    readerSettings,
    reports,
    audits,
    worldwideSafeOnly,
    siteTheme,
    toggleFavoriteWork,
    isFavorite,
    saveReadingProgress,
    clearReadingProgress,
    addNewBookmark,
    removeUserBookmark,
    updateSettings,
    createOrUpdateWork,
    removeWork,
    restoreSeedCatalog,
    sendReport,
    addAuditLog,
    getWorkBySlug,
    getWorkById,
    getWorksByAuthor,
    getWorksByGenre,
    getWorksByDemographic,
    getWorksByLicense,
    getAllAuthors,
    getAllGenres,
    getAllDemographics
  ]);

  return (
    <LibraryContext.Provider value={contextValue}>
      {children}
    </LibraryContext.Provider>
  );
};

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
