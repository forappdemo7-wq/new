import React, { useState, useEffect, useRef } from 'react';
import { Work, WorkLike } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { Bookmark, Globe, Heart, MessageSquare, User, Search, Trash2 } from 'lucide-react';
import { generateGhostCoverSvg } from '../../services/coverService';
import {
  subscribeWorkLikes,
  toggleWorkLike,
  subscribeWorkComments,
  getWorkLikesCount,
  useLikesSync,
} from '../../services/interactionService';

interface MediaCardProps {
  work: Work;
  variant?: 'grid' | 'list' | 'compact';
  showAttribution?: boolean;
  onDelete?: (work: Work) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  work,
  variant = 'grid',
  onDelete,
}) => {
  const { navigate } = useRouter();
  const { isFavorite, toggleFavoriteWork, progress } = useLibrary();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const likesVersion = useLikesSync();

  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadedLikes, setLoadedLikes] = useState<WorkLike[] | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeFeedback, setLikeFeedback] = useState<string | null>(null);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [likerSearchQuery, setLikerSearchQuery] = useState('');
  const [loadedCommentsCount, setLoadedCommentsCount] = useState<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    if (!work?.id) return;
    const unsub = subscribeWorkComments(work.id, (loadedComments) => {
      setLoadedCommentsCount(loadedComments.length);
    });
    return () => unsub();
  }, [work?.id]);

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      setShowLikersModal(true);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setTimeout(() => {
      isLongPressRef.current = false;
    }, 400);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      return;
    }
    handleLikeToggle(e);
  };

  const activeUserId = userProfile?.uid || currentUser?.uid;
  const alternateUserId = currentUser?.uid;
  const activeDisplayName = userProfile?.displayName || currentUser?.displayName || 'Reader';
  const activeAvatar =
    userProfile?.photoURL ||
    currentUser?.photoURL ||
    `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(activeDisplayName)}&backgroundColor=d1d4f9`;

  useEffect(() => {
    if (!work?.id) return;
    const unsub = subscribeWorkLikes(
      work.id,
      activeUserId,
      (likesData, userLiked) => {
        setLoadedLikes(likesData);
        setIsLiked(userLiked);
      },
      alternateUserId
    );
    return () => unsub();
  }, [work?.id, activeUserId, alternateUserId]);

  const favorited = isFavorite(work.id);
  const authorNames =
    work.authors?.map((a: any) => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ') ||
    'Anonymous';
  const isLinkOut = !work.isHosted || work.jurisdictionStatus === 'LINK_OUT_ONLY';

  const isCommunityUpload = Boolean(
    work.uploaderId ||
    work.publisherId ||
    work.jurisdictionStatus === 'COMMUNITY_OPEN' ||
    work.sourceName === 'Community Self-Published'
  );
  const uploaderName =
    work.publisherName ||
    (typeof work.authors?.[0] === 'string' ? work.authors[0] : work.authors?.[0]?.name) ||
    'Creator';

  // Format type label cleanly
  const typeLabel = work.type === 'book' ? 'Book' : work.type === 'comic' ? 'Comic' : 'Manga';
  const isPublicDomain = work.jurisdictionStatus === 'WORLDWIDE_PD' || work.licenseCode?.includes('PD');
  const licenseLabel = isPublicDomain ? 'Public Domain' : 'Open License';

  // Dynamic Ghost Cover fallback if no coverImage or image failed
  const hasCoverImage = Boolean(work.coverImage || work.coverImageUrl) && !imageFailed;
  const coverSrc = hasCoverImage
    ? work.coverImageUrl || work.coverImage
    : generateGhostCoverSvg(
        work.title,
        authorNames,
        typeLabel,
        work.originalPublicationYear,
        work.coverPalette
      );

  const handleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!work.isHosted && work.externalReadUrl) {
      try {
        window.open(work.externalReadUrl, '_blank', 'noopener,noreferrer');
      } catch {
        window.location.href = work.externalReadUrl;
      }
      return;
    }
    const userProgress = progress[work.id];
    const chapterId = userProgress?.chapterId || work.chapters?.[0]?.id || '1';
    navigate(`/read/${work.id}/${chapterId}`);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const prefix =
      work.type === 'book' ? 'book' : work.type === 'comic' ? 'comic' : work.type === 'manga' ? 'manga' : 'work';
    navigate(`/${prefix}/${work.slug}`);
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteWork(work.id);
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeUserId) {
      openAuthModal('signin');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    // Save previous state for automatic rollback
    const prevLiked = isLiked;
    const prevLikes = loadedLikes || [];
    const optimisticLiked = !prevLiked;

    // 0ms instant optimistic update
    setIsLiked(optimisticLiked);
    if (optimisticLiked) {
      setLoadedLikes([
        ...prevLikes.filter((l) => l.userId !== activeUserId && l.userId !== alternateUserId),
        {
          id: `like-${work.id}-${activeUserId}`,
          workId: work.id,
          userId: activeUserId,
          userName: activeDisplayName,
          userAvatar: activeAvatar,
          likedAt: new Date().toISOString(),
        },
      ]);
      setLikeFeedback('Liked!');
      setTimeout(() => setLikeFeedback(null), 2000);
    } else {
      setLoadedLikes(prevLikes.filter((l) => l.userId !== activeUserId && l.userId !== alternateUserId));
      setLikeFeedback('Unliked');
      setTimeout(() => setLikeFeedback(null), 1500);
    }

    const userPayload = {
      uid: activeUserId,
      displayName: activeDisplayName,
      photoURL: activeAvatar,
    };

    try {
      const res = await toggleWorkLike(work, userPayload);
      setIsLiked(res.liked);
    } catch (err: any) {
      // Automatic rollback on failure
      setIsLiked(prevLiked);
      setLoadedLikes(prevLikes);
      setLikeFeedback('Failed to update');
      setTimeout(() => setLikeFeedback(null), 2500);
      console.warn('MediaCard like error:', err?.message || err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prefix =
      work.type === 'book' ? 'book' : work.type === 'comic' ? 'comic' : work.type === 'manga' ? 'manga' : 'work';
    navigate(`/${prefix}/${work.slug}#comments`);
  };

  const likesList = loadedLikes || [];
  const currentLikesCount = loadedLikes !== null
    ? likesList.length
    : (work.likesCount || 0);
  const currentCommentsCount = loadedCommentsCount !== null
    ? loadedCommentsCount
    : (work.commentsCount || 0);

  /* ──────────────────────────────────────────────────────────────── */
  /* GRID MEDIA CARD (Editorial Bookshelf Layout)                     */
  /* ──────────────────────────────────────────────────────────────── */
  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col cursor-pointer select-none space-y-2 sm:space-y-2.5 transition-all duration-200 bg-[#FAF8F5] dark:bg-[#151820] p-2.5 sm:p-3 rounded-xl border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-md w-full min-w-0 overflow-hidden"
    >
      {/* 2:3 Aspect Ratio Container */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 shrink-0">
        <img
          src={coverSrc}
          alt={`Cover for ${work.title}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
          className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
            !imageLoaded && !hasCoverImage ? 'animate-pulse' : ''
          }`}
        />

        {/* Book Spine Shadow */}
        <div className="absolute inset-y-0 left-0 w-2.5 sm:w-3 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none" />

        {/* Floating Bookmark save toggle (Top Right) */}
        <button
          onClick={handleBookmarkToggle}
          title={favorited ? 'Remove from saved' : 'Save work'}
          aria-label={favorited ? 'Remove from saved' : 'Save work'}
          className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 rounded-lg backdrop-blur-md transition-all z-10 focus:outline-none cursor-pointer ${
            favorited
              ? 'bg-[#C25E3A] text-white shadow-xs'
              : 'bg-black/45 text-white/85 hover:bg-black/75 hover:text-white border border-white/10'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Delete button over cover if user owns this work or can delete */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(work);
            }}
            title="Delete uploaded work"
            aria-label="Delete uploaded work"
            className="absolute top-1.5 right-9 sm:top-2 sm:right-11 p-1.5 sm:p-2 rounded-lg backdrop-blur-md transition-all z-10 focus:outline-none cursor-pointer bg-rose-600/90 hover:bg-rose-700 text-white shadow-xs border border-rose-400/40"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Community Uploader Tag Over Cover (Top Left) */}
        {isCommunityUpload && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const creatorTarget = work.uploaderId || work.publisherId || encodeURIComponent(uploaderName);
              navigate(`/user/${creatorTarget}`);
            }}
            title={`View ${uploaderName}'s public profile & uploaded works`}
            className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-2 py-0.5 rounded-md bg-black/75 hover:bg-black/90 backdrop-blur-md text-[9px] sm:text-[10px] font-mono text-amber-300 hover:text-amber-200 border border-amber-400/30 flex items-center gap-1 z-10 transition-colors cursor-pointer"
          >
            <User className="w-2.5 h-2.5" />
            <span className="truncate max-w-[80px] sm:max-w-[100px]">{uploaderName}</span>
          </button>
        )}
      </div>

      {/* Title & Author */}
      <div className="space-y-0.5 min-w-0 flex-1">
        <h4 className="font-serif font-bold text-xs sm:text-sm md:text-[15px] text-stone-900 dark:text-stone-100 group-hover:text-[#C25E3A] dark:group-hover:text-[#D9774F] transition-colors line-clamp-2 leading-snug break-words">
          {work.title}
        </h4>
        <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-sans truncate">
          {authorNames}
        </p>
      </div>

      {/* Unboxed Metadata Line with Subtle Separators */}
      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-sans min-w-0 truncate">
        <span className="font-medium text-stone-700 dark:text-stone-300">{typeLabel}</span>
        <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
        <span className="truncate">{licenseLabel}</span>
        {work.originalPublicationYear ? (
          <>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
            <span>{work.originalPublicationYear}</span>
          </>
        ) : null}
      </div>

      {/* Community Engagement Stats Row: Like + Comment */}
      <div className="relative flex items-center justify-between text-xs pt-1 border-t border-stone-200/40 dark:border-stone-800/40">
        {likeFeedback && (
          <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono shadow-md animate-in fade-in duration-150 z-20 whitespace-nowrap">
            {likeFeedback}
          </div>
        )}
        <button
          onClick={handleLikeClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowLikersModal(true);
          }}
          title="Click to like • Long-press to see who liked"
          aria-label="Like or view likers"
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer text-[11px] font-mono select-none ${
            isLiked
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
              : 'text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          <span>{currentLikesCount}</span>
        </button>

        <button
          onClick={handleCommentClick}
          title="View comments & discussion"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-stone-500 hover:text-blue-600 dark:text-stone-400 dark:hover:text-blue-400 transition-colors cursor-pointer text-[11px] font-mono"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{currentCommentsCount}</span>
        </button>
      </div>

      {/* Bottom Row: Read CTA & Optional Delete Action */}
      <div className="pt-1 flex items-center justify-between min-w-0 gap-2">
        <button
          onClick={handleRead}
          className="flex-1 py-1.5 sm:py-2 px-3 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 rounded-lg transition-colors cursor-pointer min-h-[32px] sm:min-h-[36px] flex items-center justify-center shadow-xs"
        >
          Read
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(work);
            }}
            title="Delete this uploaded work"
            aria-label="Delete this uploaded work"
            className="py-1.5 sm:py-2 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer shrink-0 min-h-[32px] sm:min-h-[36px] flex items-center gap-1 text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>

      {/* Likers Modal */}
      {showLikersModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-950 dark:text-stone-50">
                    Readers Who Liked
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {likesList.length} {likesList.length === 1 ? 'reader' : 'readers'} appreciated this work
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLikersModal(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {/* Search username input */}
              <div className="relative pb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={likerSearchQuery}
                  onChange={(e) => setLikerSearchQuery(e.target.value)}
                  placeholder="Search username..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#C25E3A]"
                />
              </div>

              {likesList.filter((l) => (l.userName || '').toLowerCase().includes(likerSearchQuery.toLowerCase().trim())).length > 0 ? (
                likesList
                  .filter((l) => (l.userName || '').toLowerCase().includes(likerSearchQuery.toLowerCase().trim()))
                  .map((liker) => (
                  <div
                    key={liker.userId || liker.userName}
                    onClick={() => {
                      setShowLikersModal(false);
                      if (liker.userId) {
                        navigate(`/user/${liker.userId}`);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-700/60 border border-stone-200/70 dark:border-stone-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {liker.userAvatar ? (
                        <img
                          src={liker.userAvatar}
                          alt={liker.userName}
                          className="w-9 h-9 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {liker.userName?.slice(0, 1).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="truncate min-w-0">
                        <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#C25E3A] transition-colors truncate block">
                          {liker.userName}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 block">
                          Community Reader • View profile →
                        </span>
                      </div>
                    </div>
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Heart className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-1" />
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    No likes yet. Be the first to appreciate this work!
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLikersModal(false);
                }}
                className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default MediaCard;
