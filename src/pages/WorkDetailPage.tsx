import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import { getLicenseInfo } from '../data/licenses';
import { ReportModal } from '../components/modals/ReportModal';
import { ExportEreaderModal } from '../components/modals/ExportEreaderModal';
import { generateGhostCoverSvg } from '../services/coverService';
import { subscribeWorkLikes, toggleWorkLike, subscribeWorkComments, useLikesSync } from '../services/interactionService';
import { WorkCommentsSection } from '../components/social/WorkCommentsSection';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Download,
  ExternalLink,
  Globe,
  ShieldCheck,
  Check,
  Copy,
  FileText,
  Clock,
  Layers,
  Heart,
  MessageSquare,
  User,
  Sparkles,
  Search,
  Trash2,
  Shield,
} from 'lucide-react';
import { Author, WorkLike, Chapter } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface WorkDetailProps {
  slug: string;
}

export const WorkDetailPage: React.FC<WorkDetailProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { getWorkBySlug, isFavorite, toggleFavoriteWork, progress, works, removeWork } = useLibrary();
  const { currentUser, userProfile, openAuthModal, isAdmin } = useAuth();
  const likesVersion = useLikesSync();

  const [showReportModal, setShowReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const [likes, setLikes] = useState<WorkLike[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeToast, setLikeToast] = useState<string | null>(null);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [likerSearchQuery, setLikerSearchQuery] = useState('');
  const pressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

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
  };

  const handleClickLike = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
      return;
    }
    handleToggleLike();
  };

  const cleanSlug = (slug || '').split('#')[0].split('?')[0];
  const work = getWorkBySlug(cleanSlug);

  const activeUserId = userProfile?.uid || currentUser?.uid;
  const alternateUserId = currentUser?.uid;
  const activeDisplayName = userProfile?.displayName || currentUser?.displayName || 'Reader';
  const activeAvatar =
    userProfile?.photoURL ||
    currentUser?.photoURL ||
    `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(activeDisplayName)}&backgroundColor=d1d4f9`;

  const [commentsCount, setCommentsCount] = useState<number>(work?.commentsCount || 0);

  useEffect(() => {
    if (!work) return;
    const unsubLikes = subscribeWorkLikes(
      work.id,
      activeUserId,
      (loadedLikes, userLiked) => {
        setLikes(loadedLikes);
        setIsLiked(userLiked);
      },
      alternateUserId
    );

    const unsubComments = subscribeWorkComments(work.id, (loadedComments) => {
      setCommentsCount(loadedComments.length);
    });

    return () => {
      unsubLikes();
      unsubComments();
    };
  }, [work?.id, activeUserId, alternateUserId]);

  // Robust smooth scroll to comments or specific comment anchor with retries
  useEffect(() => {
    const rawHash = window.location.hash;
    if (rawHash) {
      const targetId = rawHash.replace('#', '');
      const tryScroll = () => {
        const el = document.getElementById(targetId) || document.getElementById('comments');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (targetId === 'comments') {
            const textarea = el.querySelector('textarea');
            if (textarea) setTimeout(() => textarea.focus(), 150);
          }
          return true;
        }
        return false;
      };

      if (!tryScroll()) {
        const t1 = setTimeout(tryScroll, 150);
        const t2 = setTimeout(tryScroll, 450);
        const t3 = setTimeout(tryScroll, 800);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    }
  }, [slug]);

  const handleScrollToComments = () => {
    const el = document.getElementById('comments');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const textarea = el.querySelector('textarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 300);
      }
    }
  };

  const handleToggleLike = async () => {
    if (!work) return;
    if (!activeUserId) {
      openAuthModal('signin');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    setLikeToast(null);

    // Save previous state for rollback
    const prevLiked = isLiked;
    const prevLikes = likes;
    const optimisticLiked = !prevLiked;

    // Instant 0ms optimistic UI update
    setIsLiked(optimisticLiked);
    if (optimisticLiked) {
      setLikes([
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
      const uploaderId = work.uploaderId || work.publisherId;
      if (uploaderId && uploaderId !== activeUserId) {
        setLikeToast(`❤️ Liked! Uploader (${work.publisherName || 'community creator'}) received a notification in their panel.`);
      } else {
        setLikeToast('❤️ Liked! Added to your appreciated works.');
      }
      setTimeout(() => setLikeToast(null), 3500);
    } else {
      setLikes(prevLikes.filter((l) => l.userId !== activeUserId && l.userId !== alternateUserId));
      setLikeToast('Like removed');
      setTimeout(() => setLikeToast(null), 2500);
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
      setLikes(prevLikes);
      setLikeToast('Could not update like. Please try again.');
      setTimeout(() => setLikeToast(null), 3500);
      console.warn('Failed to toggle like:', err?.message || err);
    } finally {
      setIsLiking(false);
    }
  };

  if (!work) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-5">
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-white">Work Not Found</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">The requested catalog item does not exist or may have been unlisted.</p>
        <button
          onClick={() => navigate('/library')}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-800"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const favorited = isFavorite(work.id);
  const userProgress = progress[work.id];
  const authorNames =
    work.authors?.map((a: any) => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ') ||
    'Anonymous';
  const typeLabel = work.type === 'book' ? 'Book' : work.type === 'comic' ? 'Comic' : 'Manga';
  const isPublicDomain = work.jurisdictionStatus === 'WORLDWIDE_PD' || work.licenseCode?.includes('PD');
  const licenseLabel = isPublicDomain ? 'Public Domain' : 'Open License';

  const coverSrc = !imageFailed && (work.coverImageUrl || work.coverImage)
    ? work.coverImageUrl || work.coverImage
    : generateGhostCoverSvg(work.title, authorNames, typeLabel, work.originalPublicationYear, work.coverPalette);

  const chapters = work.chapters || [];

  const handleStartReading = (chapterId?: string) => {
    const targetChapId = chapterId || userProgress?.chapterId || chapters[0]?.id || '1';
    navigate(`/read/${work.id}/${targetChapId}`);
  };

  const handleCopyCitation = () => {
    const citation = `“${work.title}” by ${authorNames} (${work.originalPublicationYear || 'Historic'}). Open Library: wanna read?. Source: ${work.sourceUrl || 'Project Gutenberg'}. License: ${work.licenseCode}.`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#12141A] min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <div>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate('/library');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* ── Main Book Details Grid (Mockup Layout) ───────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Book Cover & Main Action CTAs (Cols 1–5 on md, 1-4 on lg) */}
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            <div className="relative aspect-[2/3] w-full max-w-[320px] mx-auto md:max-w-none rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-md">
              <img
                src={coverSrc}
                alt={`Cover for ${work.title}`}
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover"
              />
              {/* Subtle Book Spine Shadow */}
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none" />
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 max-w-[340px] mx-auto md:max-w-none">
              <button
                onClick={() => handleStartReading()}
                className="w-full py-3.5 px-5 text-sm sm:text-base font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[46px]"
              >
                <BookOpen className="w-4.5 h-4.5" />
                <span>{userProgress ? 'Continue Reading' : 'Start Reading'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => toggleFavoriteWork(work.id)}
                  className={`py-3 px-3.5 text-xs sm:text-sm font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] ${
                    favorited
                      ? 'bg-[#C25E3A] text-white border-[#C25E3A]'
                      : 'bg-white dark:bg-[#151820] text-stone-800 dark:text-stone-200 border-stone-200/90 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                  <span>{favorited ? 'Saved' : 'Save to Library'}</span>
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="py-3 px-3.5 text-xs sm:text-sm font-semibold bg-white dark:bg-[#151820] text-stone-800 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
                >
                  <Download className="w-4 h-4" />
                  <span>{work.type === 'comic' || work.type === 'manga' ? 'Download CBZ' : 'Download EPUB'}</span>
                </button>
              </div>

              {/* Community Engagement: Like & Comments Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Like / Praise Button */}
                <button
                  onClick={handleClickLike}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleTouchStart}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowLikersModal(true);
                  }}
                  disabled={isLiking}
                  title="Click to like • Long-press to see who liked"
                  aria-label={isLiked ? 'Unlike this work' : 'Like this work'}
                  className={`w-full py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] select-none ${
                    isLiked
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800 shadow-2xs'
                      : 'bg-white dark:bg-[#151820] text-stone-800 dark:text-stone-200 border-stone-200/90 dark:border-stone-800 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 hover:border-rose-200'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform ${
                      isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-stone-400'
                    }`}
                  />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {likes.length}
                  </span>
                </button>

                {/* Comments Scroll & Jump Button */}
                <button
                  onClick={handleScrollToComments}
                  title="Jump to reader discussion & comments"
                  aria-label="View comments"
                  className="w-full py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#151820] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 hover:border-stone-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
                >
                  <MessageSquare className="w-4 h-4 text-[#C25E3A]" />
                  <span>Comments</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {commentsCount}
                  </span>
                </button>
              </div>

              {likeToast && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs text-center font-medium animate-in fade-in duration-150">
                  {likeToast}
                </div>
              )}

              {/* Admin or Creator Actions Bar */}
              {(() => {
                const activeUserId = userProfile?.uid || currentUser?.uid;
                const isUploader = Boolean(
                  work.isCommunity &&
                  activeUserId && (
                    work.uploaderId === activeUserId ||
                    work.publisherId === activeUserId ||
                    (currentUser?.email && work.publisherEmail === currentUser.email)
                  )
                );

                if (!isAdmin && !isUploader) return null;

                return (
                  <div className="pt-2 border-t border-dashed border-stone-200 dark:border-stone-800">
                    <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/70 dark:border-amber-800/40 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-[#C25E3A]" />}
                          <span>{isAdmin ? 'Admin Controls' : 'Your Uploaded Work'}</span>
                        </div>
                        {activeUserId && (
                          <button
                            onClick={() => navigate(`/user/${activeUserId}`)}
                            className="text-[10px] lowercase font-mono text-[#C25E3A] hover:underline cursor-pointer"
                          >
                            view public profile →
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => navigate('/admin')}
                            className="flex-1 py-1.5 px-2.5 bg-white dark:bg-[#151820] hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer"
                          >
                            Admin Panel
                          </button>
                        )}
                        {isUploader && !isAdmin && activeUserId && (
                          <button
                            onClick={() => navigate(`/user/${activeUserId}`)}
                            className="flex-1 py-1.5 px-2.5 bg-white dark:bg-[#151820] hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer"
                          >
                            My Public Profile
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Permanently delete this work from the catalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Work</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Community Uploader Badge & Notification Panel */}
              {(work.uploaderId || work.publisherName) && (() => {
                const creatorTarget =
                  work.uploaderId ||
                  work.publisherId ||
                  (work.publisherName ? `user-${work.publisherName.toLowerCase().replace(/\s+/g, '-')}` : null);

                return (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#151820] border border-stone-200/80 dark:border-stone-800 text-xs space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                        Community Creator
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60">
                        Live Alerts Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-[#C25E3A]" />
                        <span className="truncate">{work.publisherName || 'Community Member'}</span>
                      </div>
                      {creatorTarget && (
                        <button
                          type="button"
                          onClick={() => navigate(`/user/${creatorTarget}`)}
                          className="px-2 py-0.5 text-[11px] font-bold text-[#C25E3A] hover:text-[#a84e2e] bg-[#C25E3A]/10 hover:bg-[#C25E3A]/20 rounded-md transition-colors cursor-pointer shrink-0"
                        >
                          View Bio &amp; Works →
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                      Likes, comments, and replies trigger notifications to the author in real-time.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column: Title, Metadata, About, & Archive Box (Cols 5–12) */}
          <div className="md:col-span-7 lg:col-span-8 space-y-8">
            
            {/* Header / Title block */}
            <div className="space-y-3 pb-6 border-b border-stone-200/80 dark:border-stone-800/80">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans flex-wrap">
                <span className="font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[11px] font-mono">
                  {typeLabel}
                </span>
                <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                <span className="inline-flex items-center gap-1 text-stone-700 dark:text-stone-300">
                  <Globe className="w-3.5 h-3.5 text-stone-400" />
                  <span>{licenseLabel}</span>
                </span>
                {work.originalPublicationYear ? (
                  <>
                    <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                    <span>{work.originalPublicationYear}</span>
                  </>
                ) : null}
                {work.readingTimeMinutes ? (
                  <>
                    <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                    <span>{work.readingTimeMinutes} min read</span>
                  </>
                ) : null}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-950 dark:text-stone-50 tracking-tight leading-tight">
                {work.title}
              </h1>

              <div className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-sans">
                by <span className="font-semibold text-stone-900 dark:text-white">{authorNames}</span>
              </div>

              {/* Publication details row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px] font-mono uppercase tracking-wider">Published</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{work.originalPublicationYear || 'Historic'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px] font-mono uppercase tracking-wider">Language</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{work.language || 'English'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px] font-mono uppercase tracking-wider">Source</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{work.sourceName || 'Project Gutenberg'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px] font-mono uppercase tracking-wider">Direction</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{work.readingDirection === 'rtl' ? 'Right-to-Left (RTL)' : 'Left-to-Right'}</span>
                </div>
              </div>
            </div>

            {/* About this work */}
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-bold text-stone-950 dark:text-stone-50">
                About this work
              </h3>
              <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 font-sans leading-relaxed">
                {work.synopsis || work.description || 'A timeless narrative curated for distraction-free reading.'}
              </p>
            </div>

            {/* ── Archive Information Box (Matching Mockup) ───────────── */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#151820] border border-stone-200/80 dark:border-stone-800 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C25E3A]" />
                  <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                    Archive Information
                  </h4>
                </div>
                <button
                  onClick={handleCopyCitation}
                  className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Citation</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px] font-mono uppercase tracking-wider">Repository</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{work.sourceName || 'Project Gutenberg / Internet Archive'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] font-mono uppercase tracking-wider">License Status</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{work.licenseCode} ({work.jurisdictionStatus})</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] font-mono uppercase tracking-wider">Digitization</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Verbatim Unabridged Scan / Transcribed Text</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] font-mono uppercase tracking-wider">Accession Record</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">{work.id}</span>
                </div>
              </div>

              {work.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={work.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition-colors"
                  >
                    <span>Open Source Record</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </a>
                </div>
              )}
            </div>

            {/* Why is this free? / Provenance Section */}
            <div className="p-5 rounded-xl bg-[#F5F2EC] dark:bg-[#181B24] border border-stone-200/80 dark:border-stone-800 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C25E3A]" />
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                  Why is this work freely accessible?
                </h4>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {isPublicDomain
                  ? `“${work.title}” was published in ${work.originalPublicationYear || 'the 19th/early 20th century'} and its copyright has expired globally into the public domain. It is preserved without subscription paywalls, advertising trackers, or access restrictions.`
                  : `“${work.title}” is distributed under an open Creative Commons or community license (${work.licenseCode}) granting full legal authorization for non-commercial digital reading and archival distribution.`}
              </p>
            </div>

            {/* Chapters / Table of Contents */}
            {chapters.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-serif text-xl font-bold text-stone-950 dark:text-stone-50">
                  Contents ({chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'})
                </h3>
                <div className="divide-y divide-stone-200/60 dark:divide-stone-800/60 rounded-xl bg-white dark:bg-[#151820] border border-stone-200/80 dark:border-stone-800 overflow-hidden">
                  {chapters.slice(0, 15).map((chap: Chapter, idx: number) => (
                    <button
                      key={chap.id}
                      onClick={() => handleStartReading(chap.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-stone-400 text-[11px] w-6">
                          {(chap.chapterNumber || idx + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="font-serif font-semibold text-stone-800 dark:text-stone-200 group-hover:text-[#C25E3A] dark:group-hover:text-[#D9774F] transition-colors">
                          {chap.title}
                        </span>
                      </div>
                      <span className="text-stone-400 text-[11px] font-sans">
                        {chap.pages?.length ? `${chap.pages.length} pages` : 'Read chapter →'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reader Comments & Community Discussion */}
            <WorkCommentsSection work={work} />

            {/* More Like This / Related Works Section */}
            <div className="space-y-4 pt-6 border-t border-stone-200/80 dark:border-stone-800/80">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-stone-950 dark:text-stone-50">
                  More like this
                </h3>
                <button
                  onClick={() => navigate('/library')}
                  className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                >
                  View full catalog →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {works
                  .filter((w) => w.id !== work.id && (w.type === work.type || (w.genres && work.genres && w.genres.some((g) => work.genres?.includes(g)))))
                  .slice(0, 4)
                  .map((relWork) => (
                    <button
                      key={relWork.id}
                      onClick={() => navigate(`/work/${relWork.slug}`)}
                      className="group text-left space-y-2 cursor-pointer"
                    >
                      <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
                        <img
                          src={relWork.coverImageUrl || relWork.coverImage || generateGhostCoverSvg(relWork.title, relWork.authors?.[0]?.name || 'Author', relWork.type)}
                          alt={relWork.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <h5 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-[#C25E3A] transition-colors line-clamp-1">
                          {relWork.title}
                        </h5>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                          {relWork.authors?.[0]?.name || 'Author'}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Export E-Reader Modal */}
      <ExportEreaderModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        work={work}
      />

      {/* Report DMCA / Error Modal */}
      {showReportModal && (
        <ReportModal
          work={work}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Likers Modal (Shown on long-pressing the like button) */}
      {showLikersModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                    {likes.length}{' '}
                    {likes.length === 1 ? 'reader' : 'readers'} appreciated this work
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLikersModal(false)}
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

              {likes.filter((l) => (l.userName || '').toLowerCase().includes(likerSearchQuery.toLowerCase().trim())).length > 0 ? (
                likes
                  .filter((l) => (l.userName || '').toLowerCase().includes(likerSearchQuery.toLowerCase().trim()))
                  .map((liker) => (
                  <div
                    key={liker.userId || liker.userName}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800"
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
                        <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate block">
                          {liker.userName}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 block">
                          Community Reader
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
                onClick={() => setShowLikersModal(false)}
                className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Work from Catalog?"
        message={`Are you sure you want to permanently delete "${work.title}"?\n\nThis will remove it from your public profile, the catalog, and search index. All chapters, reader comments, and bookmarks will be removed. This action cannot be undone.`}
        confirmLabel="Delete Work"
        cancelLabel="Keep Work"
        isDestructive={true}
        onConfirm={() => {
          removeWork(work.id);
          const activeUid = userProfile?.uid || currentUser?.uid;
          if (activeUid) {
            navigate(`/user/${activeUid}`);
          } else {
            navigate('/library');
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default WorkDetailPage;
