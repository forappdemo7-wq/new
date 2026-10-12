import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { MediaCard } from '../components/catalog/MediaCard';
import {
  getPublicUserProfile,
  subscribeUserFollowers,
  subscribeUserFollowing,
  toggleFollowUser,
  isFollowingUser,
  isUserFollowingMe,
  getLocalFollowing,
  FollowUserItem,
} from '../services/followService';
import { getWorkLikesCount } from '../services/interactionService';
import { UserProfile, Work } from '../types';
import {
  User,
  Users,
  UserPlus,
  UserCheck,
  BookOpen,
  Heart,
  Share2,
  Calendar,
  Layers,
  Sparkles,
  Edit3,
  Search,
  Check,
  ArrowLeft,
  BookMarked,
  ShieldCheck,
} from 'lucide-react';

interface UserProfilePageProps {
  userId: string;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId }) => {
  const { navigate } = useRouter();
  const { currentUser, userProfile: activeUserProfile, openAuthModal, updateUserBioAndAvatar } = useAuth();
  const { works } = useLibrary();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<FollowUserItem[]>([]);
  const [following, setFollowing] = useState<FollowUserItem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedByProfile, setIsFollowedByProfile] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'uploads' | 'likes' | 'about'>('uploads');
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followSearchQuery, setFollowSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeUid = currentUser?.uid || activeUserProfile?.uid;
  const isOwnProfile = Boolean(activeUid && (activeUid === userId || activeUserProfile?.displayName?.toLowerCase() === userId?.toLowerCase()));

  // Active user's following map for instant modal and card reactivity
  const [activeFollowingMap, setActiveFollowingMap] = useState<Record<string, boolean>>(() => {
    if (!activeUid) return {};
    const list = getLocalFollowing(activeUid);
    const map: Record<string, boolean> = {};
    list.forEach((u) => { map[u.uid] = true; });
    return map;
  });

  useEffect(() => {
    if (!activeUid) return;
    const updateFollowMap = () => {
      const list = getLocalFollowing(activeUid);
      const map: Record<string, boolean> = {};
      list.forEach((u) => { map[u.uid] = true; });
      setActiveFollowingMap(map);
    };
    updateFollowMap();
    window.addEventListener('getnow:follow-updated', updateFollowMap);
    return () => window.removeEventListener('getnow:follow-updated', updateFollowMap);
  }, [activeUid]);

  // Edit Bio Modal state for own profile
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBioText, setEditBioText] = useState('');
  const [editNameText, setEditNameText] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [saveBioError, setSaveBioError] = useState<string | null>(null);

  // 1. Load user profile details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getPublicUserProfile(userId)
      .then((p) => {
        if (isMounted) {
          setProfile(p);
          if (p) {
            setEditBioText(p.bio || '');
            setEditNameText(p.displayName || '');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading public profile:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, activeUserProfile]);

  // 2. Real-time followers & following listeners
  useEffect(() => {
    if (!profile?.uid) return;

    const unsubFollowers = subscribeUserFollowers(profile.uid, (data) => {
      setFollowers(data);
    });

    const unsubFollowing = subscribeUserFollowing(profile.uid, (data) => {
      setFollowing(data);
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [profile?.uid]);

  // 3. Track whether active user is following this profile & vice-versa
  useEffect(() => {
    if (!profile?.uid || !activeUid) {
      setIsFollowing(false);
      setIsFollowedByProfile(false);
      return;
    }

    setIsFollowing(isFollowingUser(activeUid, profile.uid));
    setIsFollowedByProfile(isUserFollowingMe(profile.uid, activeUid));

    const handleFollowChange = (e: Event) => {
      const custom = e as CustomEvent;
      if (
        (custom.detail?.currentUserId === activeUid && custom.detail?.targetUserId === profile.uid) ||
        (custom.detail?.currentUserId === profile.uid && custom.detail?.targetUserId === activeUid)
      ) {
        setIsFollowing(isFollowingUser(activeUid, profile.uid));
        setIsFollowedByProfile(isUserFollowingMe(profile.uid, activeUid));
      }
    };

    window.addEventListener('getnow:follow-updated', handleFollowChange);
    return () => window.removeEventListener('getnow:follow-updated', handleFollowChange);
  }, [profile?.uid, activeUid]);

  // 4. Works uploaded / published by this user
  const uploadedWorks = useMemo(() => {
    if (!profile) return [];
    const targetUid = profile.uid;
    const targetEmail = profile.email?.toLowerCase();
    const targetName = profile.displayName?.toLowerCase();

    return works.filter((w: Work) => {
      const matchesUid = w.uploaderId === targetUid || w.publisherId === targetUid;
      const matchesEmail = Boolean(targetEmail && w.publisherEmail?.toLowerCase() === targetEmail);
      const matchesName = Boolean(targetName && (w.publisherName?.toLowerCase() === targetName || w.authors?.some(a => a.name?.toLowerCase() === targetName)));
      return matchesUid || matchesEmail || matchesName;
    });
  }, [works, profile]);

  // 5. Total likes received across this user's uploads
  const totalLikesReceived = useMemo(() => {
    return uploadedWorks.reduce((acc, w) => acc + getWorkLikesCount(w), 0);
  }, [uploadedWorks]);

  // 6. Works this user has liked
  const likedWorks = useMemo(() => {
    if (!profile?.uid) return [];
    return works.filter((w) => {
      try {
        const raw = localStorage.getItem(`getnow_work_likes_${w.id}`);
        if (!raw) return false;
        const list = JSON.parse(raw);
        return Array.isArray(list) && list.some((l: any) => l.userId === profile.uid);
      } catch {
        return false;
      }
    });
  }, [works, profile?.uid]);

  // Handle Follow / Unfollow
  const handleFollowToggle = async () => {
    if (!currentUser || currentUser.isAnonymous) {
      openAuthModal('signin');
      return;
    }

    if (!profile || isOwnProfile || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      const currentPayload = {
        uid: activeUid!,
        displayName: activeUserProfile?.displayName || currentUser?.displayName || 'Reader',
        photoURL: (activeUserProfile?.photoURL || currentUser?.photoURL) ?? undefined,
        bio: activeUserProfile?.bio,
      };

      const targetPayload = {
        uid: profile.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        bio: profile.bio,
      };

      const res = await toggleFollowUser(currentPayload, targetPayload);
      setIsFollowing(res.following);
    } catch (err: any) {
      console.warn('Follow toggle error:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle Share Profile
  const handleShareProfile = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      });
    }
  };

  // Handle Follow / Unfollow in modal list
  const handleModalFollowToggle = async (e: React.MouseEvent, target: FollowUserItem) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) {
      openAuthModal('signin');
      return;
    }
    if (!activeUid || target.uid === activeUid) return;

    try {
      const currentPayload = {
        uid: activeUid,
        displayName: activeUserProfile?.displayName || currentUser?.displayName || 'Reader',
        photoURL: (activeUserProfile?.photoURL || currentUser?.photoURL) ?? undefined,
        bio: activeUserProfile?.bio,
      };

      const targetPayload = {
        uid: target.uid,
        displayName: target.displayName,
        photoURL: target.photoURL,
        bio: target.bio,
      };

      await toggleFollowUser(currentPayload, targetPayload);
    } catch (err) {
      console.warn('Modal follow toggle error:', err);
    }
  };

  // Save Bio & Display Name
  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBio(true);
    setSaveBioError(null);

    try {
      await updateUserBioAndAvatar(
        editNameText.trim() || profile?.displayName || 'Reader',
        profile?.photoURL || '',
        editBioText.trim()
      );
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName: editNameText.trim() || prev.displayName,
              bio: editBioText.trim(),
            }
          : prev
      );
      setIsEditingBio(false);
    } catch (err: any) {
      setSaveBioError(err.message || 'Could not save profile changes.');
    } finally {
      setIsSavingBio(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5] dark:bg-[#12141A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#C25E3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-stone-500 dark:text-stone-400">Loading reader profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Reader Profile Not Found
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          The requested reader account could not be found or has not published any public profile information yet.
        </p>
        <button
          onClick={() => navigate('/user-uploads')}
          className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Community Uploads</span>
        </button>
      </div>
    );
  }

  const joinYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : 2026;
  const isCreator = uploadedWorks.length > 0;

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#12141A] min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">

        {/* ── Top Navigation Breadcrumb ────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleShareProfile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151820] text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-2xs transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link copied!' : 'Share Profile'}</span>
          </button>
        </div>

        {/* ── Profile Hero Card ────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden space-y-6">
          {/* Subtle Background Header Strip */}
          <div className="absolute top-0 inset-x-0 h-28 sm:h-32 bg-gradient-to-r from-stone-900 via-[#8B3A1E] to-[#C25E3A] opacity-90 pointer-events-none" />

          {/* User Info Container */}
          <div className="relative pt-12 sm:pt-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
              {/* Avatar with Glow Ring */}
              <div className="relative shrink-0">
                <img
                  src={profile.photoURL || `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(profile.displayName)}&backgroundColor=d1d4f9`}
                  alt={profile.displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white dark:ring-[#151820] shadow-lg bg-stone-100 dark:bg-stone-800"
                />
                {isCreator && (
                  <span
                    title="Community Creator"
                    className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-[#C25E3A] text-white shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Title, Handle, Bio */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-stone-50 tracking-tight">
                    {profile.displayName}
                  </h1>
                  {isCreator && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-[#C25E3A]/10 text-[#C25E3A] dark:bg-[#C25E3A]/20 dark:text-amber-400 border border-[#C25E3A]/20">
                      Creator
                    </span>
                  )}
                  {profile.role === 'admin' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Curator</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-mono text-stone-400 dark:text-stone-400">
                    @{profile.displayNameLower || profile.displayName.toLowerCase().replace(/\s+/g, '_')}
                  </p>
                  {isFollowedByProfile && !isOwnProfile && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 shadow-2xs">
                      <span>Follows you</span>
                    </span>
                  )}
                </div>

                {/* Bio Display */}
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-sans max-w-xl leading-relaxed pt-1">
                  {profile.bio ? (
                    profile.bio
                  ) : isOwnProfile ? (
                    <span className="italic text-stone-400 dark:text-stone-500">
                      You haven't written a bio yet. Click "Edit Profile &amp; Bio" to introduce yourself to readers!
                    </span>
                  ) : (
                    <span className="italic text-stone-400 dark:text-stone-500">
                      Avid reader and explorer of open literature, comics, and manga.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions: Follow/Unfollow OR Edit Profile */}
            <div className="shrink-0 flex items-center gap-2.5">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#C25E3A]" />
                  <span>Edit Bio &amp; Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                    isFollowing
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      : isFollowedByProfile
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-102 ring-2 ring-indigo-300 dark:ring-indigo-700'
                      : 'bg-[#C25E3A] hover:bg-[#a84e2e] text-white hover:scale-102'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : isFollowedByProfile ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow Back</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Social Stats Row */}
          <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center gap-6 sm:gap-8 flex-wrap text-xs sm:text-sm">
            <button
              onClick={() => setShowFollowModal('followers')}
              className="flex items-center gap-1.5 hover:text-[#C25E3A] transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-stone-400" />
              <span className="font-extrabold text-stone-950 dark:text-stone-50">{followers.length}</span>
              <span className="text-stone-500 dark:text-stone-400">Followers</span>
            </button>

            <button
              onClick={() => setShowFollowModal('following')}
              className="flex items-center gap-1.5 hover:text-[#C25E3A] transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-stone-400" />
              <span className="font-extrabold text-stone-950 dark:text-stone-50">{following.length}</span>
              <span className="text-stone-500 dark:text-stone-400">Following</span>
            </button>

            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-stone-400" />
              <span className="font-extrabold text-stone-950 dark:text-stone-50">{uploadedWorks.length}</span>
              <span className="text-stone-500 dark:text-stone-400">Published Works</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              <span className="font-extrabold text-stone-950 dark:text-stone-50">{totalLikesReceived}</span>
              <span className="text-stone-500 dark:text-stone-400">Likes Received</span>
            </div>

            <div className="flex items-center gap-1.5 text-stone-400">
              <Calendar className="w-4 h-4" />
              <span>Joined {joinYear}</span>
            </div>
          </div>
        </div>

        {/* ── Profile Content Tabs ─────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'uploads'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Uploaded Works ({uploadedWorks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('likes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'likes'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Liked Works ({likedWorks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'about'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>About &amp; Tastes</span>
          </button>
        </div>

        {/* ── TAB 1: UPLOADED WORKS ────────────────────────────────── */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            {uploadedWorks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {uploadedWorks.map((work) => (
                  <MediaCard key={work.id} work={work} />
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  No public works uploaded yet
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  {isOwnProfile
                    ? 'Publish a novel, comic chapter, or manga volume to showcase it here to your followers.'
                    : `${profile.displayName} hasn't published any community works yet.`}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/user-uploads')}
                    className="px-4 py-2 bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Publish Your First Work</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: LIKED WORKS ───────────────────────────────────── */}
        {activeTab === 'likes' && (
          <div className="space-y-4">
            {likedWorks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
                {likedWorks.map((work) => (
                  <MediaCard key={work.id} work={work} />
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/30 flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  No liked works yet
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Works appreciated with a like by {profile.displayName} will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ABOUT & TASTES ────────────────────────────────── */}
        {activeTab === 'about' && (
          <div className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-stone-950 dark:text-stone-50">
                Biography &amp; Statement
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {profile.bio || 'This reader has not added a detailed biography yet.'}
              </p>
            </div>

            {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-stone-200/60 dark:border-stone-800/60">
                <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">
                  Favorite Genres &amp; Formats
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.favoriteGenres.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 text-xs text-stone-500 dark:text-stone-400">
              <p>• Member of the GetNow open literary and sequential arts network.</p>
              <p>• Profile and published creations follow Creative Commons and Public Domain compliance standards.</p>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: FOLLOWERS / FOLLOWING LIST ──────────────────────── */}
      {showFollowModal && (
        <div
          onClick={() => setShowFollowModal(null)}
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C25E3A]" />
                <h3 className="font-serif text-lg font-bold text-stone-950 dark:text-stone-50">
                  {showFollowModal === 'followers' ? 'Followers' : 'Following'}
                </h3>
              </div>
              <button
                onClick={() => setShowFollowModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={followSearchQuery}
                onChange={(e) => setFollowSearchQuery(e.target.value)}
                placeholder="Search by reader name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#C25E3A]"
              />
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {(() => {
                const list = showFollowModal === 'followers' ? followers : following;
                const filtered = list.filter((u) =>
                  (u.displayName || '').toLowerCase().includes(followSearchQuery.toLowerCase().trim())
                );

                if (filtered.length === 0) {
                  return (
                    <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
                      {list.length === 0
                        ? `No ${showFollowModal} yet.`
                        : 'No matching readers found.'}
                    </div>
                  );
                }

                return filtered.map((u) => {
                  const isFollowingThisUser = activeUid ? Boolean(activeFollowingMap[u.uid]) : false;
                  const userFollowsMe = activeUid ? isUserFollowingMe(u.uid, activeUid) : false;
                  const isMe = activeUid === u.uid;

                  return (
                    <div
                      key={u.uid}
                      onClick={() => {
                        setShowFollowModal(null);
                        navigate(`/user/${u.uid}`);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800/60 transition-colors cursor-pointer group gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.photoURL || `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(u.displayName)}&backgroundColor=d1d4f9`}
                          alt={u.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#C25E3A] transition-colors truncate">
                              {u.displayName}
                            </span>
                            {userFollowsMe && !isMe && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded font-medium">
                                Follows you
                              </span>
                            )}
                          </div>
                          {u.bio && (
                            <span className="text-[11px] text-stone-400 line-clamp-1 block">
                              {u.bio}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isMe && activeUid && (
                          <button
                            type="button"
                            onClick={(e) => handleModalFollowToggle(e, u)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isFollowingThisUser
                                ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                                : userFollowsMe
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                                : 'bg-[#C25E3A] hover:bg-[#a84e2e] text-white shadow-2xs'
                            }`}
                          >
                            {isFollowingThisUser ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Following</span>
                              </>
                            ) : userFollowsMe ? (
                              <>
                                <UserPlus className="w-3 h-3" />
                                <span>Follow Back</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-xs text-stone-400 group-hover:text-[#C25E3A] font-medium hidden sm:inline">
                          View →
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT BIO & DISPLAY NAME (For Profile Owner) ────── */}
      {isEditingBio && (
        <div
          onClick={() => setIsEditingBio(false)}
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C25E3A]" />
                <h3 className="font-serif text-lg font-bold text-stone-950 dark:text-stone-50">
                  Edit Public Profile &amp; Bio
                </h3>
              </div>
              <button
                onClick={() => setIsEditingBio(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBio} className="space-y-4">
              {saveBioError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
                  {saveBioError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editNameText}
                  onChange={(e) => setEditNameText(e.target.value)}
                  placeholder="Your reader name..."
                  maxLength={40}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#C25E3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  About You &amp; Bio
                </label>
                <textarea
                  value={editBioText}
                  onChange={(e) => setEditBioText(e.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="Share a short bio about what you read, manga you enjoy, or stories you create..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#C25E3A] resize-none"
                />
                <span className="text-[10px] text-stone-400 block text-right mt-1 font-mono">
                  {editBioText.length}/300 characters
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBio}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C25E3A] hover:bg-[#a84e2e] text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingBio ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
