import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  limit,
  increment
} from 'firebase/firestore';
import { Work, WorkLike, WorkComment, LibraryNotification } from '../types';

// ================= LOCAL FALLBACK HELPERS =================

/**
 * Sanitizes and deduplicates an array of likes:
 * 1. Disallows guest/anonymous dummy entries (must have valid registered userId not starting with 'guest-').
 * 2. Strictly enforces uniqueness: at most ONE like per unique registered userId.
 */
export function sanitizeLikes(likes: any[]): WorkLike[] {
  if (!Array.isArray(likes)) return [];
  const seenUsers = new Set<string>();
  const sanitized: WorkLike[] = [];

  for (const item of likes) {
    if (!item || typeof item !== 'object') continue;
    const userId = item.userId;
    if (!userId || typeof userId !== 'string') {
      continue;
    }
    // Strictly filter out fake guest / dummy reader likes
    if (
      userId.startsWith('guest-') ||
      userId.startsWith('reader-') ||
      (item.userName === 'Reader' && userId.includes('-') && !userId.startsWith('usr-') && !userId.startsWith('admin-'))
    ) {
      continue;
    }
    // Deduplicate: at most ONE like per unique registered account
    if (seenUsers.has(userId)) continue;
    seenUsers.add(userId);
    sanitized.push({
      id: item.id || `like-${item.workId || 'work'}-${userId}`,
      workId: item.workId || '',
      userId,
      userName: item.userName || 'Reader',
      userAvatar: item.userAvatar || undefined,
      likedAt: item.likedAt || new Date().toISOString(),
    });
  }
  return sanitized;
}

// Auto-purge stale guest likes from localStorage once upon initialization
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToClean: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('getnow_work_likes_')) {
        keysToClean.push(k);
      }
    }
    for (const k of keysToClean) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const sanitized = sanitizeLikes(parsed);
            if (sanitized.length > 0) {
              localStorage.setItem(k, JSON.stringify(sanitized));
            } else {
              localStorage.removeItem(k);
            }
          }
        } catch {}
      }
    }
  }
} catch {}

