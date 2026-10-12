import React, { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { SearchableUser } from '../../services/userSearchService';
import {
  isFollowingUser,
  toggleFollowUser,
  getLocalFollowers,
} from '../../services/followService';
import {
  User,
  Users,
  UserCheck,
  UserPlus,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface UserCardProps {
  user: SearchableUser;
  onSelect?: () => void;
  compact?: boolean;
}

export const UserSearchCard: React.FC<UserCardProps> = ({ user, onSelect, compact = false }) => {
  const { navigate } = useRouter();
  const { currentUser, userProfile: activeUserProfile, openAuthModal } = useAuth();
  const activeUid = currentUser?.uid || activeUserProfile?.uid;

  const [following, setFollowing] = useState(() => isFollowingUser(activeUid, user.uid));
  const [followersCount, setFollowersCount] = useState(() => getLocalFollowers(user.uid).length || user.followersCount);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    setFollowing(isFollowingUser(activeUid, user.uid));
    setFollowersCount(getLocalFollowers(user.uid).length || user.followersCount);

    const handleUpdate = () => {
      setFollowing(isFollowingUser(activeUid, user.uid));
      setFollowersCount(getLocalFollowers(user.uid).length || user.followersCount);
    };
    window.addEventListener('getnow:follow-updated', handleUpdate);
    return () => window.removeEventListener('getnow:follow-updated', handleUpdate);
  }, [activeUid, user.uid, user.followersCount]);

  const isSelf = Boolean(activeUid && activeUid === user.uid);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.isAnonymous) {
      openAuthModal('signin');
      return;
    }
    if (isSelf || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      const currentSender = {
        uid: activeUid!,
        displayName: activeUserProfile?.displayName || currentUser.displayName || 'Reader',
        photoURL: activeUserProfile?.photoURL || currentUser.photoURL || undefined,
      };
      const res = await toggleFollowUser(currentSender, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        bio: user.bio,
      });
      setFollowing(res.following);
      setFollowersCount(res.followersCount);
    } catch (err) {
      console.warn('Error following user:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onSelect) onSelect();
    navigate(`/user/${user.uid}`);
  };

  const avatarSrc =
    user.photoURL ||
    `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(user.displayName)}&backgroundColor=d1d4f9`;

  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1A1D26] hover:bg-stone-50 dark:hover:bg-[#202430] border border-stone-200 dark:border-stone-800 transition-all cursor-pointer group shadow-2xs"
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={avatarSrc}
            alt={user.displayName}
            className="w-9 h-9 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0 bg-stone-100 dark:bg-stone-800"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-[#C25E3A] transition-colors">
                {user.displayName}
              </span>
              {user.role === 'admin' ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                  Admin
                </span>
              ) : user.isCreator ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#C25E3A]/10 text-[#C25E3A] dark:text-amber-400 border border-[#C25E3A]/20 font-semibold">
                  Creator
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  Reader
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {user.worksCount > 0 ? `${user.worksCount} ${user.worksCount === 1 ? 'upload' : 'uploads'} • ` : ''}
              {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {!isSelf && (
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                following
                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  : 'bg-[#C25E3A]/10 hover:bg-[#C25E3A] text-[#C25E3A] hover:text-white dark:bg-[#C25E3A]/20 dark:text-amber-300'
              }`}
              title={following ? 'Following' : 'Follow user'}
            >
              {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            </button>
          )}
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C25E3A] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 hover:border-[#C25E3A]/50 dark:hover:border-[#C25E3A]/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={avatarSrc}
                alt={user.displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-stone-200 dark:border-stone-700 group-hover:border-[#C25E3A] transition-colors bg-stone-100 dark:bg-stone-800"
              />
              {user.isCreator && (
                <div
                  title="Verified Creator"
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#C25E3A] text-white flex items-center justify-center text-[10px] ring-2 ring-white dark:ring-[#151820]"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-[#C25E3A] transition-colors">
                  {user.displayName}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                {user.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                ) : user.isCreator ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#C25E3A]/10 text-[#C25E3A] dark:text-amber-400 border border-[#C25E3A]/20 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Creator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                    <User className="w-3 h-3" />
                    Reader
                  </span>
                )}
                <span>•</span>
                <span className="font-mono text-[11px]">
                  {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
                </span>
                {user.worksCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-[#C25E3A] dark:text-amber-400 font-semibold">
                      {user.worksCount} {user.worksCount === 1 ? 'creation' : 'creations'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {user.bio && (
          <p className="text-xs text-stone-600 dark:text-stone-300 font-sans line-clamp-2 mb-4 leading-relaxed">
            {user.bio}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-stone-800/80">
        <span className="text-xs font-semibold text-[#C25E3A] dark:text-[#D9774F] group-hover:underline flex items-center gap-1">
          <span>View Profile &amp; Works</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </span>

        {!isSelf && (
          <button
            onClick={handleFollowToggle}
            disabled={isFollowLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              following
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                : 'bg-[#C25E3A] hover:bg-[#a84e2e] text-white shadow-xs'
            }`}
          >
            {following ? (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Follow</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

interface UserSearchResultsSectionProps {
  users: SearchableUser[];
  query: string;
  onClearQuery?: () => void;
  title?: string;
  subtitle?: string;
}

export const UserSearchResultsSection: React.FC<UserSearchResultsSectionProps> = ({
  users,
  query,
  onClearQuery,
  title,
  subtitle,
}) => {
  const { navigate } = useRouter();

  if (!users || users.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/5 via-[#C25E3A]/5 to-transparent dark:from-[#C25E3A]/10 dark:via-stone-900/60 dark:to-transparent border border-[#C25E3A]/20 dark:border-[#C25E3A]/30 rounded-3xl p-5 sm:p-6 mb-8 space-y-4 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#C25E3A]/15 text-[#C25E3A] dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-950 dark:text-white">
              {title || `Creators & Readers matching "${query}"`}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {subtitle || `Found ${users.length} ${users.length === 1 ? 'user profile' : 'user profiles'}. Explore their creations, bio, or follow their updates.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
            {users.length} {users.length === 1 ? 'user found' : 'users found'}
          </span>
          {onClearQuery && (
            <button
              onClick={onClearQuery}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {users.map((user) => (
          <UserSearchCard key={user.uid} user={user} />
        ))}
      </div>
    </div>
  );
};

interface UserSearchDropdownProps {
  users: SearchableUser[];
  onSelectUser: (user: SearchableUser) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  users,
  onSelectUser,
  isOpen,
  onClose,
  className = '',
}) => {
  if (!isOpen || users.length === 0) return null;

  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-2.5 max-h-80 overflow-y-auto space-y-1.5 ${className}`}
    >
      <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center justify-between">
        <span>Matching Users ({users.length})</span>
        <span className="text-[10px] text-stone-400">Click to view profile</span>
      </div>

      {users.slice(0, 6).map((user) => (
        <UserSearchCard
          key={user.uid}
          user={user}
          compact
          onSelect={() => {
            onSelectUser(user);
            onClose();
          }}
        />
      ))}
    </div>
  );
};
