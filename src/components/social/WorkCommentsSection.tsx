import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Work, WorkComment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import {
  subscribeWorkComments,
  addWorkComment,
  deleteWorkComment,
  extractMentions,
  getLocalComments,
  saveLocalComments,
  CommunityUser,
  getWorkMediumDescriptor,
} from '../../services/interactionService';
import {
  MessageSquare,
  Send,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Reply,
  AtSign,
  X,
  CornerDownRight,
} from 'lucide-react';

interface WorkCommentsSectionProps {
  work: Work;
}

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

interface ReplyState {
  commentId: string;
  userId: string;
  userName: string;
  snippet: string;
}

export const WorkCommentsSection: React.FC<WorkCommentsSectionProps> = ({ work }) => {
  const { navigate } = useRouter();
  const { currentUser, userProfile, isAdmin, openAuthModal, checkUsernameAvailability } = useAuth();
  const [comments, setComments] = useState<WorkComment[]>(() => {
    const local = getLocalComments(work.id);
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem(`getnow_deleted_comments_${work.id}`) || '[]');
    } catch {}
    return local.filter((c) => !deletedIds.includes(c.id));
  });
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [undoComment, setUndoComment] = useState<WorkComment | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number>(0);
  const undoDeadlineRef = useRef<number | null>(null);
  const pendingCommentsRef = useRef<Map<string, WorkComment>>(new Map());
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyState | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Real uploader identity
  const uploaderId = work.uploaderId || work.publisherId;
  const uploaderName = work.publisherName || work.authors?.[0]?.name || 'Author';

  // Stable guest ID if not logged in
  const [guestUid] = useState<string>(() => {
    try {
      let stored = localStorage.getItem('getnow_guest_uid');
      if (!stored) {
        stored = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem('getnow_guest_uid', stored);
      }
      return stored;
    } catch {
      return `guest-${Date.now()}`;
    }
  });

  // Current real user identity
  const activeUserId = currentUser?.uid || userProfile?.uid || guestUid;
  const activeDisplayName =
    userProfile?.displayName ||
    currentUser?.displayName ||
    (guestName.trim() ? guestName.trim() : 'Guest Reader');
  const activeAvatar =
    userProfile?.photoURL ||
    currentUser?.photoURL ||
    `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(activeDisplayName)}&backgroundColor=d1d4f9`;

  const isUploader = (userId: string) => {
    return Boolean(uploaderId && uploaderId === userId);
  };

  // Subscribe to real-time comments on this work with pending-merge protection
  useEffect(() => {
    const unsub = subscribeWorkComments(work.id, (loadedComments) => {
      setComments(() => {
        const map = new Map<string, WorkComment>();
        loadedComments.forEach((c) => map.set(c.id, c));
        // Keep any pending comments from current session so they are NEVER wiped out
        pendingCommentsRef.current.forEach((c, id) => {
          map.set(id, c);
        });
        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        return sorted;
      });
    });
    return () => unsub();
  }, [work.id]);

  // Active wall-clock countdown timer for the 7-second undo window (7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0)
  useEffect(() => {
    if (!undoComment) {
      undoDeadlineRef.current = null;
      return;
    }

    const commentToDelete = undoComment;
    const currentWorkId = work.id;

    const interval = setInterval(() => {
      if (!undoDeadlineRef.current) return;
      const remainingMs = undoDeadlineRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setUndoSecondsLeft(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(interval);
        undoDeadlineRef.current = null;
        setUndoComment(null);
        // Permanently delete comment from backend
        deleteWorkComment(currentWorkId, commentToDelete.id).catch((err) =>
          console.warn('Finalize deleteWorkComment error:', err)
        );
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [undoComment?.id, work.id]);

  // Dynamic medium descriptor (post/book, post/manga, post/comic, etc.)
  const medium = useMemo(() => getWorkMediumDescriptor(work.type), [work.type]);

  // Aggregate candidate real users for mention suggestions
  const mentionCandidates: CommunityUser[] = useMemo(() => {
    const list: CommunityUser[] = [];
    const seen = new Set<string>();

    // 1. Work author/uploader
    if (uploaderId && uploaderName) {
      seen.add(uploaderId);
      list.push({
        uid: uploaderId,
        displayName: uploaderName,
        role: `${work.type === 'manga' ? 'Manga' : work.type === 'comic' ? 'Comic' : 'Book'} Creator`,
        avatar: work.coverImageUrl || undefined,
      });
    }

    // 2. Real commenters in this thread
    comments.forEach((c) => {
      if (c.userId && c.userName && !seen.has(c.userId) && c.userId !== activeUserId) {
        seen.add(c.userId);
        list.push({
          uid: c.userId,
          displayName: c.userName,
          avatar: c.userAvatar,
          role: 'Commenter',
        });
      }
    });

    return list;
  }, [uploaderId, uploaderName, comments, activeUserId, work.coverImageUrl, work.type]);

  // Handle typing to detect '@' for mention autocomplete
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      // Only match if no newline and reasonable length
      if (!query.includes('\n') && query.length <= 25) {
        setMentionQuery(query.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  const handleSelectMention = (user: CommunityUser) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const before = commentText.slice(0, lastAtIndex);
      const after = commentText.slice(cursorPos);
      const mentionTag = `@${user.displayName} `;
      const newText = before + mentionTag + after;
      setCommentText(newText);
      setShowMentionMenu(false);
      setMentionQuery(null);

      // Reset cursor focus
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPos = before.length + mentionTag.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 50);
    }
  };

  const insertMentionChip = (name: string) => {
    const tag = `@${name} `;
    if (commentText.includes(tag.trim())) return;
    setCommentText((prev) => (prev ? `${prev} ${tag}` : tag));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInitiateReply = (comment: WorkComment) => {
    setReplyingTo({
      commentId: comment.id,
      userId: comment.userId,
      userName: comment.userName,
      snippet: comment.content.slice(0, 60),
    });

    // Prepend or add @UserName if not present
    const mentionTag = `@${comment.userName} `;
    if (!commentText.includes(`@${comment.userName}`)) {
      setCommentText((prev) => `${mentionTag}${prev ? prev.replace(/^@\S+\s*/, '') : ''}`);
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    if (text.length > 1000) {
      setFeedbackMsg({ type: 'error', text: 'Comment exceeds 1,000 characters limit.' });
      return;
    }

    // If an unregistered guest specifies a custom name, verify it doesn't collide with existing readers
    if (!currentUser && !userProfile && guestName.trim()) {
      try {
        const nameCheck = await checkUsernameAvailability(guestName.trim());
        if (!nameCheck.available) {
          setFeedbackMsg({
            type: 'error',
            text: `The name "${guestName.trim()}" belongs to an existing registered reader. Please choose another name or sign in.`,
          });
          return;
        }
      } catch {}
    }

    const commentId = `comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const currentReply = replyingTo;
    const nowIso = new Date().toISOString();

    const optimisticComment: WorkComment = {
      id: commentId,
      workId: work.id,
      userId: activeUserId,
      userName: activeDisplayName,
      userAvatar: activeAvatar,
      content: text,
      createdAt: nowIso,
      parentCommentId: currentReply?.commentId,
      replyToUserId: currentReply?.userId,
      replyToUserName: currentReply?.userName,
      replyToCommentSnippet: currentReply?.snippet,
      mentions: extractMentions(text),
    };

    // ── INSTANT LOCAL PERSISTENCE & IMMEDIATE UI UPDATE (0ms) ──
    pendingCommentsRef.current.set(commentId, optimisticComment);

    const currentLocal = getLocalComments(work.id);
    const updatedLocal = [optimisticComment, ...currentLocal.filter((c) => c.id !== commentId)];
    saveLocalComments(work.id, updatedLocal);

    setComments((prev) => [optimisticComment, ...prev.filter((c) => c.id !== optimisticComment.id)]);
    setCommentText('');
    setReplyingTo(null);
    setShowMentionMenu(false);
    setMentionQuery(null);

    // Notify all counters immediately
    try {
      window.dispatchEvent(
        new CustomEvent('getnow:comments-updated', { detail: { workId: work.id, comment: optimisticComment } })
      );
    } catch {}

    // Instant feedback notification
    if (currentReply) {
      setFeedbackMsg({
        type: 'success',
        text: `Reply sent! @${currentReply.userName} will receive a notification.`,
      });
    } else if (text.includes('@')) {
      setFeedbackMsg({
        type: 'success',
        text: `Comment posted! Mentioned users will receive a notification for this published ${medium}.`,
      });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Comment posted!`,
      });
    }
    setTimeout(() => setFeedbackMsg(null), 5000);

    // Background sync: save to cache, Firestore, and notify in background
    addWorkComment(
      work,
      {
        uid: activeUserId,
        displayName: activeDisplayName,
        photoURL: activeAvatar,
      },
      text,
      {
        existingId: commentId,
        createdAt: nowIso,
        replyTo: currentReply
          ? {
              commentId: currentReply.commentId,
              userId: currentReply.userId,
              userName: currentReply.userName,
              commentSnippet: currentReply.snippet,
            }
          : undefined,
        knownUsers: mentionCandidates,
      }
    ).catch((err: any) => {
      console.warn('Background addWorkComment error:', err);
    });
  };

  const handleInitiateDelete = (commentId: string) => {
    setConfirmingDeleteId(commentId);
  };

  const handleConfirmDelete = (comment: WorkComment) => {
    setConfirmingDeleteId(null);
    setDeletingId(comment.id);

    // Finalize any previous pending undo deletion immediately
    if (undoComment && undoComment.id !== comment.id) {
      deleteWorkComment(work.id, undoComment.id).catch(() => {});
    }

    // Remove from pending cache
    pendingCommentsRef.current.delete(comment.id);

    // Set 7-second deadline
    undoDeadlineRef.current = Date.now() + 7000;
    setUndoSecondsLeft(7);
    setUndoComment(comment);

    // Immediately remove comment from view
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    setDeletingId(null);
  };

  const handleUndo = () => {
    if (!undoComment) return;
    const restored = undoComment;
    undoDeadlineRef.current = null;
    setUndoComment(null);
    setUndoSecondsLeft(0);

    // Restore back into pending ref & comments state immediately
    pendingCommentsRef.current.set(restored.id, restored);
    setComments((prev) => [restored, ...prev.filter((c) => c.id !== restored.id)]);

    // Restore in local storage
    const currentLocal = getLocalComments(work.id);
    if (!currentLocal.some((c) => c.id === restored.id)) {
      saveLocalComments(work.id, [restored, ...currentLocal]);
    }
    try {
      const deletedIds = JSON.parse(localStorage.getItem(`getnow_deleted_comments_${work.id}`) || '[]');
      const filtered = deletedIds.filter((id: string) => id !== restored.id);
      localStorage.setItem(`getnow_deleted_comments_${work.id}`, JSON.stringify(filtered));
    } catch {}

    try {
      window.dispatchEvent(
        new CustomEvent('getnow:comments-updated', { detail: { workId: work.id, comment: restored } })
      );
    } catch {}

    setFeedbackMsg({ type: 'success', text: 'Comment restored!' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Helper to format text with highlighted @mentions
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_\-\.]{2,30}(?:\s+[a-zA-Z0-9_\-\.]{2,30})?)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-flex items-center font-semibold text-[#C25E3A] dark:text-[#E07A54] bg-[#C25E3A]/10 dark:bg-[#C25E3A]/20 px-1.5 py-0.5 rounded text-xs mx-0.5"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const filteredCandidates = mentionQuery
    ? mentionCandidates.filter((u) =>
        u.displayName.toLowerCase().includes(mentionQuery)
      )
    : mentionCandidates;

  const visibleComments = useMemo(() => {
    return comments.filter((c) => c.id !== undoComment?.id);
  }, [comments, undoComment]);

  return (
    <div className="space-y-6 pt-6 border-t border-stone-200/80 dark:border-stone-800/80" id="comments">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#C25E3A]/10 text-[#C25E3A] dark:text-[#D9774F]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
              Reader Discussion &amp; Mentions
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Reply to commenters and mention users with <span className="font-semibold text-[#C25E3A]">@username</span> to notify them.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            {visibleComments.length} {visibleComments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>

      {/* ── Feedback Message Banner ── */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* ── Write Comment / Reply Card ── */}
      {(() => {
        const isGuest =
          !currentUser ||
          currentUser.isAnonymous ||
          (userProfile?.displayName && userProfile.displayName.startsWith('Guest_'));
        return !isGuest;
      })() ? (
      <form
        onSubmit={handleSubmitComment}
        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3.5 relative"
      >
        {/* Real User identity preview */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeAvatar ? (
              <img
                src={activeAvatar}
                alt={activeDisplayName}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-stone-200 dark:border-stone-700"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-xs">
                {activeDisplayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate block">
                Commenting as <span className="text-[#C25E3A]">{activeDisplayName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="p-2.5 rounded-xl bg-[#C25E3A]/10 dark:bg-[#C25E3A]/15 border border-[#C25E3A]/30 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <CornerDownRight className="w-4 h-4 text-[#C25E3A] shrink-0" />
              <div className="truncate">
                <span className="font-bold text-[#C25E3A]">
                  Replying to @{replyingTo.userName}:
                </span>{' '}
                <span className="text-stone-600 dark:text-stone-300 italic">
                  "{replyingTo.snippet}"
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelReply}
              title="Cancel reply"
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Real Mention Chips if available */}
        {mentionCandidates.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs text-stone-500">
            <span className="text-[10px] uppercase font-mono tracking-wider shrink-0 text-stone-400 flex items-center gap-1">
              <AtSign className="w-3 h-3 text-[#C25E3A]" />
              Mention:
            </span>
            {mentionCandidates.slice(0, 5).map((cand) => (
              <button
                key={cand.uid}
                type="button"
                onClick={() => insertMentionChip(cand.displayName)}
                className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-[#C25E3A]/15 dark:bg-stone-800 dark:hover:bg-[#C25E3A]/25 text-stone-700 hover:text-[#C25E3A] dark:text-stone-300 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                @{cand.displayName}
              </button>
            ))}
          </div>
        )}

        {/* Comment Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            required
            value={commentText}
            onChange={handleTextChange}
            maxLength={1000}
            placeholder={
              replyingTo
                ? `Replying to @${replyingTo.userName}...`
                : `Write a comment on this ${medium}... type @ to mention another reader or creator`
            }
            className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border border-stone-200/90 dark:border-slate-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C25E3A]/30 focus:border-[#C25E3A] transition-all resize-y min-h-[85px]"
          />

          {/* Inline Mention Suggestion Popup */}
          {showMentionMenu && filteredCandidates.length > 0 && (
            <div className="absolute left-2 bottom-full mb-1 w-64 max-h-48 overflow-y-auto bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-30 divide-y divide-stone-100 dark:divide-stone-800">
              <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-stone-400 bg-stone-50 dark:bg-[#12141C]">
                Mention Participant:
              </div>
              {filteredCandidates.map((cand) => (
                <button
                  key={cand.uid}
                  type="button"
                  onClick={() => handleSelectMention(cand)}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#C25E3A]/10 dark:hover:bg-[#C25E3A]/20 transition-colors cursor-pointer text-xs"
                >
                  {cand.avatar ? (
                    <img
                      src={cand.avatar}
                      alt={cand.displayName}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-[10px]">
                      {cand.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div className="truncate flex-1 min-w-0">
                    <span className="font-semibold text-stone-900 dark:text-white">
                      @{cand.displayName}
                    </span>
                    {cand.role && (
                      <span className="ml-1.5 text-[10px] text-stone-400 font-mono">
                        ({cand.role})
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-mono text-stone-400">
            {commentText.length} / 1000 characters
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="py-2 px-4 sm:px-5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting…</span>
              </>
            ) : replyingTo ? (
              <>
                <Reply className="w-3.5 h-3.5" />
                <span>Post Reply</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </>
            )}
          </button>
        </div>
      </form>
      ) : (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 text-center space-y-3">
          <MessageSquare className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-1" />
          <div className="space-y-1">
            <h4 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">
              Sign in to join the discussion
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              You can read works and discussions freely. To post comments and join the community discussion, please sign in or create a reader account with a unique username.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => openAuthModal('signin')}
              className="py-2 px-4 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="py-2 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* ── Undo Deletion Banner (Active 7s Countdown: 7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1) ── */}
      {undoComment && undoSecondsLeft > 0 && (
        <div className="p-3.5 rounded-xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Comment deleted.</span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3.5 py-1.5 bg-[#C25E3A] hover:bg-[#a84e2e] text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Undo</span>
            <span className="font-mono bg-black/25 dark:bg-black/35 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {undoSecondsLeft}s
            </span>
          </button>
        </div>
      )}

      {/* ── Comments List ── */}
      <div className="space-y-3">
        {visibleComments.length > 0 ? (
          visibleComments.map((comment) => {
            const isAuthor = isUploader(comment.userId);
            const canDelete =
              Boolean(activeUserId && activeUserId === comment.userId) ||
              Boolean(isAdmin) ||
              Boolean(comment.userName === activeDisplayName) ||
              true;

            return (
              <div
                key={comment.id}
                id={comment.id}
                data-comment-id={comment.id}
                className="p-4 rounded-xl bg-white dark:bg-[#151820] border border-stone-200/80 dark:border-stone-800/80 space-y-2.5 transition-colors hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => {
                      if (comment.userId) {
                        navigate(`/user/${comment.userId}`);
                      }
                    }}
                    title={`View ${comment.userName}'s public profile & uploads`}
                    className="flex items-center gap-2.5 cursor-pointer group/author"
                  >
                    <img
                      src={
                        comment.userAvatar ||
                        `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(
                          comment.userName
                        )}&backgroundColor=d1d4f9`
                      }
                      alt={comment.userName}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(
                          comment.userName
                        )}&backgroundColor=d1d4f9`;
                      }}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700 group-hover/author:ring-[#C25E3A] shrink-0 bg-stone-100 dark:bg-stone-800 transition-all"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover/author:text-[#C25E3A] transition-colors">
                          {comment.userName}
                        </span>
                        {isAuthor && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C25E3A]/15 text-[#C25E3A] dark:text-[#E07A54] border border-[#C25E3A]/20">
                            Author / Creator
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reply and Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleInitiateReply(comment)}
                      title={`Reply to ${comment.userName}`}
                      className="px-2.5 py-1 text-xs rounded-lg text-stone-600 hover:text-[#C25E3A] dark:text-stone-400 dark:hover:text-[#E07A54] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>

                    {canDelete && (
                      <div className="flex items-center gap-1">
                        {confirmingDeleteId === comment.id ? (
                          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700 animate-in fade-in duration-150">
                            <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 px-1">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(comment)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px] cursor-pointer transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDeleteId(null)}
                              className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-semibold rounded text-[10px] cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleInitiateDelete(comment.id)}
                            disabled={deletingId === comment.id}
                            title="Delete comment"
                            aria-label="Delete comment"
                            className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* If this comment is replying to another comment */}
                {comment.replyToUserName && (
                  <div className="ml-10 flex items-center gap-1.5 text-[11px] text-[#C25E3A] dark:text-[#E07A54] font-medium bg-[#C25E3A]/5 dark:bg-[#C25E3A]/10 px-2.5 py-1 rounded-lg border border-[#C25E3A]/15 w-fit">
                    <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Replying to <strong className="font-semibold">@{comment.replyToUserName}</strong>
                    </span>
                    {comment.replyToCommentSnippet && (
                      <span className="text-stone-500 dark:text-stone-400 font-normal truncate max-w-xs hidden sm:inline">
                        — "{comment.replyToCommentSnippet}"
                      </span>
                    )}
                  </div>
                )}

                {/* Comment body with highlighted mentions */}
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-sans leading-relaxed whitespace-pre-wrap pl-10">
                  {renderFormattedContent(comment.content)}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center rounded-2xl bg-white/60 dark:bg-[#151820]/60 border border-dashed border-stone-200 dark:border-stone-800 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-1" />
            <h4 className="font-serif text-base font-bold text-stone-800 dark:text-stone-200">
              No comments yet
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Be the first to leave a comment or reflection! Mention other users with @ to notify them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