export function getLocalLikes(workId: string): WorkLike[] {
  try {
    const raw = localStorage.getItem(`getnow_work_likes_${workId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const sanitized = sanitizeLikes(parsed);
    // If stale or guest items were cleaned up, write back the clean state
    if (sanitized.length !== parsed.length) {
      if (sanitized.length > 0) {
        localStorage.setItem(`getnow_work_likes_${workId}`, JSON.stringify(sanitized));
      } else {
        localStorage.removeItem(`getnow_work_likes_${workId}`);
      }
    }
    return sanitized;
  } catch {
    return [];
  }
}

export function saveLocalLikes(workId: string, likes: WorkLike[]): void {
  try {
    const sanitized = sanitizeLikes(likes);
    if (sanitized.length > 0) {
      localStorage.setItem(`getnow_work_likes_${workId}`, JSON.stringify(sanitized));
    } else {
      localStorage.removeItem(`getnow_work_likes_${workId}`);
    }
  } catch {}
}

/**
 * Returns the exact live likes count for a work, checking both local synced storage and work baseline.
 */
export function getWorkLikesCount(work: Work): number {
  if (!work) return 0;
  try {
    const raw = localStorage.getItem(`getnow_work_likes_${work.id}`);
    if (raw !== null) {
      const local = getLocalLikes(work.id);
      return local.length;
    }
  } catch {}
  return typeof work.likesCount === 'number' ? Math.max(0, work.likesCount) : 0;
}

/**
 * Sorts works so that the most liked book/manga always stays on first position (#1).
 * Falls back to popularity score and recency when likes are equal.
 */
export function sortWorksByLikes(works: Work[]): Work[] {
  return [...works].sort((a, b) => {
    const likesA = getWorkLikesCount(a);
    const likesB = getWorkLikesCount(b);
    if (likesB !== likesA) {
      return likesB - likesA; // Most liked first
    }
    const popA = a.popularityScore || 0;
    const popB = b.popularityScore || 0;
    if (popB !== popA) {
      return popB - popA;
    }
    const dateA = new Date(a.createdAt || a.originalPublicationYear || 0).getTime();
    const dateB = new Date(b.createdAt || b.originalPublicationYear || 0).getTime();
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    return (a.title || '').localeCompare(b.title || '');
  });
}

/**
 * React hook that triggers a re-render whenever any work's like count is updated.
 */
export function useLikesSync(): number {
  const [likesVersion, setLikesVersion] = useState(0);

  useEffect(() => {
    const onLikesChange = () => {
      setLikesVersion((v) => v + 1);
    };
    window.addEventListener('getnow:likes-updated', onLikesChange);
    return () => {
      window.removeEventListener('getnow:likes-updated', onLikesChange);
    };
  }, []);

  return likesVersion;
}

export function getLocalComments(workId: string): WorkComment[] {
  try {
    const raw = localStorage.getItem(`getnow_work_comments_${workId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalComments(workId: string, comments: WorkComment[]): void {
  try {
    localStorage.setItem(`getnow_work_comments_${workId}`, JSON.stringify(comments));
  } catch {}
}

export function getLocalUserNotifications(userId: string): LibraryNotification[] {
  try {
    const raw = localStorage.getItem(`getnow_user_notifications_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any stale mock or starter IDs if present
        return parsed.filter((n: any) => !n.id?.startsWith('starter-') && !n.id?.startsWith('mock-'));
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveLocalUserNotifications(userId: string, notifs: LibraryNotification[]): void {
  try {
    localStorage.setItem(`getnow_user_notifications_${userId}`, JSON.stringify(notifs));
  } catch {}
}

// ================= LIKES SERVICE =================

/**
 * Toggle like for a specific work by the current user.
 * Sends an in-app notification to the uploader if the work is uploaded by another user.
 * Strictly requires an authenticated user account (no guests or anonymous duplicates allowed).
 */
// In-flight lock map to eliminate race conditions, double-clicks, and duplicate network writes
const inFlightLikeLocks = new Map<string, Promise<{ liked: boolean; count: number }>>();
// Throttle map to prevent rapid spam clicking
const likeThrottleTimestamps = new Map<string, number>();
const LIKE_COOLDOWN_MS = 400;

export async function toggleWorkLike(
  work: Work,
  user?: { uid?: string | null; displayName?: string; photoURL?: string }
): Promise<{ liked: boolean; count: number }> {
  const userId = user?.uid;
  if (!userId || userId.startsWith('guest-') || userId.startsWith('reader-')) {
    throw new Error('Please sign in to like works.');
  }

  const workId = work.id;
  const lockKey = `${userId}:${workId}`;

  // 1. In-flight Lock: If an operation is already pending for this user & work, await and return it
  const existingInFlight = inFlightLikeLocks.get(lockKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  // 2. Client-side Rate-limiting & Cooldown
  const now = Date.now();
  const lastToggle = likeThrottleTimestamps.get(lockKey) || 0;
  if (now - lastToggle < LIKE_COOLDOWN_MS) {
    throw new Error('Please wait a moment before toggling like again.');
  }
  likeThrottleTimestamps.set(lockKey, now);

  const userName = user?.displayName?.trim() || 'Reader';
  const userAvatar = user?.photoURL || undefined;

  // Execute toggle with in-flight lock tracking
  const toggleOperation = (async () => {
    let willLike = false;
    const previousLocalLikes = getLocalLikes(workId);

    if (db) {
      const likeDocRef = doc(db, 'works', workId, 'likes', userId);
      // Determine remote truth from Firestore document
      const snap = await getDoc(likeDocRef);
      const currentlyLiked = snap.exists();
      willLike = !currentlyLiked;

      if (willLike) {
        const likeRecord: WorkLike = {
          id: `like-${workId}-${userId}`,
          workId,
          userId,
          userName,
          userAvatar,
          likedAt: new Date().toISOString(),
        };
        await setDoc(likeDocRef, likeRecord);
      } else {
        await deleteDoc(likeDocRef);
      }

      // Atomically sync live likesCount and metadata on parent work document in Firestore
      const workDocRef = doc(db, 'works', workId);
      try {
        await setDoc(
          workDocRef,
          {
            id: work.id,
            title: work.title,
            slug: work.slug,
            type: work.type || 'book',
            likesCount: increment(willLike ? 1 : -1),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Could not update work doc likesCount:', e);
      }
    } else {
      // Local fallback mode when database is not configured
      const existingIndex = previousLocalLikes.findIndex((l) => l.userId === userId);
      willLike = existingIndex === -1;
    }

    // Keep in-memory work likesCount in sync
    if (typeof work.likesCount === 'number') {
      work.likesCount = Math.max(0, work.likesCount + (willLike ? 1 : -1));
    } else {
      work.likesCount = willLike ? 1 : 0;
    }

    // Update local cache only after successful remote write
    const nextLocalLikes = previousLocalLikes.filter((l) => l.userId !== userId);
    if (willLike) {
      nextLocalLikes.push({
        id: `like-${workId}-${userId}`,
        workId,
        userId,
        userName,
        userAvatar,
        likedAt: new Date().toISOString(),
      });
    }
    const sanitized = sanitizeLikes(nextLocalLikes);
    saveLocalLikes(workId, sanitized);

    // Keep user's liked set in localStorage in sync for instant 0ms restoration
    try {
      const userKey = `getnow_user_liked_${userId}`;
      const stored = localStorage.getItem(userKey);
      const set = new Set<string>(stored ? JSON.parse(stored) : []);
      if (willLike) {
        set.add(workId);
      } else {
        set.delete(workId);
      }
      localStorage.setItem(userKey, JSON.stringify(Array.from(set)));
    } catch {}

    // Cross-component broadcast event
    try {
      window.dispatchEvent(
        new CustomEvent('getnow:likes-updated', {
          detail: { workId, likes: sanitized, liked: willLike, count: sanitized.length, userId },
        })
      );
    } catch {}

    // Send notification to uploader when a like is added
    if (willLike) {
      const uploaderId = work.uploaderId || work.publisherId;
      if (uploaderId && !uploaderId.startsWith('author-') && uploaderId !== userId) {
        const medium = getWorkMediumDescriptor(work.type);
        sendUploaderNotification({
          recipientUserId: uploaderId,
          senderUserId: userId,
          senderName: userName,
          senderAvatar: userAvatar,
          type: 'like',
          title: `Your published ${medium} received a like!`,
          message: `${userName} liked your published ${medium} "${work.title}".`,
          link: `/work/${work.slug}`,
          workId: work.id,
          workSlug: work.slug,
          workTitle: work.title,
        }).catch((err) => console.warn('sendUploaderNotification error:', err));
      }
    }

    return { liked: willLike, count: sanitized.length };
  })();

  inFlightLikeLocks.set(lockKey, toggleOperation);

  try {
    return await toggleOperation;
  } finally {
    inFlightLikeLocks.delete(lockKey);
  }
}

/**
 * Real-time listener for likes on a specific work.
 * Relies directly on Firestore as the source of truth without resurrecting unliked records.
 */
export function subscribeWorkLikes(
  workId: string,
  currentUserId: string | undefined,
  callback: (likes: WorkLike[], isLiked: boolean) => void,
  alternateUserId?: string | undefined
): () => void {
  const isMatchUser = (uid?: string) => {
    if (!uid) return false;
    return (Boolean(currentUserId) && uid === currentUserId) || (Boolean(alternateUserId) && uid === alternateUserId);
  };

  const isUserAuthenticated = Boolean(currentUserId || alternateUserId);

  // Check user liked storage first for instant red heart render
  let initiallyLiked = false;
  if (isUserAuthenticated) {
    try {
      const uIds = [currentUserId, alternateUserId].filter(Boolean) as string[];
      for (const uId of uIds) {
        const stored = localStorage.getItem(`getnow_user_liked_${uId}`);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.includes(workId)) {
            initiallyLiked = true;
            break;
          }
        }
      }
    } catch {}
  }

  // Emit current cached likes immediately for 0ms initial render
  const initialLocal = getLocalLikes(workId);
  if (!initiallyLiked && isUserAuthenticated) {
    initiallyLiked = initialLocal.some((l) => isMatchUser(l.userId));
  }
  callback(initialLocal, initiallyLiked);

  // Listen to cross-component custom event for instant updates
  const handleLikesEvent = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.workId === workId) {
      const current = custom.detail?.likes || getLocalLikes(workId);
      const isLiked = typeof custom.detail?.liked === 'boolean'
        ? custom.detail.liked
        : Boolean(isUserAuthenticated && current.some((l: any) => isMatchUser(l.userId)));
      callback(current, isLiked);
    }
  };
  window.addEventListener('getnow:likes-updated', handleLikesEvent);

  if (!db) {
    return () => {
      window.removeEventListener('getnow:likes-updated', handleLikesEvent);
    };
  }

  const likesQuery = query(collection(db, 'works', workId, 'likes'), limit(250));
  const unsub = onSnapshot(
    likesQuery,
    (snapshot) => {
      const remoteLikes: WorkLike[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as WorkLike;
        if (data && data.userId) {
          remoteLikes.push(data);
        }
      });

      // Firestore is the single source of truth: real registered likes only
      const sanitized = sanitizeLikes(remoteLikes);
      saveLocalLikes(workId, sanitized);

      const isLiked = Boolean(isUserAuthenticated && sanitized.some((l) => isMatchUser(l.userId)));
      callback(sanitized, isLiked);

      // Keep user's liked set in sync
      if (isUserAuthenticated) {
        const uIds = [currentUserId, alternateUserId].filter(Boolean) as string[];
        for (const uId of uIds) {
          try {
            const userKey = `getnow_user_liked_${uId}`;
            const stored = localStorage.getItem(userKey);
            const set = new Set<string>(stored ? JSON.parse(stored) : []);
            if (isLiked) {
              set.add(workId);
            } else {
              set.delete(workId);
            }
            localStorage.setItem(userKey, JSON.stringify(Array.from(set)));
          } catch {}
        }
      }
    },
    (err) => {
      console.warn(`subscribeWorkLikes error for ${workId}:`, err);
    }
  );

  return () => {
    unsub();
    window.removeEventListener('getnow:likes-updated', handleLikesEvent);
  };
}

// ================= COMMENTS & MENTIONS SERVICE =================

export interface CommunityUser {
  uid: string;
  displayName: string;
  avatar?: string;
  role?: string;
}

/**
 * Dynamic medium descriptor for a work (e.g., 'post/book', 'post/manga', 'post/comic').
 * Dynamically resolves based on the work's medium so notifications are never hardcoded.
 */
export function getWorkMediumDescriptor(type?: string): string {
  if (!type) return 'post/book';
  const clean = type.toLowerCase().trim();
  if (clean === 'manga') return 'post/manga';
  if (clean === 'comic') return 'post/comic';
  if (clean === 'book' || clean === 'novel' || clean === 'fiction' || clean === 'non-fiction') return 'post/book';
  if (clean === 'short-story' || clean === 'story') return 'post/story';
  if (clean === 'poetry' || clean === 'poem') return 'post/poem';
  if (clean === 'article' || clean === 'essay') return 'post/article';
  return `post/${clean}`;
}

/**
 * Extracts all @mentions from text.
 * Supports multi-word names (e.g. @Marcus Vance) as well as single tokens (@user_123).
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  const mentions: string[] = [];
  // Match @username or @"Full Name" or @First Last up to punctuation or end of string
  const regex = /@([a-zA-Z0-9_\-\.]{2,30}(?:\s+[a-zA-Z0-9_\-\.]{2,30})?)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (raw && !mentions.includes(raw)) {
      mentions.push(raw);
    }
  }
  return mentions;
}

/**
 * Resolves extracted mention names to user objects against known users and thread participants.
 */
export function resolveMentionedUsers(
  mentionNames: string[],
  userPool: CommunityUser[]
): CommunityUser[] {
  const resolved: CommunityUser[] = [];
  const seenIds = new Set<string>();

  for (const name of mentionNames) {
    const clean = name.toLowerCase().replace(/^@/, '').trim();
    if (!clean) continue;

    // Search pool for exact or prefix match
    const match = userPool.find((u) => {
      const uName = u.displayName.toLowerCase();
      const uId = u.uid.toLowerCase();
      return uName === clean || uId === clean || uName.startsWith(clean) || clean.startsWith(uName);
    });

    if (match) {
      if (!seenIds.has(match.uid)) {
        seenIds.add(match.uid);
        resolved.push(match);
      }
    } else {
      // Deterministic fallback UID for arbitrary mentioned usernames
      const derivedId = `user-${clean.replace(/[^a-z0-9]/g, '-')}`;
      if (!seenIds.has(derivedId)) {
        seenIds.add(derivedId);
        resolved.push({
          uid: derivedId,
          displayName: name,
          avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(clean)}&backgroundColor=d1d4f9`,
        });
      }
    }
  }

  return resolved;
}

export interface AddWorkCommentOptions {
  existingId?: string;
  createdAt?: string;
  replyTo?: {
    commentId: string;
    userId: string;
    userName: string;
    commentSnippet?: string;
  };
  knownUsers?: CommunityUser[];
}

/**
 * Add a comment or reply to a work.
 * Handles:
 * 1. Direct reply to User B: User B receives "User A replied to your comment and said: ..."
 * 2. Mentions of other users: Users receive "User A mentioned you in this published post/book: ..."
 * 3. Book uploader alert if not already notified.
 */
export async function addWorkComment(
  work: Work,
  user: { uid: string; displayName?: string; photoURL?: string },
  content: string,
  options?: AddWorkCommentOptions
): Promise<WorkComment> {
  const workId = work.id;
  const userId = user.uid;
  const userName = user.displayName?.trim() || 'Reader';
  const userAvatar = user.photoURL || undefined;
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error('Comment cannot be empty.');
  }

  // Parse @mentions in comment
  const rawMentions = extractMentions(cleanContent);

  // Build candidate user pool from thread, work creators, and known participants
  const localComments = getLocalComments(workId);
  const userPool: CommunityUser[] = [
    ...(options?.knownUsers || []),
  ];

  // Add work uploader/publisher to pool
  const uploaderId = work.uploaderId || work.publisherId;
  if (uploaderId) {
    userPool.push({
      uid: uploaderId,
      displayName: work.publisherName || 'Author',
      role: 'Uploader',
    });
  }

  // Add existing commenters to pool
  localComments.forEach((c) => {
    if (c.userId && c.userName && !userPool.some((u) => u.uid === c.userId)) {
      userPool.push({
        uid: c.userId,
        displayName: c.userName,
        avatar: c.userAvatar,
      });
    }
  });

  // Add reply target to pool
  if (options?.replyTo) {
    if (!userPool.some((u) => u.uid === options.replyTo!.userId)) {
      userPool.push({
        uid: options.replyTo.userId,
        displayName: options.replyTo.userName,
      });
    }
  }

  const resolvedMentions = resolveMentionedUsers(rawMentions, userPool);

  const commentId = options?.existingId || `comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newComment: WorkComment = {
    id: commentId,
    workId,
    userId,
    userName,
    userAvatar,
    content: cleanContent,
    createdAt: options?.createdAt || new Date().toISOString(),
    parentCommentId: options?.replyTo?.commentId,
    replyToUserId: options?.replyTo?.userId,
    replyToUserName: options?.replyTo?.userName,
    replyToCommentSnippet: options?.replyTo?.commentSnippet,
    mentions: rawMentions,
  };

  // Optimistic local update & instant event dispatch
  const updatedComments = [newComment, ...localComments.filter((c) => c.id !== commentId)];
  saveLocalComments(workId, updatedComments);

  // Dispatch custom event immediately so all card counters and threads update with zero latency
  try {
    window.dispatchEvent(
      new CustomEvent('getnow:comments-updated', { detail: { workId, comment: newComment } })
    );
  } catch {}

  // Dynamic medium descriptor (post/book, post/manga, post/comic, etc.)
  const medium = getWorkMediumDescriptor(work.type);

  // Set of user IDs already notified to avoid redundant duplicate notifications
  const notifiedUserIds = new Set<string>();

  // 1. Direct Reply Notification: If User A replied to User B's comment
  if (options?.replyTo && options.replyTo.userId) {
    const targetUserId = options.replyTo.userId;
    notifiedUserIds.add(targetUserId);

    sendUploaderNotification({
      recipientUserId: targetUserId,
      senderUserId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      type: 'reply',
      title: `${userName} replied to your comment on published ${medium}`,
      message: `${userName} replied to your comment and said: "${cleanContent}"`,
      link: `/work/${work.slug}#${commentId}`,
      workId: work.id,
      workSlug: work.slug,
      workTitle: work.title,
      commentId,
      replyToCommentId: options.replyTo.commentId,
    }).catch((err) => console.warn('Reply notification error:', err));
  }

  // 2. Mention Notifications: Send to users mentioned in the comment (e.g. User C or others)
  for (const mentioned of resolvedMentions) {
    if (mentioned.uid === userId) continue; // Don't notify self
    if (notifiedUserIds.has(mentioned.uid)) continue; // Already received reply notification

    notifiedUserIds.add(mentioned.uid);
    sendUploaderNotification({
      recipientUserId: mentioned.uid,
      senderUserId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      type: 'mention',
      title: `Mentioned in discussion for published ${medium} "${work.title}"`,
      message: `${userName} mentioned you in this published ${medium}: "${cleanContent}"`,
      link: `/work/${work.slug}#${commentId}`,
      workId: work.id,
      workSlug: work.slug,
      workTitle: work.title,
      commentId,
    }).catch((err) => console.warn('Mention notification error:', err));
  }

  // 3. Book Uploader Notification (if uploader is not the commenter and hasn't already been notified)
  if (uploaderId && !uploaderId.startsWith('author-')) {
    if (!notifiedUserIds.has(uploaderId) && uploaderId !== userId) {
      notifiedUserIds.add(uploaderId);
      const preview = cleanContent.length > 70 ? cleanContent.slice(0, 67) + '…' : cleanContent;
      sendUploaderNotification({
        recipientUserId: uploaderId,
        senderUserId: userId,
        senderName: userName,
        senderAvatar: userAvatar,
        type: 'comment',
        title: `New comment on your published ${medium}`,
        message: `${userName} commented on your published ${medium} "${work.title}": "${preview}"`,
        link: `/work/${work.slug}#${commentId}`,
        workId: work.id,
        workSlug: work.slug,
        workTitle: work.title,
        commentId,
      }).catch((err) => console.warn('addWorkComment sendUploaderNotification error:', err));
    }
  }

  // Firestore sync
  if (db) {
    const commentDocRef = doc(db, 'works', workId, 'comments', commentId);
    try {
      await setDoc(commentDocRef, newComment);
    } catch (err) {
      console.warn('Firestore addWorkComment error:', err);
    }

    // Atomically sync live commentsCount and metadata on parent work document in Firestore
    const workDocRef = doc(db, 'works', workId);
    try {
      await updateDoc(workDocRef, {
        id: work.id,
        title: work.title,
        slug: work.slug,
        type: work.type || 'book',
        commentsCount: increment(1),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      try {
        await setDoc(
          workDocRef,
          {
            id: work.id,
            title: work.title,
            slug: work.slug,
            type: work.type || 'book',
            commentsCount: 1,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not update work commentsCount in Firestore:', err);
      }
    }
  }

  // Keep in-memory work commentsCount in sync
  if (typeof work.commentsCount === 'number') {
    work.commentsCount += 1;
  } else {
    work.commentsCount = 1;
  }

  // Dispatch custom event for instant cross-component reactivity
  try {
    window.dispatchEvent(
      new CustomEvent('getnow:comments-updated', {
        detail: { workId, comment: newComment, count: updatedComments.length },
      })
    );
  } catch {}

  return newComment;
}

/**
 * Real-time listener for comments on a work.
 */
export function subscribeWorkComments(
  workId: string,
  callback: (comments: WorkComment[]) => void
): () => void {
  const getFilteredLocal = () => {
    const local = getLocalComments(workId);
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem(`getnow_deleted_comments_${workId}`) || '[]');
    } catch {}
    return local.filter((c) => !deletedIds.includes(c.id));
  };

  // Emit local cache immediately (filtered)
  const initialLocal = getFilteredLocal();
  callback(initialLocal);

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.workId === workId) {
      const current = getFilteredLocal();
      callback(current);
    }
  };
  window.addEventListener('getnow:comments-updated', handleUpdate);

  if (!db) {
    return () => {
      window.removeEventListener('getnow:comments-updated', handleUpdate);
    };
  }

  const commentsQuery = query(collection(db, 'works', workId, 'comments'), limit(150));
  const unsub = onSnapshot(
    commentsQuery,
    (snapshot) => {
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem(`getnow_deleted_comments_${workId}`) || '[]');
      } catch {}

      const remoteList: WorkComment[] = [];
      snapshot.forEach((d) => {
        const commentData = d.data() as WorkComment;
        if (!deletedIds.includes(commentData.id)) {
          remoteList.push(commentData);
        }
      });

      // Firestore is the authoritative remote truth: preserve pending local comments only
      const local = getFilteredLocal();
      const combinedMap = new Map<string, WorkComment>();
      // Remote docs first
      remoteList.forEach((c) => combinedMap.set(c.id, c));
      // Add any local pending comments that haven't been written to Firestore yet
      local.forEach((c) => {
        if (!combinedMap.has(c.id) && c.id.startsWith('comm-pending-')) {
          combinedMap.set(c.id, c);
        }
      });

      const merged = Array.from(combinedMap.values()).filter((c) => !deletedIds.includes(c.id));
      merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      saveLocalComments(workId, merged);
      callback(merged);

      // Broadcast to other components on this device
      try {
        window.dispatchEvent(
          new CustomEvent('getnow:comments-updated', {
            detail: { workId, comments: merged, count: merged.length },
          })
        );
      } catch {}
    },
    (err) => {
      console.debug(`subscribeWorkComments for ${workId}:`, err);
    }
  );

  return () => {
    unsub();
    window.removeEventListener('getnow:comments-updated', handleUpdate);
  };
}

