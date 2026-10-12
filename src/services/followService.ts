import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { UserProfile, Work } from '../types';
import { sendUploaderNotification } from './interactionService';
import { INITIAL_COMMUNITY_WORKS } from '../data/communityWorks';

export interface FollowUserItem {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  followedAt: string;
}

// ================= LOCAL STORAGE RESILIENCE =================

export function getLocalFollowers(userId: string): FollowUserItem[] {
  try {
    const raw = localStorage.getItem(`getnow_followers_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFollowers(userId: string, followers: FollowUserItem[]): void {
  try {
    localStorage.setItem(`getnow_followers_${userId}`, JSON.stringify(followers));
  } catch {}
}

export function getLocalFollowing(userId: string): FollowUserItem[] {
  try {
    const raw = localStorage.getItem(`getnow_following_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFollowing(userId: string, following: FollowUserItem[]): void {
  try {
    localStorage.setItem(`getnow_following_${userId}`, JSON.stringify(following));
  } catch {}
}

// ================= PUBLIC USER RESOLUTION =================

const CREATOR_PROFILES: Record<string, Partial<UserProfile>> = {
  'user-creator-kenji': {
    uid: 'user-creator-kenji',
    displayName: 'Kenji Sato',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=kenji-sato&backgroundColor=d1d4f9',
    bio: 'Digital manga illustrator & mangaka. Exploring dystopian cyberpunk lore, augmentations, and open-source sequential storytelling under CC0.',
    role: 'reader',
    favoriteGenres: ['Manga', 'Cyberpunk', 'Action', 'Sci-Fi'],
    createdAt: '2026-01-15T00:00:00Z',
  },
  'user-creator-elena': {
    uid: 'user-creator-elena',
    displayName: 'Elena Rostova',
    photoURL: 'https://api.dicebear.com/7.x/micah/svg?seed=elena-rostova&backgroundColor=ffd5dc',
    bio: 'Independent steampunk & speculative fiction novelist. Architect of liquid-time chronite universes published under Creative Commons Attribution 4.0.',
    role: 'reader',
    favoriteGenres: ['Steampunk', 'Fantasy', 'Speculative Fiction'],
    createdAt: '2026-01-10T00:00:00Z',
  },
  'user-creator-maya': {
    uid: 'user-creator-maya',
    displayName: 'Maya Lin',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=maya-lin&backgroundColor=ffdfbf',
    bio: 'Botanical illustrator & graphic storyteller. Documenting bioluminescent forest guardians and mystical natural landscapes.',
    role: 'reader',
    favoriteGenres: ['Comics', 'Nature', 'Fantasy', 'Adventure'],
    createdAt: '2026-02-01T00:00:00Z',
  },
};

/**
 * Resolves a public user profile from Firestore, local registered accounts, or community creators.
 */
export async function getPublicUserProfile(userId: string): Promise<UserProfile | null> {
  const cleanId = userId?.trim();
  if (!cleanId) return null;

  // 1. Check known community creators
  if (CREATOR_PROFILES[cleanId]) {
    const creator = CREATOR_PROFILES[cleanId];
    return {
      uid: cleanId,
      displayName: creator.displayName || 'Creator',
      displayNameLower: (creator.displayName || '').toLowerCase(),
      photoURL: creator.photoURL,
      bio: creator.bio,
      role: creator.role || 'reader',
      favoriteGenres: creator.favoriteGenres || [],
      createdAt: creator.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // 2. Check active user profile stored locally
  try {
    const storedActive = localStorage.getItem('getnow_active_user_profile_v3');
    if (storedActive) {
      const parsed: UserProfile = JSON.parse(storedActive);
      if (parsed.uid === cleanId || parsed.displayName?.toLowerCase() === cleanId.toLowerCase()) {
        return parsed;
      }
    }
  } catch {}

  // 3. Check registered accounts list
  try {
    const storedAccounts = localStorage.getItem('getnow_registered_accounts_v3');
    if (storedAccounts) {
      const accounts = JSON.parse(storedAccounts);
      const match = accounts.find(
        (a: any) =>
          a.profile?.uid === cleanId ||
          a.profile?.displayName?.toLowerCase() === cleanId.toLowerCase() ||
          a.email?.toLowerCase() === cleanId.toLowerCase()
      );
      if (match?.profile) {
        return match.profile;
      }
    }
  } catch {}

  // 4. Check Firestore 'users' collection
  if (db) {
    try {
      const userDoc = await getDoc(doc(db, 'users', cleanId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }

      // Check username collection mapping
      const usernameDoc = await getDoc(doc(db, 'usernames', cleanId.toLowerCase()));
      if (usernameDoc.exists()) {
        const uData = usernameDoc.data();
        if (uData.uid) {
          const userFromUid = await getDoc(doc(db, 'users', uData.uid));
          if (userFromUid.exists()) {
            return userFromUid.data() as UserProfile;
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching public user profile from Firestore:', err);
    }
  }

  // 5. Fallback derived profile for community or legacy IDs
  const readableName = cleanId.replace(/^user-creator-/, '').replace(/^user-/, '').replace(/[-_]/g, ' ');
  const capitalized = readableName.charAt(0).toUpperCase() + readableName.slice(1);
  return {
    uid: cleanId,
    displayName: capitalized || 'Reader',
    displayNameLower: (capitalized || '').toLowerCase(),
    photoURL: `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(cleanId)}&backgroundColor=d1d4f9`,
    bio: 'Avid reader and explorer of open literature, comics, and manga.',
    role: 'reader',
    favoriteGenres: ['Classics', 'Manga', 'Fiction'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ================= FOLLOW & UNFOLLOW METHODS =================

/**
 * Checks if target user is following current user (so current user can see 'Follows you' / 'Follow Back').
 */
export function isUserFollowingMe(targetUserId: string | undefined, currentUserId: string | undefined): boolean {
  if (!targetUserId || !currentUserId || targetUserId === currentUserId) return false;
  const followersList = getLocalFollowers(currentUserId);
  return followersList.some((u) => u.uid === targetUserId);
}

/**
 * Checks if current user is following target user.
 */
export function isFollowingUser(currentUserId: string | undefined, targetUserId: string): boolean {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) return false;
  const followingList = getLocalFollowing(currentUserId);
  return followingList.some((u) => u.uid === targetUserId);
}

/**
 * Toggle follow/unfollow for a target user.
 */
export async function toggleFollowUser(
  currentUser: { uid: string; displayName: string; photoURL?: string; bio?: string },
  targetUser: { uid: string; displayName: string; photoURL?: string; bio?: string }
): Promise<{ following: boolean; followersCount: number }> {
  const currentUserId = currentUser.uid;
  const targetUserId = targetUser.uid;

  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself.');
  }

  const existingFollowing = getLocalFollowing(currentUserId);
  const existingFollowers = getLocalFollowers(targetUserId);

  const isCurrentlyFollowing = existingFollowing.some((u) => u.uid === targetUserId);
  const willFollow = !isCurrentlyFollowing;

  const now = new Date().toISOString();

  // Optimistic updates
  let updatedFollowing: FollowUserItem[];
  let updatedFollowers: FollowUserItem[];

  if (willFollow) {
    updatedFollowing = [
      {
        uid: targetUserId,
        displayName: targetUser.displayName || 'Reader',
        photoURL: targetUser.photoURL,
        bio: targetUser.bio,
        followedAt: now,
      },
      ...existingFollowing.filter((u) => u.uid !== targetUserId),
    ];

    updatedFollowers = [
      {
        uid: currentUserId,
        displayName: currentUser.displayName || 'Reader',
        photoURL: currentUser.photoURL,
        bio: currentUser.bio,
        followedAt: now,
      },
      ...existingFollowers.filter((u) => u.uid !== currentUserId),
    ];
  } else {
    updatedFollowing = existingFollowing.filter((u) => u.uid !== targetUserId);
    updatedFollowers = existingFollowers.filter((u) => u.uid !== currentUserId);
  }

  saveLocalFollowing(currentUserId, updatedFollowing);
  saveLocalFollowers(targetUserId, updatedFollowers);

  // Dispatch global window event for instant cross-component updates
  try {
    window.dispatchEvent(
      new CustomEvent('getnow:follow-updated', {
        detail: {
          currentUserId,
          targetUserId,
          following: willFollow,
          followersCount: updatedFollowers.length,
        },
      })
    );
  } catch {}

  // Send in-app notification to target user on follow
  if (willFollow && !targetUserId.startsWith('author-')) {
    const isFollowBack =
      getLocalFollowers(currentUserId).some((u) => u.uid === targetUserId) ||
      getLocalFollowing(targetUserId).some((u) => u.uid === currentUserId);
    const title = isFollowBack ? 'Followed you back!' : 'New Follower!';
    const message = isFollowBack
      ? `${currentUser.displayName} followed you back!`
      : `${currentUser.displayName} started following you. Would you like to follow them back?`;

    sendUploaderNotification({
      recipientUserId: targetUserId,
      senderUserId: currentUserId,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.photoURL,
      type: 'follow',
      title,
      message,
      link: `/user/${currentUserId}`,
    }).catch((err) => console.warn('Follow notification error:', err));
  }

  // Sync to Firestore
  if (db) {
    try {
      const followerDocRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
      const followingDocRef = doc(db, 'users', currentUserId, 'following', targetUserId);

      if (willFollow) {
        await Promise.all([
          setDoc(followerDocRef, {
            uid: currentUserId,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL || '',
            bio: currentUser.bio || '',
            followedAt: now,
          }),
          setDoc(followingDocRef, {
            uid: targetUserId,
            displayName: targetUser.displayName,
            photoURL: targetUser.photoURL || '',
            bio: targetUser.bio || '',
            followedAt: now,
          }),
        ]);
      } else {
        await Promise.all([
          deleteDoc(followerDocRef),
          deleteDoc(followingDocRef),
        ]);
      }
    } catch (err) {
      console.warn('Firestore toggleFollowUser error:', err);
    }
  }

  return { following: willFollow, followersCount: updatedFollowers.length };
}

/**
 * Subscribes to followers list of a user.
 */
export function subscribeUserFollowers(
  userId: string,
  callback: (followers: FollowUserItem[]) => void
): () => void {
  // Emit local cache immediately
  const initial = getLocalFollowers(userId);
  callback(initial);

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.targetUserId === userId) {
      callback(getLocalFollowers(userId));
    }
  };
  window.addEventListener('getnow:follow-updated', handleUpdate);

  if (!db) {
    return () => window.removeEventListener('getnow:follow-updated', handleUpdate);
  }

  const followersCol = collection(db, 'users', userId, 'followers');
  const unsub = onSnapshot(
    followersCol,
    (snapshot) => {
      const remote: FollowUserItem[] = [];
      snapshot.forEach((d) => remote.push(d.data() as FollowUserItem));

      const local = getLocalFollowers(userId);
      const map = new Map<string, FollowUserItem>();
      local.forEach((u) => map.set(u.uid, u));
      remote.forEach((u) => map.set(u.uid, u));

      const merged = Array.from(map.values());
      saveLocalFollowers(userId, merged);
      callback(merged);
    },
    (err) => {
      console.debug(`subscribeUserFollowers for ${userId}:`, err);
    }
  );

  return () => {
    unsub();
    window.removeEventListener('getnow:follow-updated', handleUpdate);
  };
}

/**
 * Subscribes to following list of a user.
 */
export function subscribeUserFollowing(
  userId: string,
  callback: (following: FollowUserItem[]) => void
): () => void {
  const initial = getLocalFollowing(userId);
  callback(initial);

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.currentUserId === userId) {
      callback(getLocalFollowing(userId));
    }
  };
  window.addEventListener('getnow:follow-updated', handleUpdate);

  if (!db) {
    return () => window.removeEventListener('getnow:follow-updated', handleUpdate);
  }

  const followingCol = collection(db, 'users', userId, 'following');
  const unsub = onSnapshot(
    followingCol,
    (snapshot) => {
      const remote: FollowUserItem[] = [];
      snapshot.forEach((d) => remote.push(d.data() as FollowUserItem));

      const local = getLocalFollowing(userId);
      const map = new Map<string, FollowUserItem>();
      local.forEach((u) => map.set(u.uid, u));
      remote.forEach((u) => map.set(u.uid, u));

      const merged = Array.from(map.values());
      saveLocalFollowing(userId, merged);
      callback(merged);
    },
    (err) => {
      console.debug(`subscribeUserFollowing for ${userId}:`, err);
    }
  );

  return () => {
    unsub();
    window.removeEventListener('getnow:follow-updated', handleUpdate);
  };
}
