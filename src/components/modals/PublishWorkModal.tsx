import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { Work, Chapter, WorkType } from '../../types';
import { generateGhostCoverSvg, GHOST_COVER_PALETTES } from '../../services/coverService';
import { apiUrl, resolveMediaUrl } from '../../services/apiConfig';
import { auth } from '../../firebase';
import { mediaProcessingService } from '../../services/mediaProcessingService';
import {
  uploadFileWithResilientChunks,
  uploadPagesResiliently,
  getAuthToken,
  ResumableUploadError,
} from '../../services/resilientUploadService';
import { compressImageToDataUrl } from '../../utils/imageOptimizer';
import {
  X,
  Upload,
  BookOpen,
  Image as ImageIcon,
  FileText,
  FolderArchive,
  Check,
  Plus,
  Trash2,
  Globe,
  Layers,
  ArrowRight,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  RotateCcw,
  Info,
  RefreshCw,
} from 'lucide-react';

interface PublishWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PublishToast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  persistent?: boolean;
}

export const PublishWorkModal: React.FC<PublishWorkModalProps> = ({ isOpen, onClose }) => {
  const { createOrUpdateWork, isUserBanned } = useLibrary();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { navigate } = useRouter();

  const activeReader = currentUser || userProfile;
  const isAuthenticated = Boolean(activeReader && !(activeReader as any).isAnonymous);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [type, setType] = useState<WorkType>('book');
  const [genres, setGenres] = useState<string[]>(['Classics']);
  const [licenseCode, setLicenseCode] = useState<string>('CC-BY');
  const [readingDirection, setReadingDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [customCoverUrl, setCustomCoverUrl] = useState<string>('');
  
  // Chapter State
  const [chapters, setChapters] = useState<Array<{ title: string; text?: string; pages?: string[] }>>([
    { title: 'Chapter 1: Opening', text: '' },
  ]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);

  // Network Resilience & Toast State
  const [toast, setToast] = useState<PublishToast | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryInfo, setRetryInfo] = useState<{ attempt: number; max: number } | null>(null);
  const [resumableSession, setResumableSession] = useState<{
    file: File;
    uploadId: string;
    fileType: 'archive' | 'cover';
    completedChunks: number[];
    totalChunks: number;
  } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    options?: { title?: string; actionLabel?: string; onAction?: () => void; persistent?: boolean }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({
      id,
      type,
      message,
      title: options?.title,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      persistent: options?.persistent,
    });
  };

  useEffect(() => {
    if (!toast || toast.persistent) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCancelProcessing = () => {
    mediaProcessingService.cancelCurrentTask();
    setIsProcessingFile(false);
    setIsRetrying(false);
    setRetryInfo(null);
    setUploadProgress('');
    setUploadPercent(0);
    showToast('Upload / extraction cancelled by user.', 'info');
  };

  const handleClose = () => {
    if (isProcessingFile) {
      mediaProcessingService.cancelCurrentTask();
      setIsProcessingFile(false);
      setIsRetrying(false);
      setRetryInfo(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  const availableGenres = [
    'Classics', 'Sci-Fi', 'Fantasy', 'Horror', 'Mystery',
    'Romance', 'Historical', 'Drama', 'Non-Fiction', 'Slice of Life'
  ];

  const handleToggleGenre = (g: string) => {
    if (genres.includes(g)) {
      if (genres.length > 1) setGenres(genres.filter((x) => x !== g));
    } else {
      setGenres([...genres, g]);
    }
  };

  // Helper to get authenticated bearer token headers
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await getAuthToken(currentUser || userProfile);
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {}
    return {};
  };

  // Handle Cover Image Upload with Server-side WebP Optimization and retry
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const active = currentUser || userProfile;
    if (!active || (active as any).isAnonymous) {
      showToast('Please sign into your reader account before uploading custom cover art.', 'warning');
      openAuthModal('signin');
      return;
    }

    setIsProcessingFile(true);
    setIsRetrying(false);
    setUploadProgress('Uploading and optimizing cover art...');
    setUploadPercent(15);

    try {
      if (file.size > 5 * 1024 * 1024) {
        // Use resilient chunking for large covers
        const result = await uploadFileWithResilientChunks<{ coverUrl?: string }>(file, 'cover', {
          onProgress: (pState) => {
            setUploadProgress(pState.message);
            setUploadPercent(pState.percent);
            setIsRetrying(Boolean(pState.isRetrying));
            if (pState.retryAttempt && pState.maxRetries) {
              setRetryInfo({ attempt: pState.retryAttempt, max: pState.maxRetries });
            } else {
              setRetryInfo(null);
            }
          },
        });
        if (result.coverUrl) {
          setCustomCoverUrl(resolveMediaUrl(result.coverUrl));
          showToast('Cover art uploaded and optimized successfully!', 'success');
          setIsProcessingFile(false);
          setUploadProgress('');
          return;
        }
      } else {
        const headers = await getAuthHeaders();
        const formData = new FormData();
        formData.append('cover', file);
        const res = await fetch(apiUrl('/api/media/upload-cover'), {
          method: 'POST',
          headers,
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.coverUrl) {
            setCustomCoverUrl(resolveMediaUrl(data.coverUrl));
            showToast('Cover art uploaded successfully!', 'success');
            setIsProcessingFile(false);
            setUploadProgress('');
            return;
          }
        }
      }
    } catch (err: any) {
      console.warn('Media server upload unavailable, using client preview:', err);
      showToast('Media server upload unavailable, using client preview cover.', 'info');
    } finally {
      setIsProcessingFile(false);
      setIsRetrying(false);
      setRetryInfo(null);
    }

    // Fallback client reader: compress to lightweight WebP data URL (~30-50 KB)
    try {
      const optimized = await compressImageToDataUrl(file, 480, 720, 0.8);
      if (optimized) {
        setCustomCoverUrl(optimized);
      }
    } catch {
      // Safe fallback only if canvas processing is unavailable
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCustomCoverUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Resume interrupted chunked upload
  const handleResumeUpload = async () => {
    if (!resumableSession) return;
    const { file, uploadId, fileType } = resumableSession;
    setIsProcessingFile(true);
    setIsRetrying(false);
    setToast(null);

    const chapterTitle = file.name.replace(/\.(cbz|zip)$/i, '');
    const slug = (title || chapterTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    try {
      const result = await uploadFileWithResilientChunks<{ pages?: string[]; total?: number; coverUrl?: string }>(
        file,
        fileType,
        {
          uploadId,
          workSlug: slug || `manga-${Date.now()}`,
          onProgress: (pState) => {
            setUploadProgress(pState.message);
            setUploadPercent(pState.percent);
            setIsRetrying(Boolean(pState.isRetrying));
            if (pState.retryAttempt && pState.maxRetries) {
              setRetryInfo({ attempt: pState.retryAttempt, max: pState.maxRetries });
            } else {
              setRetryInfo(null);
            }
          },
        }
      );

      if (result.pages && result.pages.length > 0) {
        setChapters([
          {
            title: chapterTitle,
            pages: result.pages.map((p: string) => resolveMediaUrl(p)),
          },
        ]);
        showToast(`Successfully resumed and synchronized ${result.total || result.pages.length} manga pages!`, 'success');
      } else if (result.coverUrl) {
        setCustomCoverUrl(resolveMediaUrl(result.coverUrl));
        showToast('Successfully resumed and saved cover art!', 'success');
      }
      setResumableSession(null);
    } catch (err: any) {
      if (err instanceof ResumableUploadError) {
        setResumableSession({
          file,
          uploadId: err.uploadId,
          fileType,
          completedChunks: err.completedChunks,
          totalChunks: err.totalChunks,
        });
        showToast(`Upload paused: ${err.message}`, 'warning', {
          actionLabel: 'Resume Upload',
          onAction: () => handleResumeUpload(),
          persistent: true,
        });
      } else {
        showToast(`Resume failed: ${err?.message || 'Network disconnected'}`, 'error');
      }
    } finally {
      setIsProcessingFile(false);
      setIsRetrying(false);
      setRetryInfo(null);
    }
  };

  // Handle Full Manga/Comic Volume Archive (.CBZ or .ZIP up to 350 MB) using Web Worker & Resilient Chunks
  const handleArchiveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const active = currentUser || userProfile;
    if (!active || (active as any).isAnonymous) {
      showToast('Please sign into your reader account before uploading manga or comic archives.', 'warning');
      openAuthModal('signin');
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setIsProcessingFile(true);
    setIsRetrying(false);
    setRetryInfo(null);
    setResumableSession(null);
    setUploadPercent(5);
    setUploadProgress(`Inspecting archive ${file.name} (${sizeMb} MB)...`);

    try {
      // 1. Offload heavy ZIP/CBZ decompression, security checks, and natural sorting to Web Worker
      const result = await mediaProcessingService.processArchive(file, (status, pct) => {
        setUploadProgress(status);
        if (typeof pct === 'number') setUploadPercent(pct);
      });

      const chapterTitle = file.name.replace(/\.(cbz|zip)$/i, '');
      if (!title && result.suggestedTitle) {
        setTitle(result.suggestedTitle);
      }

      // If user hasn't uploaded custom cover art yet, auto-set page 1 as cover preview
      if (!customCoverUrl && result.coverUrl) {
        setCustomCoverUrl(result.coverUrl);
      }

      // Populate chapters immediately with client-extracted object URLs
      setChapters([
        {
          title: chapterTitle,
          pages: result.pages.map((p) => p.url),
        },
      ]);

      // 2. Stream to server media storage endpoint with resilient chunking and auto-retry
      setUploadProgress(`Synchronizing ${result.total} manga pages with library storage...`);
      setUploadPercent(40);

      const slug = (title || chapterTitle)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      try {
        if (file.size > 5 * 1024 * 1024) {
          // Use resumable chunked upload with automatic exponential backoff
          const chunkResult = await uploadFileWithResilientChunks<{ pages?: string[]; total?: number }>(
            file,
            'archive',
            {
              workSlug: slug || `manga-${Date.now()}`,
              onProgress: (pState) => {
                setUploadProgress(pState.message);
                setUploadPercent(pState.percent);
                setIsRetrying(Boolean(pState.isRetrying));
                if (pState.retryAttempt && pState.maxRetries) {
                  setRetryInfo({ attempt: pState.retryAttempt, max: pState.maxRetries });
                } else {
                  setRetryInfo(null);
                }
              },
            }
          );

          if (chunkResult.pages && chunkResult.pages.length > 0) {
            setChapters([
              {
                title: chapterTitle,
                pages: chunkResult.pages.map((p: string) => resolveMediaUrl(p)),
              },
            ]);
            setUploadProgress(`Successfully processed ${chunkResult.total || chunkResult.pages.length} manga pages!`);
            setUploadPercent(100);
            showToast(`Archive processed and verified (${chunkResult.total} pages synchronized)!`, 'success');
            return;
          }
        } else {
          const headers = await getAuthHeaders();
          const formData = new FormData();
          formData.append('archive', file);
          formData.append('workSlug', slug || `manga-${Date.now()}`);

          const res = await fetch(apiUrl('/api/media/upload-archive'), {
            method: 'POST',
            headers,
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.pages && data.pages.length > 0) {
              setChapters([
                {
                  title: chapterTitle,
                  pages: data.pages.map((p: string) => resolveMediaUrl(p)),
                },
              ]);
              setUploadProgress(`Successfully processed ${data.total} manga pages!`);
              setUploadPercent(100);
              showToast(`Archive verified (${data.total} pages)!`, 'success');
              return;
            }
          }
        }
      } catch (netErr: any) {
        if (netErr instanceof ResumableUploadError) {
          setResumableSession({
            file,
            uploadId: netErr.uploadId,
            fileType: 'archive',
            completedChunks: netErr.completedChunks,
            totalChunks: netErr.totalChunks,
          });
          showToast(
            `Network interrupted: ${netErr.completedChunks.length} of ${netErr.totalChunks} chunks saved. Click 'Resume Upload' to continue.`,
            'warning',
            {
              actionLabel: 'Resume Upload',
              onAction: () => handleResumeUpload(),
              persistent: true,
            }
          );
        } else {
          console.warn('Media server archive endpoint unavailable, keeping verified client-worker pages:', netErr);
          showToast('Media server unavailable. Kept client-extracted preview pages.', 'info');
        }
      }

      setUploadProgress(`Successfully extracted ${result.total} manga pages!`);
      setUploadPercent(100);
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        setUploadProgress('Archive processing cancelled.');
        showToast('Archive processing cancelled.', 'info');
        return;
      }
      console.error('Archive processing error:', err);
      showToast(`Archive processing failed: ${err.message || 'Please check the file format'}`, 'error');
    } finally {
      setIsProcessingFile(false);
      setIsRetrying(false);
      setRetryInfo(null);
    }
  };

  // Handle PDF File Upload & Extraction into Chapters/Pages using Web Worker & Resilient Page Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setIsProcessingFile(true);
    setIsRetrying(false);
    setRetryInfo(null);
    setUploadPercent(5);
    setUploadProgress(`Reading PDF document (${sizeMb} MB)...`);

    try {
      if (type === 'comic' || type === 'manga') {
        // Offload PDF page rendering to Web Worker (using OffscreenCanvas or chunked fallback)
        const result = await mediaProcessingService.processPdfComic(file, (status, pct) => {
          setUploadProgress(status);
          if (typeof pct === 'number') setUploadPercent(pct);
        });

        const chapterTitle = file.name.replace(/\.pdf$/i, '');
        if (!title && result.suggestedTitle) {
          setTitle(result.suggestedTitle);
        }

        if (!customCoverUrl && result.coverUrl) {
          setCustomCoverUrl(result.coverUrl);
        }

        const localUrls = result.pages.map((p) => p.url);
        setChapters([{ title: chapterTitle, pages: localUrls }]);

        // Upload pages to server media endpoint with resilient batching & automatic retry
        setUploadProgress(`Uploading ${result.pages.length} pages to media storage...`);
        setUploadPercent(60);

        const slug = (title || chapterTitle)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        try {
          const uploadedUrls = await uploadPagesResiliently(result.pages, {
            workSlug: slug || `manga-${Date.now()}`,
            batchSize: 10,
            onProgress: (pState) => {
              setUploadProgress(pState.message);
              setUploadPercent(60 + Math.round(pState.percent * 0.4));
              setIsRetrying(Boolean(pState.isRetrying));
            },
          });

          if (uploadedUrls.length > 0) {
            setChapters([
              {
                title: chapterTitle,
                pages: uploadedUrls.map((p: string) => resolveMediaUrl(p)),
              },
            ]);
            showToast(`Synchronized ${uploadedUrls.length} comic pages to media storage!`, 'success');
          }
        } catch (uploadErr: any) {
          console.warn('Server page upload incomplete, keeping worker-extracted pages:', uploadErr);
          showToast(`Server sync incomplete: ${uploadErr.message}. Keeping local preview pages.`, 'warning');
        }

        setUploadProgress(`Processed ${result.pages.length} comic pages!`);
        setUploadPercent(100);
      } else {
        // Books/Novels: Offload text extraction to Web Worker off main thread
        const result = await mediaProcessingService.processPdfBook(file, (status, pct) => {
          setUploadProgress(status);
          if (typeof pct === 'number') setUploadPercent(pct);
        });

        if (!title && result.suggestedTitle) {
          setTitle(result.suggestedTitle);
        }

        setChapters(result.chapters);
        setUploadProgress(`Extracted full text across ${result.totalPages} pages!`);
        setUploadPercent(100);
        showToast(`Extracted prose text across ${result.totalPages} pages!`, 'success');
      }
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        setUploadProgress('PDF processing cancelled.');
        showToast('PDF processing cancelled.', 'info');
        return;
      }
      console.error('PDF parsing error:', err);
      showToast(`Failed to parse PDF: ${err.message || 'Please ensure it is a valid PDF.'}`, 'error');
    } finally {
      setIsProcessingFile(false);
      setIsRetrying(false);
      setRetryInfo(null);
    }
  };

  // Handle Multi-Image Pages Upload with Resilient Batching & Exponential Retry
  const handleImagePagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const active = currentUser || userProfile;
    if (!active || (active as any).isAnonymous) {
      showToast('Please sign into your reader account before uploading manga pages.', 'warning');
      openAuthModal('signin');
      return;
    }

    setIsProcessingFile(true);
    setIsRetrying(false);
    setRetryInfo(null);
    setUploadProgress(`Uploading & optimizing ${files.length} manga pages...`);

    try {
      const slug = (title || 'manga')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const pageBlobs = files.map((f, i) => ({
        blob: f,
        fileName: f.name || `page_${i + 1}.jpg`,
      }));

      const uploadedUrls = await uploadPagesResiliently(pageBlobs, {
        workSlug: slug || `manga-${Date.now()}`,
        batchSize: 10,
        onProgress: (pState) => {
          setUploadProgress(pState.message);
          setUploadPercent(pState.percent);
          setIsRetrying(Boolean(pState.isRetrying));
        },
      });

      setChapters([{ title: 'Chapter 1', pages: uploadedUrls.map((p) => resolveMediaUrl(p)) }]);
      setUploadProgress(`Successfully loaded ${uploadedUrls.length} pages!`);
      showToast(`Successfully uploaded & optimized ${uploadedUrls.length} pages!`, 'success');
    } catch (err: any) {
      console.error('Page upload error:', err);
      // Fallback local URLs
      const localUrls = files.map((f) => URL.createObjectURL(f));
      setChapters([{ title: 'Chapter 1', pages: localUrls }]);
      showToast(`Page upload issue: ${err.message || ''}. Retained local preview.`, 'warning');
    } finally {
      setIsProcessingFile(false);
      setIsRetrying(false);
      setRetryInfo(null);
    }
  };

  const handlePublish = async () => {
    if (!isAuthenticated) {
      showToast('Account required: Please log into or create a reader account before publishing works.', 'warning');
      onClose();
      openAuthModal('signin');
      return;
    }

    if (!title.trim()) {
      showToast('Please enter a title for your work.', 'warning');
      return;
    }

    if (isUserBanned(currentUser?.uid, currentUser?.email || '')) {
      showToast('Your account is currently restricted from publishing content by an administrator.', 'error');
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const authorSlug = (authorName || 'Community Creator')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const formattedChapters: Chapter[] = chapters.map((c, idx) => {
      const chapObj: Chapter = {
        id: `chap-${slug}-${idx + 1}`,
        workId: `work-${slug}`,
        chapterNumber: idx + 1,
        number: idx + 1,
        title: c.title || `Chapter ${idx + 1}`,
        slug: `chapter-${idx + 1}`,
        content: c.text || '',
      };
      if (Array.isArray(c.pages) && c.pages.length > 0) {
        chapObj.pages = c.pages.map((p, pageIdx) => ({
          id: `page-${pageIdx + 1}`,
          pageNumber: pageIdx + 1,
          imageUrl: p || '',
          altText: `Page ${pageIdx + 1}`,
        }));
        chapObj.pagesCount = chapObj.pages.length;
      }
      return chapObj;
    });

    let finalCover = customCoverUrl || generateGhostCoverSvg(
      title,
      authorName || 'Community Creator',
      type,
      new Date().getFullYear(),
      GHOST_COVER_PALETTES[1]
    );

    // If finalCover is an oversized raw data URL, compress to ensure it never exceeds Firestore or localStorage limits
    if (finalCover && finalCover.startsWith('data:') && finalCover.length > 80000) {
      try {
        finalCover = await compressImageToDataUrl(finalCover, 480, 720, 0.75);
      } catch {}
    }

    const publisherDisplayName = userProfile?.displayName || currentUser?.displayName || authorName.trim() || 'Community Creator';
    const publisherEmail = currentUser?.email || '';
    const publisherId = currentUser?.uid || `user-${Date.now().toString().slice(-6)}`;

    const newWork: Work = {
      id: `work-${slug}`,
      slug,
      title: title.trim(),
      type,
      description: synopsis.trim() || 'A self-published open creation shared with the global community.',
      synopsis: synopsis.trim() || 'A self-published open creation shared with the global community.',
      coverImage: finalCover,
      coverImageUrl: finalCover,
      language: 'English',
      licenseCode,
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceName: 'Community Self-Published',
      sourceUrl: '',
      attribution: `${authorName || publisherDisplayName} (${new Date().getFullYear()})`,
      originalPublicationYear: new Date().getFullYear(),
      jurisdictionStatus: 'COMMUNITY_OPEN',
      jurisdictionNotes: 'Self-published community creation.',
      isHosted: true,
      readingDirection: type === 'manga' ? readingDirection : 'ltr',
      publisherId,
      publisherEmail,
      publisherName: publisherDisplayName,
      uploaderId: publisherId,
      likesCount: 0,
      commentsCount: 0,
      authors: [
        {
          id: `author-${authorSlug}`,
          name: authorName.trim() || publisherDisplayName,
          slug: authorSlug,
          role: 'Author',
          bio: 'Self-published creator on wanna read? open digital archive.',
          verifiedOpenLicense: true,
        },
      ],
      genres,
      tags: genres.map((g) => g.toLowerCase()),
      chapters: formattedChapters,
      fileFormat: type === 'book' ? 'epub' : 'cbz',
      status: 'completed',
      popularityScore: 90,
      verificationStatus: 'verified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createOrUpdateWork(newWork);
    onClose();
    navigate(`/work/${newWork.slug}`);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm p-2 sm:p-6 flex items-center justify-center overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Modal Box */}
      <div
        className="relative z-10 bg-[#FAF8F5] dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header (Pinned) */}
        <div className="px-5 py-4 sm:px-6 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#12141A] shrink-0 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight">
              Publish &amp; Share Your Creation
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Self-publish books, comics, or manga on the Open Digital Library
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close publish dialog"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator (Pinned) */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-stone-100/90 dark:bg-stone-900/90 border-b border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs sm:text-sm font-mono shrink-0">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#C25E3A] font-bold' : 'text-stone-400'}`}>
            <span className="w-5 h-5 rounded-full bg-[#C25E3A]/15 flex items-center justify-center text-[11px]">1</span>
            <span className="hidden xs:inline">Metadata</span>
            <span className="xs:hidden">Step 1</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#C25E3A] font-bold' : 'text-stone-400'}`}>
            <span className="w-5 h-5 rounded-full bg-[#C25E3A]/15 flex items-center justify-center text-[11px]">2</span>
            <span className="hidden xs:inline">Files</span>
            <span className="xs:hidden">Step 2</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#C25E3A] font-bold' : 'text-stone-400'}`}>
            <span className="w-5 h-5 rounded-full bg-[#C25E3A]/15 flex items-center justify-center text-[11px]">3</span>
            <span className="hidden xs:inline">Preview</span>
            <span className="xs:hidden">Step 3</span>
          </div>
        </div>

        {/* Toast Feedback Notification Banner */}
        {toast && (
          <div
            className={`mx-4 sm:mx-6 mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-md transition-all animate-in fade-in slide-in-from-top-1 shrink-0 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : toast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                : toast.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
              {toast.type === 'error' && <WifiOff className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-stone-600 dark:text-stone-400 shrink-0" />}
              <div className="min-w-0">
                {toast.title && <div className="font-bold leading-tight">{toast.title}</div>}
                <div className="text-xs leading-normal">{toast.message}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={toast.onAction}
                  className="px-3 py-1 text-xs font-bold bg-[#C25E3A] hover:bg-[#a84e2e] text-white rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{toast.actionLabel}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 min-h-0">
          {step === 1 && (
            <div className="space-y-4">
              {/* Account Authentication Banner */}
              {!isAuthenticated ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Account Sign-In Required to Self-Publish</span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    To maintain library governance, copyright compliance, and creator attribution, administrators require all publishers to be signed into a verified reader account.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openAuthModal('signin');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-[#FF5733] hover:from-amber-700 hover:to-[#E04826] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <User className="w-4 h-4" />
                    <span>Create Account / Sign In to Publish</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-100 dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">Publishing Account: </span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold truncate">{userProfile?.displayName || currentUser?.displayName || 'Registered Reader'}</span>
                      <span className="text-stone-500 dark:text-stone-400 ml-1.5 truncate">({currentUser?.email || 'Authenticated Account'})</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold shrink-0">
                    Verified Identity
                  </span>
                </div>
              )}

              {/* Book Cover Upload Section */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                      Book / Work Cover Image
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Upload custom cover art (JPG, PNG) or use our auto-generated editorial cover
                    </p>
                  </div>
                  {customCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomCoverUrl('')}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Reset Cover
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-24 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 shrink-0 shadow-2xs">
                    <img
                      src={
                        customCoverUrl ||
                        generateGhostCoverSvg(
                          title || 'Untitled Creation',
                          authorName || 'Community Creator',
                          type,
                          new Date().getFullYear(),
                          GHOST_COVER_PALETTES[1]
                        )
                      }
                      alt="Cover Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <label className="flex-1 p-3 border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-[#C25E3A] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors bg-[#FAF8F5] dark:bg-[#12141A]">
                    <Upload className="w-4 h-4 text-[#C25E3A]" />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {customCoverUrl ? 'Change Cover Image' : 'Upload Custom Cover Image'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Title of Work *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chronicles of the Autumn Star"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A] text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Author / Creator Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Elena Vance"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A] text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Format &amp; Content Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as WorkType)}
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A] text-stone-900 dark:text-stone-100"
                  >
                    <option value="book">Book / Prose / Novella</option>
                    <option value="comic">Comic / Graphic Novel</option>
                    <option value="manga">Manga / Webtoon</option>
                  </select>
                </div>
              </div>

              {type === 'manga' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Manga Reading Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReadingDirection('rtl')}
                      className={`p-2.5 text-xs font-medium rounded-xl border transition-colors ${
                        readingDirection === 'rtl'
                          ? 'bg-[#C25E3A]/10 border-[#C25E3A] text-[#C25E3A]'
                          : 'bg-white dark:bg-[#1A1D26] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      Right-to-Left (Traditional Japanese)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadingDirection('ltr')}
                      className={`p-2.5 text-xs font-medium rounded-xl border transition-colors ${
                        readingDirection === 'ltr'
                          ? 'bg-[#C25E3A]/10 border-[#C25E3A] text-[#C25E3A]'
                          : 'bg-white dark:bg-[#1A1D26] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      Left-to-Right (Western Webtoon)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Synopsis / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your creation, plot, themes, or setting..."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A] text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Select Genres
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableGenres.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleToggleGenre(g)}
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                        genres.includes(g)
                          ? 'bg-[#C25E3A] text-white border-[#C25E3A]'
                          : 'bg-white dark:bg-[#1A1D26] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Open License / Distribution Terms
                </label>
                <select
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A] text-stone-900 dark:text-stone-100"
                >
                  <option value="CC-BY">Creative Commons CC-BY (Attribution Allowed)</option>
                  <option value="CC-BY-NC">Creative Commons CC BY-NC (Non-Commercial)</option>
                  <option value="CC0">Public Domain Dedication (CC0)</option>
                  <option value="COMMUNITY_OPEN">Community Open Access License</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-serif font-bold text-sm">
                  <Upload className="w-4 h-4 text-[#C25E3A]" />
                  <span>Upload Document / Pages</span>
                </div>
                <p className="text-xs text-stone-500">
                  Upload a PDF document, EPUB, or image pages for your creation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Manga Volume Archive (.CBZ / .ZIP) */}
                  <label className="p-3.5 border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-[#C25E3A] dark:hover:border-[#C25E3A] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center bg-[#FAF8F5] dark:bg-[#12141A]">
                    <FolderArchive className="w-6 h-6 text-[#C25E3A]" />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">Manga Volume (.CBZ / .ZIP)</span>
                    <span className="text-[10px] text-stone-400">Up to 350 MB archive volume</span>
                    <input type="file" accept=".cbz,.zip" onChange={handleArchiveUpload} className="hidden" />
                  </label>

                  {/* PDF Upload */}
                  <label className="p-3.5 border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-[#C25E3A] dark:hover:border-[#C25E3A] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center bg-[#FAF8F5] dark:bg-[#12141A]">
                    <FileText className="w-6 h-6 text-[#C25E3A]" />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">Upload PDF Document</span>
                    <span className="text-[10px] text-stone-400">Extracts book prose or pages</span>
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  </label>

                  {/* Image Pages Upload */}
                  <label className="p-3.5 border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-[#C25E3A] dark:hover:border-[#C25E3A] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center bg-[#FAF8F5] dark:bg-[#12141A]">
                    <ImageIcon className="w-6 h-6 text-[#C25E3A]" />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">Upload Image Pages</span>
                    <span className="text-[10px] text-stone-400">Batch JPG, PNG, WebP pages</span>
                    <input type="file" accept="image/*" multiple onChange={handleImagePagesUpload} className="hidden" />
                  </label>
                </div>

                {/* Resumable Session Recovery Card */}
                {resumableSession && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Resumable Upload Interrupted</span>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-semibold">
                        {resumableSession.completedChunks.length} / {resumableSession.totalChunks} chunks saved
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Network was interrupted while uploading <span className="font-semibold">{resumableSession.file.name}</span>. You can resume without losing previously transferred data or keep locally extracted preview pages.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleResumeUpload}
                        className="px-3 py-1.5 bg-[#C25E3A] hover:bg-[#a84e2e] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resume Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResumableSession(null);
                          showToast('Retained locally extracted pages without server upload.', 'info');
                        }}
                        className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Keep Client Extraction
                      </button>
                    </div>
                  </div>
                )}

                {isProcessingFile && (
                  <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono text-amber-800 dark:text-amber-300 font-medium min-w-0">
                        <span className="animate-spin text-sm shrink-0">⏳</span>
                        <span className="truncate">{uploadProgress}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelProcessing}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-100/60 dark:bg-rose-950/50 hover:bg-rose-200/60 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Network Reconnection Indicator Badge */}
                    {isRetrying && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/60 px-2.5 py-1 rounded-lg animate-pulse">
                        <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Network fluctuation detected — auto-reconnecting (Attempt {retryInfo?.attempt || 1}/{retryInfo?.max || 3})
                        </span>
                      </div>
                    )}

                    {uploadPercent > 0 && (
                      <div className="space-y-1">
                        <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              isRetrying
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-gradient-to-r from-amber-600 to-[#FF5733]'
                            }`}
                            style={{ width: `${Math.min(Math.max(uploadPercent, 5), 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-stone-500">
                          <span>{isRetrying ? 'Retrying failed segment...' : 'Transfer in progress'}</span>
                          <span>{uploadPercent}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Chapter / Text Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Chapters ({chapters.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setChapters([...chapters, { title: `Chapter ${chapters.length + 1}`, text: '' }])}
                    className="text-xs font-semibold text-[#C25E3A] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                {chapters.map((chap, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chap.title}
                        onChange={(e) => {
                          const updated = [...chapters];
                          updated[idx].title = e.target.value;
                          setChapters(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-serif font-bold bg-[#FAF8F5] dark:bg-[#12141A] border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                        placeholder="Chapter Title"
                      />
                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChapters(chapters.filter((_, i) => i !== idx))}
                          className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {type === 'book' ? (
                      <textarea
                        rows={4}
                        value={chap.text || ''}
                        onChange={(e) => {
                          const updated = [...chapters];
                          updated[idx].text = e.target.value;
                          setChapters(updated);
                        }}
                        placeholder="Type or paste prose chapter text here..."
                        className="w-full p-2.5 text-xs font-sans bg-[#FAF8F5] dark:bg-[#12141A] border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200"
                      />
                    ) : (
                      <div className="text-xs text-stone-500 font-mono">
                        {chap.pages?.length || 0} comic/manga page images loaded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Cover Preview Card */}
                <div className="space-y-2 text-center">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-400">Cover Preview</span>
                  <div className="aspect-[2/3] max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900">
                    <img
                      src={
                        customCoverUrl ||
                        generateGhostCoverSvg(
                          title || 'Untitled Creation',
                          authorName || 'Community Creator',
                          type,
                          new Date().getFullYear(),
                          GHOST_COVER_PALETTES[1]
                        )
                      }
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Upload Custom Cover */}
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                    Custom Cover Art
                  </h4>
                  <p className="text-xs text-stone-500">
                    Upload your own cover image or use our auto-generated editorial typography cover.
                  </p>

                  <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload Cover Image</span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>

                  {customCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomCoverUrl('')}
                      className="block text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Reset to Auto Cover
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Audit */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Ready to Self-Publish</span>
                </div>
                <p className="text-stone-500">
                  Your work will be saved to the Open Digital Library under <span className="font-semibold text-stone-800 dark:text-stone-200">{licenseCode}</span> and assigned a persistent catalog record.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-[#12141A] shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer min-h-[40px]"
            >
              Cancel
            </button>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 bg-stone-200/60 dark:bg-stone-800 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer min-h-[40px]"
              >
                ← Back
              </button>
            )}
          </div>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !title.trim()) {
                  showToast('Please enter a title for your work before proceeding to Step 2.', 'warning');
                  return;
                }
                setStep((step + 1) as any);
              }}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#C25E3A] hover:bg-[#a84e2e] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              className="px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md min-h-[42px]"
            >
              <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Publish Creation</span>
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PublishWorkModal;