/**
 * Delete a comment.
 */
export async function deleteWorkComment(workId: string, commentId: string): Promise<void> {
  const localComments = getLocalComments(workId);
  const updatedLocal = localComments.filter((c) => c.id !== commentId);
  saveLocalComments(workId, updatedLocal);

  try {
    const deletedIds = JSON.parse(localStorage.getItem(`getnow_deleted_comments_${workId}`) || '[]');
    if (!deletedIds.includes(commentId)) {
      deletedIds.push(commentId);
      localStorage.setItem(`getnow_deleted_comments_${workId}`, JSON.stringify(deletedIds));
    }
  } catch {}

  if (db) {
    try {
      await deleteDoc(doc(db, 'works', workId, 'comments', commentId));
    } catch (err) {
      console.warn('Firestore deleteWorkComment error:', err);
    }

    // Atomically decrement commentsCount on parent work document
    const workDocRef = doc(db, 'works', workId);
    try {
      await updateDoc(workDocRef, {
        commentsCount: increment(-1),
        updatedAt: new Date().toISOString(),
      });
    } catch {}
  }

  try {
    window.dispatchEvent(
      new CustomEvent('getnow:comments-updated', {
        detail: { workId, deletedCommentId: commentId, count: updatedLocal.length },
      })
    );
  } catch {}
}

