import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { UserProfile, Work } from '../types';
import { getLocalFollowers } from './followService';
import { getAllStoredAccounts } from '../context/AuthContext';

export interface SearchableUser {
  uid: string;
  displayName: string;
  displayNameLower: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  role: 'reader' | 'admin' | 'creator';
  worksCount: number;
  followersCount: number;
  isCreator: boolean;
  uploadedWorks: { id: string; title: string; type: string; slug: string }[];
}

const STATIC_CREATORS: Record<string, Partial<SearchableUser>> = {
  'user-creator-kenji': {
    uid: 'user-creator-kenji',
    displayName: 'Kenji Sato',
    displayNameLower: 'kenji sato',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=kenji-sato&backgroundColor=d1d4f9',
    bio: 'Digital manga illustrator & mangaka. Exploring dystopian cyberpunk lore, augmentations, and open-source sequential storytelling under CC0.',
    role: 'creator',
    isCreator: true,
  },
  'user-creator-elena': {
    uid: 'user-creator-elena',
    displayName: 'Elena Rostova',
    displayNameLower: 'elena rostova',
    photoURL: 'https://api.dicebear.com/7.x/micah/svg?seed=elena-rostova&backgroundColor=ffd5dc',
    bio: 'Independent steampunk & speculative fiction novelist. Architect of liquid-time chronite universes published under Creative Commons Attribution 4.0.',
    role: 'creator',
    isCreator: true,
  },
  'user-creator-maya': {
    uid: 'user-creator-maya',
    displayName: 'Maya Lin',
    displayNameLower: 'maya lin',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=maya-lin&backgroundColor=ffdfbf',
    bio: 'Botanical illustrator & graphic storyteller. Documenting bioluminescent forest guardians and mystical natural landscapes.',
    role: 'creator',
    isCreator: true,
  },
};

// In-memory cache of remote Firestore users
let remoteUsersCache: SearchableUser[] = [];
let hasFetchedRemote = false;

/**
 * Gather all known users from static creators, local storage registered accounts,
 * uploaded works, and remote Firestore cache.
 */
