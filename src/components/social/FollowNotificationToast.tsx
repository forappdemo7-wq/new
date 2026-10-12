import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { LibraryNotification } from '../../types';
import {
  toggleFollowUser,
  getLocalFollowing,
} from '../../services/followService';
import {
  markNotificationAsRead,
} from '../../services/interactionService';
import { UserPlus, Check, X, User } from 'lucide-react';

export const FollowNotificationToast: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [activeToast, setActiveToast] = useState<LibraryNotification | null>(null);
  const [isFollowingBack, setIsFollowingBack] = useState(false);
  const [hasFollowedBack, setHasFollowedBack] = useState(false);

  const activeUserId = currentUser?.uid || userProfile?.uid;

  useEffect(() => {
    const handleNewNotif = (e: any) => {
      const notif = e.detail as LibraryNotification;
      if (!notif) return;

      // Only trigger toast for 'follow' notifications directed to current user
      if (notif.type === 'follow' && activeUserId && notif.recipientUserId === activeUserId) {
        // Check if already following them
        const followingList = getLocalFollowing(activeUserId);
        const alreadyFollowing = notif.senderUserId
          ? followingList.some((u) => u.uid === notif.senderUserId)
          : false;

        setHasFollowedBack(alreadyFollowing);
        setIsFollowingBack(false);
        setActiveToast(notif);
      }
    };

    window.addEventListener('getnow:new-notification', handleNewNotif);
    return () => window.removeEventListener('getnow:new-notification', handleNewNotif);
  }, [activeUserId]);

  // Auto-dismiss after 9 seconds if not interacted
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const handleFollowBack = async () => {
    if (!activeToast.senderUserId || !activeUserId) return;

    if (!currentUser || currentUser.isAnonymous) {
      openAuthModal('signin');
      return;
    }

    setIsFollowingBack(true);
    try {
      const currentPayload = {
        uid: activeUserId,
        displayName: userProfile?.displayName || currentUser?.displayName || 'Reader',
        photoURL: (userProfile?.photoURL || currentUser?.photoURL) ?? undefined,
        bio: userProfile?.bio,
      };

      const targetPayload = {
        uid: activeToast.senderUserId,
        displayName: activeToast.senderName || 'Reader',
        photoURL: activeToast.senderAvatar,
      };

      await toggleFollowUser(currentPayload, targetPayload);
      setHasFollowedBack(true);
      await markNotificationAsRead(activeUserId, activeToast.id);

      // Auto close after 2.5 seconds upon success
      setTimeout(() => {
        setActiveToast(null);
      }, 2500);
    } catch (err) {
      console.warn('Toast follow back error:', err);
    } finally {
      setIsFollowingBack(false);
    }
  };

  const handleViewProfile = () => {
    if (!activeToast.senderUserId) return;
    if (activeUserId) {
      markNotificationAsRead(activeUserId, activeToast.id);
    }
    const target = activeToast.senderUserId;
    setActiveToast(null);
    navigate(`/user/${target}`);
  };

  const avatarUrl =
    activeToast.senderAvatar ||
    `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(
      activeToast.senderName || 'reader'
    )}&backgroundColor=d1d4f9`;

  return (
    <aside
      aria-label="New Follower Notification"
      className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] bg-white dark:bg-[#1A1D26] border border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-200 ring-1 ring-black/5"
    >
      <div className="flex items-start gap-3">
        {/* Avatar with Follow badge */}
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={activeToast.senderName || 'New follower'}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/30 dark:ring-indigo-400/30"
          />
          <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-indigo-600 text-white ring-2 ring-white dark:ring-[#1A1D26]">
            <UserPlus className="w-2.5 h-2.5" />
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              New Follower
            </span>
            <button
              onClick={() => setActiveToast(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
            {activeToast.title || `${activeToast.senderName || 'A reader'} started following you!`}
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-snug">
            {activeToast.message || 'Would you like to give them a follow back?'}
          </p>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            {hasFollowedBack ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3.5 h-3.5" />
                <span>Following back</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleFollowBack}
                disabled={isFollowingBack}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isFollowingBack ? 'Following...' : 'Follow Back'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleViewProfile}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>View Profile</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