// ================= NOTIFICATIONS SERVICE =================

/**
 * Send a notification to an uploader, commenter, or mentioned user.
 */
export async function sendUploaderNotification(data: {
  recipientUserId: string;
  senderUserId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'like' | 'comment' | 'reply' | 'mention' | 'update' | 'curatorial' | 'system' | 'recommendation' | 'follow';
  title: string;
  message: string;
  link: string;
  workId?: string;
  workSlug?: string;
  workTitle?: string;
  commentId?: string;
  replyToCommentId?: string;
}): Promise<LibraryNotification> {
  const notifId = `notif-${data.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  // Resolve reliable high-quality avatar for the notification
  let resolvedAvatar = data.senderAvatar;
  if (!resolvedAvatar) {
    try {
      const storedActive = localStorage.getItem('getnow_active_user_profile_v3');
      if (storedActive) {
        const parsed = JSON.parse(storedActive);
        if (parsed.photoURL && (parsed.uid === data.senderUserId || parsed.displayName?.toLowerCase() === data.senderName?.toLowerCase())) {
          resolvedAvatar = parsed.photoURL;
        }
      }
      if (!resolvedAvatar) {
        const storedAccounts = localStorage.getItem('getnow_registered_accounts_v3');
        if (storedAccounts) {
          const accounts = JSON.parse(storedAccounts);
          const match = accounts.find(
            (a: any) =>
              (data.senderUserId && a.profile?.uid === data.senderUserId) ||
              (data.senderName && a.profile?.displayName?.toLowerCase() === data.senderName.toLowerCase())
          );
          if (match?.profile?.photoURL) {
            resolvedAvatar = match.profile.photoURL;
          }
        }
      }
    } catch {}
  }
  if (!resolvedAvatar) {
    const seed = data.senderName || data.senderUserId || 'reader';
    resolvedAvatar = `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=d1d4f9`;
  }

  const notif: LibraryNotification = {
    id: notifId,
    recipientUserId: data.recipientUserId,
    senderUserId: data.senderUserId,
    senderName: data.senderName,
    senderAvatar: resolvedAvatar,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    workId: data.workId,
    workSlug: data.workSlug,
    workTitle: data.workTitle,
    commentId: data.commentId,
    replyToCommentId: data.replyToCommentId,
    unread: true,
    createdAt: new Date().toISOString(),
  };

  // Local storage backup for recipient
  const localNotifs = getLocalUserNotifications(data.recipientUserId);
  saveLocalUserNotifications(data.recipientUserId, [notif, ...localNotifs]);

  // Dispatch custom event for instant local UI reactivity
  try {
    window.dispatchEvent(new CustomEvent('getnow:new-notification', { detail: notif }));
  } catch {}

  // Firestore sync to /users/{recipientUserId}/notifications/{notifId}
  if (db) {
    try {
      const notifDocRef = doc(db, 'users', data.recipientUserId, 'notifications', notifId);
      await setDoc(notifDocRef, notif);
    } catch (err) {
      console.warn('Failed to send notification to uploader in Firestore:', err);
    }
  }

  return notif;
}

export const sendUserNotification = sendUploaderNotification;

/**
 * Real-time listener for user notifications.
 */
export function subscribeUserNotifications(
  userId: string,
  callback: (notifications: LibraryNotification[]) => void
): () => void {
  // Emit local cache immediately
  const initialLocal = getLocalUserNotifications(userId);
  callback(initialLocal);

  if (!db || !userId) {
    return () => {};
  }

  const notifsCol = collection(db, 'users', userId, 'notifications');
  const unsub = onSnapshot(
    notifsCol,
    (snapshot) => {
      const list: LibraryNotification[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as LibraryNotification);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      saveLocalUserNotifications(userId, list);
      callback(list);
    },
    (err) => {
      console.debug(`subscribeUserNotifications for ${userId}:`, err);
    }
  );

  return unsub;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(userId: string, notifId: string): Promise<void> {
  const local = getLocalUserNotifications(userId);
  saveLocalUserNotifications(
    userId,
    local.map((n) => (n.id === notifId ? { ...n, unread: false } : n))
  );

  if (db && userId) {
    try {
      const notifDoc = doc(db, 'users', userId, 'notifications', notifId);
      await updateDoc(notifDoc, { unread: false });
    } catch (err) {
      console.warn('markNotificationAsRead Firestore error:', err);
    }
  }
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const local = getLocalUserNotifications(userId);
  saveLocalUserNotifications(
    userId,
    local.map((n) => ({ ...n, unread: false }))
  );

  if (db && userId) {
    try {
      const notifsCol = collection(db, 'users', userId, 'notifications');
      const snap = await getDocs(notifsCol);
      const updates = snap.docs
        .filter((d) => d.data().unread === true)
        .map((d) => updateDoc(d.ref, { unread: false }));
      await Promise.allSettled(updates);
    } catch (err) {
      console.warn('markAllNotificationsAsRead Firestore error:', err);
    }
  }
}

/**
 * Delete a notification.
 */
export async function deleteNotification(userId: string, notifId: string): Promise<void> {
  const local = getLocalUserNotifications(userId);
  saveLocalUserNotifications(userId, local.filter((n) => n.id !== notifId));

  if (db && userId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'notifications', notifId));
    } catch (err) {
      console.warn('deleteNotification Firestore error:', err);
    }
  }
}

/**
 * Clear all notifications for a user.
 */
export async function clearAllNotifications(userId: string): Promise<void> {
  saveLocalUserNotifications(userId, []);

  if (db && userId) {
    try {
      const notifsCol = collection(db, 'users', userId, 'notifications');
      const snap = await getDocs(notifsCol);
      const deletions = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.allSettled(deletions);
    } catch (err) {
      console.warn('clearAllNotifications Firestore error:', err);
    }
  }
}