export function getAllKnownUsers(works: Work[] = []): SearchableUser[] {
  const userMap = new Map<string, SearchableUser>();

  // 1. Static creators
  Object.values(STATIC_CREATORS).forEach((c) => {
    if (c.uid) {
      userMap.set(c.uid, {
        uid: c.uid,
        displayName: c.displayName || 'Creator',
        displayNameLower: (c.displayName || '').toLowerCase(),
        photoURL: c.photoURL,
        bio: c.bio,
        role: 'creator',
        worksCount: 0,
        followersCount: getLocalFollowers(c.uid).length || 12,
        isCreator: true,
        uploadedWorks: [],
      });
    }
  });

  // 2. Local registered accounts
  try {
    const localAccounts = getAllStoredAccounts();
    localAccounts.forEach((acc) => {
      const prof = acc.profile;
      const uid = prof?.uid || `user-${acc.email.replace(/[^a-z0-9]/g, '-')}`;
      const name = prof?.displayName || acc.email.split('@')[0] || 'Reader';
      const existing = userMap.get(uid);

      if (!existing) {
        userMap.set(uid, {
          uid,
          displayName: name,
          displayNameLower: name.toLowerCase(),
          email: acc.email,
          photoURL: prof?.photoURL || `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=d1d4f9`,
          bio: prof?.bio || 'Passionate literature enthusiast and community reader.',
          role: prof?.role === 'admin' ? 'admin' : 'reader',
          worksCount: 0,
          followersCount: getLocalFollowers(uid).length,
          isCreator: false,
          uploadedWorks: [],
        });
      } else {
        existing.displayName = name;
        existing.displayNameLower = name.toLowerCase();
        if (prof?.photoURL) existing.photoURL = prof.photoURL;
        if (prof?.bio) existing.bio = prof.bio;
        if (prof?.role === 'admin') existing.role = 'admin';
      }
    });
  } catch (e) {
    console.debug('Error reading local accounts in userSearchService:', e);
  }

  // 3. Active user profile stored locally
  try {
    const rawActive = localStorage.getItem('getnow_active_user_profile_v3');
    if (rawActive) {
      const activeProf: UserProfile = JSON.parse(rawActive);
      if (activeProf.uid) {
        const uid = activeProf.uid;
        const name = activeProf.displayName || 'Reader';
        const existing = userMap.get(uid);
        if (!existing) {
          userMap.set(uid, {
            uid,
            displayName: name,
            displayNameLower: name.toLowerCase(),
            email: activeProf.email,
            photoURL: activeProf.photoURL || `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=d1d4f9`,
            bio: activeProf.bio || 'Avid book lover and open archive explorer.',
            role: activeProf.role === 'admin' ? 'admin' : 'reader',
            worksCount: 0,
            followersCount: getLocalFollowers(uid).length,
            isCreator: false,
            uploadedWorks: [],
          });
        }
      }
    }
  } catch {}

  // 4. Remote Firestore cache
  remoteUsersCache.forEach((ru) => {
    if (!userMap.has(ru.uid)) {
      userMap.set(ru.uid, { ...ru });
    } else {
      const existing = userMap.get(ru.uid)!;
      if (ru.bio) existing.bio = ru.bio;
      if (ru.photoURL) existing.photoURL = ru.photoURL;
      if (ru.displayName) {
        existing.displayName = ru.displayName;
        existing.displayNameLower = ru.displayName.toLowerCase();
      }
    }
  });

  // 5. Connect and map user-uploaded works
  if (Array.isArray(works) && works.length > 0) {
    works.forEach((w) => {
      const firstAuthor = w.authors?.[0];
      const authorStr = typeof firstAuthor === 'string' ? firstAuthor : firstAuthor?.name;
      const publisherName = w.publisherName || authorStr;
      const isCommunity =
        w.jurisdictionStatus === 'COMMUNITY_OPEN' ||
        w.sourceName === 'Community Self-Published' ||
        Boolean(w.publisherId) ||
        Boolean(w.uploaderId);
      const publisherUid = w.publisherId || w.uploaderId;
      if (!isCommunity && !publisherUid) return;

      const userTargetUid =
        publisherUid ||
        (publisherName ? `user-creator-${publisherName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : null);

      if (userTargetUid) {
        let u = userMap.get(userTargetUid);

        // Also check by display name
        if (!u && publisherName) {
          const lowerName = publisherName.toLowerCase();
          for (const cand of userMap.values()) {
            if (cand.displayNameLower === lowerName) {
              u = cand;
              break;
            }
          }
        }

        // If not found, create a new creator entry
        if (!u && publisherName) {
          const fallbackUid = userTargetUid;
          u = {
            uid: fallbackUid,
            displayName: publisherName,
            displayNameLower: publisherName.toLowerCase(),
            photoURL: `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(publisherName)}&backgroundColor=d1d4f9`,
            bio: `Self-publishing creator of "${w.title}" in the open catalog.`,
            role: 'creator',
            worksCount: 0,
            followersCount: getLocalFollowers(fallbackUid).length,
            isCreator: true,
            uploadedWorks: [],
          };
          userMap.set(fallbackUid, u);
        }

        if (u) {
          u.isCreator = true;
          if (u.role !== 'admin') u.role = 'creator';
          const alreadyAdded = u.uploadedWorks.some((item) => item.id === w.id);
          if (!alreadyAdded) {
            u.uploadedWorks.push({
              id: w.id,
              title: w.title,
              type: w.type,
              slug: w.slug || w.id,
            });
            u.worksCount = u.uploadedWorks.length;
          }
        }
      }
    });
  }

  // Update dynamic follower counts from localStorage
  userMap.forEach((u) => {
    const count = getLocalFollowers(u.uid).length;
    if (count > u.followersCount) {
      u.followersCount = count;
    }
  });

  return Array.from(userMap.values());
}

/**
 * Fetch remote users from Firestore once asynchronously to enrich results.
 */
export async function syncRemoteUsersFromFirestore(): Promise<void> {
  if (!db || hasFetchedRemote) return;
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: SearchableUser[] = [];
    snap.forEach((d) => {
      const data = d.data();
      const uid = d.id;
      const name = data.displayName || data.name || 'Reader';
      list.push({
        uid,
        displayName: name,
        displayNameLower: name.toLowerCase(),
        email: data.email,
        photoURL: data.photoURL,
        bio: data.bio || '',
        role: data.role === 'admin' ? 'admin' : (data.role === 'creator' ? 'creator' : 'reader'),
        worksCount: 0,
        followersCount: getLocalFollowers(uid).length,
        isCreator: Boolean(data.role === 'creator'),
        uploadedWorks: [],
      });
    });
    remoteUsersCache = list;
    hasFetchedRemote = true;
  } catch (err) {
    console.debug('Firestore remote users sync error:', err);
  }
}

/**
 * Synchronous local user search matching query string against username, bio, ID, email.
 */
export function searchUsers(query: string, works: Work[] = []): SearchableUser[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  // Remove leading @ if user typed @username
  const q = clean.startsWith('@') ? clean.slice(1).trim() : clean;
  if (!q) return [];

  const allUsers = getAllKnownUsers(works);

  interface ScoredUser {
    user: SearchableUser;
    score: number;
  }

  const scored: ScoredUser[] = [];

  for (const user of allUsers) {
    let score = 0;
    const nameLower = user.displayNameLower;
    const uidLower = user.uid.toLowerCase();
    const emailLower = (user.email || '').toLowerCase();
    const bioLower = (user.bio || '').toLowerCase();

    // Exact username match
    if (nameLower === q) {
      score += 150;
    } else if (nameLower.startsWith(q)) {
      score += 90;
    } else if (nameLower.split(/\s+/).some((part) => part.startsWith(q))) {
      score += 70;
    } else if (nameLower.includes(q)) {
      score += 50;
    }

    // UID match (e.g. user-creator-kenji, user-123)
    if (uidLower === q) {
      score += 100;
    } else if (uidLower.includes(q)) {
      score += 40;
    }

    // Email prefix match
    if (emailLower.includes(q)) {
      score += 35;
    }

    // Bio keyword match
    if (bioLower.includes(q)) {
      score += 20;
    }

    // Creator / Uploads bonus
    if (user.worksCount > 0) {
      score += 10;
    }
    if (user.followersCount > 0) {
      score += Math.min(15, user.followersCount);
    }

    if (score > 0) {
      scored.push({ user, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.user);
}

/**
 * Async user search that triggers remote fetch if not yet loaded.
 */
export async function searchUsersAsync(query: string, works: Work[] = []): Promise<SearchableUser[]> {
  await syncRemoteUsersFromFirestore();
  return searchUsers(query, works);
}
