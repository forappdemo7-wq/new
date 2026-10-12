import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { Work, Chapter, WorkType } from '../../types';
import { generateGhostCoverSvg, GHOST_COVER_PALETTES } from '../../services/coverService';
import { apiUrl, resolveMediaUrl } from '../../services/apiConfig';
import * as pdfjsLib from 'pdfjs-dist';
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
} from 'lucide-react';

// Configure pdf.js worker using CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PublishWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishWorkModal: React.FC<PublishWorkModalProps> = ({ isOpen, onClose }) => {
  const { createOrUpdateWork, isUserBanned } = useLibrary();
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { navigate } = useRouter();

  const isAuthenticated = Boolean(currentUser && !currentUser.isAnonymous);

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

  // Handle Cover Image Upload with Server-side WebP Optimization
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadProgress('Uploading and optimizing cover art...');

    try {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await fetch(apiUrl('/api/media/upload-cover'), {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.coverUrl) {
          setCustomCoverUrl(resolveMediaUrl(data.coverUrl));
          setIsProcessingFile(false);
          setUploadProgress('');
          return;
        }
      }
    } catch (err) {
      console.warn('Media server upload unavailable, using client preview:', err);
    }

    // Fallback client reader
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCustomCoverUrl(evt.target.result as string);
      }
      setIsProcessingFile(false);
      setUploadProgress('');
    };
    reader.readAsDataURL(file);
  };

  // Handle Full Manga/Comic Volume Archive (.CBZ or .ZIP up to 350 MB)
  const handleArchiveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setIsProcessingFile(true);
    setUploadProgress(`Uploading & extracting ${file.name} (${sizeMb} MB)...`);

    try {
      const formData = new FormData();
      formData.append('archive', file);
      const slug = (title || file.name.replace(/\.(cbz|zip)$/i, ''))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      formData.append('workSlug', slug || `manga-${Date.now()}`);

      const res = await fetch(apiUrl('/api/media/upload-archive'), {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errData.error || 'Server error extracting volume');
      }

      const data = await res.json();
      if (data.pages && data.pages.length > 0) {
        setChapters([
          {
            title: file.name.replace(/\.(cbz|zip)$/i, ''),
            pages: data.pages.map((p: string) => resolveMediaUrl(p)),
          },
        ]);
        if (!title) {
          setTitle(file.name.replace(/\.(cbz|zip)$/i, ''));
        }
        setUploadProgress(`Successfully processed ${data.total} manga pages!`);
      } else {
        throw new Error('No valid image pages found inside archive');
      }
    } catch (err: any) {
      console.error('Archive processing error:', err);
      alert(`Archive processing failed: ${err.message || 'Please check the file format'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle PDF File Upload & Extraction into Chapters/Pages
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadProgress('Reading PDF document...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      if (type === 'comic' || type === 'manga') {
        // Render PDF pages and stream to media endpoint
        const pageBlobs: Blob[] = [];
        for (let i = 1; i <= Math.min(totalPages, 100); i++) {
          setUploadProgress(`Rendering page ${i} of ${totalPages}...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await (page as any).render({ canvasContext: context, viewport }).promise;
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88)
            );
            if (blob) pageBlobs.push(blob);
          }
        }

        // Upload to server media endpoint in batches
        setUploadProgress(`Uploading ${pageBlobs.length} pages to media storage...`);
        const slug = (title || file.name.replace(/\.pdf$/i, ''))
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const formData = new FormData();
        formData.append('workSlug', slug || `manga-${Date.now()}`);
        pageBlobs.forEach((b, idx) => {
          formData.append('pages', b, `page_${idx + 1}.jpg`);
        });

        const res = await fetch(apiUrl('/api/media/upload-pages'), {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.pageUrls) {
            setChapters([{ title: file.name.replace(/\.pdf$/i, ''), pages: data.pageUrls.map((p: string) => resolveMediaUrl(p)) }]);
          }
        } else {
          // Fallback to local object URLs if server unreachable
          const localUrls = pageBlobs.map((b) => URL.createObjectURL(b));
          setChapters([{ title: file.name.replace(/\.pdf$/i, ''), pages: localUrls }]);
        }
      } else {
        // Extract text for Books/Novels
        let fullText = '';
        for (let i = 1; i <= totalPages; i++) {
          setUploadProgress(`Extracting page text ${i} of ${totalPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += `\n\n--- Page ${i} ---\n\n` + pageText;
        }

        // Split by chapters if available, or single full text
        setChapters([{ title: 'Full Work', text: fullText.trim() }]);
      }

      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, ''));
      }
      setUploadProgress('Document import complete!');
    } catch (err) {
      console.error('PDF parsing error:', err);
      alert('Failed to parse PDF file. Please ensure it is a valid PDF.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle Multi-Image Pages Upload with Batch Server Processing
  const handleImagePagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    setUploadProgress(`Uploading & optimizing ${files.length} manga pages...`);

    try {
      const slug = (title || 'manga')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const batchSize = 30;
      let allPageUrls: string[] = [];

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        setUploadProgress(`Processing pages ${i + 1} to ${Math.min(i + batchSize, files.length)} of ${files.length}...`);

        const formData = new FormData();
        formData.append('workSlug', slug || `manga-${Date.now()}`);
        batch.forEach((f) => formData.append('pages', f));

        const res = await fetch(apiUrl('/api/media/upload-pages'), {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.pageUrls) {
            allPageUrls = allPageUrls.concat(data.pageUrls.map((p: string) => resolveMediaUrl(p)));
          }
        } else {
          // Local fallback URL
          const localUrls = batch.map((f) => URL.createObjectURL(f));
          allPageUrls = allPageUrls.concat(localUrls);
        }
      }

      setChapters([{ title: 'Chapter 1', pages: allPageUrls }]);
      setUploadProgress(`Successfully loaded ${allPageUrls.length} pages!`);
    } catch (err: any) {
      console.error('Page upload error:', err);
      alert('Failed to upload pages: ' + (err.message || ''));
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      alert('Account required: Please log into or create a reader account before publishing works so administrators can identify and attribute your uploads.');
      onClose();
      openAuthModal('signin');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a title for your work.');
      return;
    }

    if (isUserBanned(currentUser?.uid, currentUser?.email || '')) {
      alert('Your account is currently restricted from publishing content by an administrator. If you believe this is an error, please reach out to support.');
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const authorSlug = (authorName || 'Community Creator')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const formattedChapters: Chapter[] = chapters.map((c, idx) => ({
      id: `chap-${slug}-${idx + 1}`,
      workId: `work-${slug}`,
      chapterNumber: idx + 1,
      number: idx + 1,
      title: c.title || `Chapter ${idx + 1}`,
      slug: `chapter-${idx + 1}`,
      content: c.text,
      pages: c.pages?.map((p, pageIdx) => ({
        id: `page-${pageIdx + 1}`,
        pageNumber: pageIdx + 1,
        imageUrl: p,
        altText: `Page ${pageIdx + 1}`,
      })),
    }));

    const finalCover = customCoverUrl || generateGhostCoverSvg(
      title,
      authorName || 'Community Creator',
      type,
      new Date().getFullYear(),
      GHOST_COVER_PALETTES[1]
    );

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
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Box */}
      <div
        className="relative z-10 bg-[#FAF8F5] dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header (Pinned) */}
        <div className="px-5 py-4 sm:px-6 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#12141A] shrink-0">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight">
              Publish &amp; Share Your Creation
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Self-publish books, comics, or manga on the Open Digital Library
            </p>
          </div>
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

                {isProcessingFile && (
                  <div className="p-3 bg-[#C25E3A]/10 rounded-lg text-xs font-mono text-[#C25E3A] flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span>{uploadProgress}</span>
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
                  alert('Please enter a title for your work.');
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
