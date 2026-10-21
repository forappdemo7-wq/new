import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  BookOpen,
  ShieldCheck,
  Layers,
  X,
  Bookmark,
  Heart,
  MessageSquare,
  CornerDownRight,
  AtSign,
  UserPlus,
  UserCheck,
  Check,
} from 'lucide-react';
import { LibraryNotification } from '../../types';
import {
  subscribeUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  getLocalUserNotifications,
} from '../../services/interactionService';
import {
  toggleFollowUser,
  getLocalFollowing,
} from '../../services/followService';

function formatNotifTime(isoOrText?: string): string {
  if (!isoOrText) return 'Recently';
  if (!isoOrText.includes('T') && !isoOrText.includes('-')) return isoOrText;

  try {
    const date = new Date(isoOrText);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoOrText;
  }
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => {
      ctx.close().catch(() => {});
    };
  } catch {}
}

function NotificationAvatar({ notif }: { notif: LibraryNotification }) {
  const [imgError, setImgError] = useState(false);

  const resolvedAvatar = React.useMemo(() => {
    if (notif.senderAvatar) return notif.senderAvatar;

    try {
      // 1. Check active user profile
      const storedActive = localStorage.getItem('getnow_active_user_profile_v3');
      if (storedActive) {
        const parsed = JSON.parse(storedActive);
        if (
          parsed.photoURL &&
          ((notif.senderUserId && parsed.uid === notif.senderUserId) ||
            (notif.senderName && parsed.displayName?.toLowerCase() === notif.senderName.toLowerCase()))
        ) {
          return parsed.photoURL;
        }
      }

      // 2. Check registered accounts list
      const storedAccounts = localStorage.getItem('getnow_registered_accounts_v3');
      if (storedAccounts) {
        const accounts = JSON.parse(storedAccounts);
        const match = accounts.find(
          (a: any) =>
            (notif.senderUserId && a.profile?.uid === notif.senderUserId) ||
            (notif.senderName && a.profile?.displayName?.toLowerCase() === notif.senderName.toLowerCase())
        );
        if (match?.profile?.photoURL) {
          return match.profile.photoURL;
        }
      }
    } catch {}

    const seed = notif.senderName || notif.senderUserId || 'reader';
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=d1d4f9`;
  }, [notif.senderAvatar, notif.senderUserId, notif.senderName]);

  const fallbackUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(
    notif.senderName || 'reader'
  )}&backgroundColor=d1d4f9`;

  const getActionBadge = () => {
    switch (notif.type) {
      case 'reply':
        return (
          <span className="p-0.5 rounded-full bg-emerald-500 text-white shadow-2xs flex items-center justify-center">
            <CornerDownRight className="w-2.5 h-2.5" />
          </span>
        );
      case 'mention':
        return (
          <span className="p-0.5 rounded-full bg-purple-500 text-white shadow-2xs flex items-center justify-center">
            <AtSign className="w-2.5 h-2.5" />
          </span>
        );
      case 'like':
        return (
          <span className="p-0.5 rounded-full bg-rose-500 text-white shadow-2xs flex items-center justify-center">
            <Heart className="w-2.5 h-2.5 fill-white text-white" />
          </span>
        );
      case 'follow':
        return (
          <span className="p-0.5 rounded-full bg-indigo-600 text-white shadow-2xs flex items-center justify-center">
            <UserPlus className="w-2.5 h-2.5 text-white" />
          </span>
        );
      case 'comment':
        return (
          <span className="p-0.5 rounded-full bg-blue-500 text-white shadow-2xs flex items-center justify-center">
            <MessageSquare className="w-2.5 h-2.5 fill-white text-white" />
          </span>
        );
      case 'curatorial':
        return (
          <span className="p-0.5 rounded-full bg-emerald-600 text-white shadow-2xs flex items-center justify-center">
            <ShieldCheck className="w-2.5 h-2.5 text-white" />
          </span>
        );
      case 'recommendation':
        return (
          <span className="p-0.5 rounded-full bg-amber-500 text-white shadow-2xs flex items-center justify-center">
            <Bookmark className="w-2.5 h-2.5 fill-white text-white" />
          </span>
        );
      case 'system':
        return (
          <span className="p-0.5 rounded-full bg-sky-500 text-white shadow-2xs flex items-center justify-center">
            <Layers className="w-2.5 h-2.5 text-white" />
          </span>
        );
      default:
        return (
          <span className="p-0.5 rounded-full bg-[#C25E3A] text-white shadow-2xs flex items-center justify-center">
            <BookOpen className="w-2.5 h-2.5 text-white" />
          </span>
        );
    }
  };

  return (
    <div className="relative shrink-0 mt-0.5">
      <img
        src={imgError ? fallbackUrl : resolvedAvatar}
        alt={notif.senderName || 'User profile'}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-200 dark:ring-stone-700/80 shadow-xs bg-stone-100 dark:bg-stone-800"
      />
      <span className="absolute -bottom-1 -right-1 ring-2 ring-white dark:ring-[#151820] rounded-full">
        {getActionBadge()}
      </span>
    </div>
  );
}

export const NotificationDropdown: React.FC = () => {
  const { navigate } = useRouter();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Real user ID: either authenticated user or current guest session
  const activeUserId = currentUser?.uid || userProfile?.uid || 'guest-session';

  const [notifications, setNotifications] = useState<LibraryNotification[]>(() => {
    return getLocalUserNotifications(activeUserId);
  });

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const list = getLocalFollowing(activeUserId);
    const map: Record<string, boolean> = {};
    list.forEach((u) => {
      map[u.uid] = true;
    });
    return map;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'social' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync when activeUserId changes
  useEffect(() => {
    setNotifications(getLocalUserNotifications(activeUserId));
    const list = getLocalFollowing(activeUserId);
    const map: Record<string, boolean> = {};
    list.forEach((u) => {
      map[u.uid] = true;
    });
    setFollowingMap(map);
  }, [activeUserId]);

  // Sync follow state on events
  useEffect(() => {
    const updateFollowMap = () => {
      const list = getLocalFollowing(activeUserId);
      const map: Record<string, boolean> = {};
      list.forEach((u) => {
        map[u.uid] = true;
      });
      setFollowingMap(map);
    };

    window.addEventListener('getnow:follow-updated', updateFollowMap);
    return () => window.removeEventListener('getnow:follow-updated', updateFollowMap);
  }, [activeUserId]);

  // Real-time synchronization of notifications for the real user from Firestore
  useEffect(() => {
    if (!activeUserId) return;

    const unsub = subscribeUserNotifications(activeUserId, (remoteList) => {
      setNotifications(remoteList);
    });

    return () => unsub();
  }, [activeUserId]);

  // Listen to in-app custom notification events for instant reactivity
  useEffect(() => {
    const handleNewNotif = (e: any) => {
      const notif = e.detail as LibraryNotification;
      if (!notif) return;

      // Only display notifications directed to this real user
      if (notif.recipientUserId === activeUserId) {
        playNotificationChime();
        setNotifications((prev) => [notif, ...prev.filter((p) => p.id !== notif.id)]);
      }
    };

    window.addEventListener('getnow:new-notification', handleNewNotif);
    return () => window.removeEventListener('getnow:new-notification', handleNewNotif);
  }, [activeUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (activeUserId) {
      await markAllNotificationsAsRead(activeUserId);
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    if (activeUserId) {
      await clearAllNotifications(activeUserId);
    }
  };

  const markAsReadAndNavigate = async (notif: LibraryNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    if (activeUserId) {
      await markNotificationAsRead(activeUserId, notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, notif: LibraryNotification) => {
    e.stopPropagation();
    if (!notif.senderUserId) return;

    if (!currentUser || currentUser.isAnonymous) {
      openAuthModal('signin');
      return;
    }

    try {
      const currentPayload = {
        uid: activeUserId,
        displayName: userProfile?.displayName || currentUser?.displayName || 'Reader',
        photoURL: (userProfile?.photoURL || currentUser?.photoURL) ?? undefined,
        bio: userProfile?.bio,
      };

      const targetPayload = {
        uid: notif.senderUserId,
        displayName: notif.senderName || 'Reader',
        photoURL: notif.senderAvatar,
      };

      const res = await toggleFollowUser(currentPayload, targetPayload);
      setFollowingMap((prev) => ({
        ...prev,
        [notif.senderUserId!]: res.following,
      }));

      // Mark notification as read
      markNotificationAsRead(activeUserId, notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
      );
    } catch (err) {
      console.warn('Follow back error:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return n.unread;
    if (activeTab === 'social')
      return (
        n.type === 'like' ||
        n.type === 'comment' ||
        n.type === 'reply' ||
        n.type === 'mention' ||
        n.type === 'follow'
      );
    return true;
  });

  const getIconForType = (type: LibraryNotification['type']) => {
    switch (type) {
      case 'reply':
        return <CornerDownRight className="w-4 h-4 text-emerald-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'curatorial':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'recommendation':
        return <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'system':
        return <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-[#C25E3A]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        className="p-2.5 sm:p-3 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800/60 rounded-xl transition-colors relative cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-[#C25E3A] rounded-full ring-2 ring-[#FAF8F5] dark:ring-[#12141A] shadow-2xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Overlay Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-[420px] bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-[#1A1D26]">
            <div className="flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-[#C25E3A]" />
              <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C25E3A]/10 text-[#C25E3A] dark:bg-[#C25E3A]/20 dark:text-amber-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="p-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Read All</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Clear all notifications"
                  className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selection Row */}
          <div className="flex items-center justify-between gap-1 px-3 py-2 border-b border-stone-100 dark:border-stone-800/60 text-xs bg-white dark:bg-[#151820]">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-[11px] whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'social'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Heart className="w-3 h-3 fill-current" />
                <span>Replies &amp; Mentions</span>
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                  activeTab === 'unread'
                    ? 'bg-[#C25E3A] text-white font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsReadAndNavigate(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                    notif.unread
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/40 dark:hover:bg-amber-900/30'
                      : 'hover:bg-stone-50/80 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <NotificationAvatar notif={notif} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider ${
                            notif.type === 'reply'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : notif.type === 'mention'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                              : notif.type === 'like'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                              : notif.type === 'follow'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}
                        >
                          {notif.type}
                        </span>
                        <h4
                          className={`text-xs font-bold truncate ${
                            notif.unread
                              ? 'text-stone-950 dark:text-white'
                              : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {notif.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0 font-mono">
                        {formatNotifTime(notif.createdAt || notif.time)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    {/* Interactive Follow-Back action row */}
                    {notif.type === 'follow' && notif.senderUserId && notif.senderUserId !== activeUserId && (
                      <div className="pt-1.5 flex items-center gap-2">
                        {followingMap[notif.senderUserId] ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>Following back</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleFollowBack(e, notif)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-xs transition-all cursor-pointer hover:scale-102"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Follow Back</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            navigate(`/user/${notif.senderUserId}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>View Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {notif.unread && (
                    <span className="w-2 h-2 rounded-full bg-[#C25E3A] shrink-0 mt-2" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-stone-400 dark:text-stone-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto stroke-1 text-stone-300 dark:text-stone-600" />
                <p>
                  {activeTab === 'unread'
                    ? 'No unread notifications.'
                    : 'No notifications yet. You will be alerted when other users reply to your comments, mention you, or interact with your published works.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
