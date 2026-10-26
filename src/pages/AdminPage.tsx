import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import { CoverManager } from '../components/admin/CoverManager';
import { IngestionPipelinePanel } from '../components/admin/IngestionPipelinePanel';
import { UserModerationPanel } from '../components/admin/UserModerationPanel';
import { Work, WorkType, FileFormat, Chapter, Author, ReportItem, LicenseAudit, JurisdictionStatus, ReadingDirection, Demographic } from '../types';
import {
  Shield,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Globe,
  ExternalLink,
  ShieldCheck,
  Check,
  ImageIcon,
  Database,
  UserX,
  Users,
  Ban,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Loader2
} from 'lucide-react';
import defaultMangaCover from '../assets/images/manga_hokusai_woodblock_1790760941217.jpg';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const AdminPage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    userProfile,
    isAdmin,
    adminLogin,
    adminLogout,
    adminChangeUserPassword
  } = useAuth();
  const {
    works,
    createOrUpdateWork,
    removeWork,
    restoreSeedCatalog,
    reports,
    audits,
    bannedUsers,
    addAuditLog
  } = useLibrary();

  // Admin Login Screen state (shown when not authenticated)
  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!adminIdInput.trim()) {
      setLoginError('Please enter your Administrator ID or Email.');
      return;
    }
    if (!adminPasswordInput) {
      setLoginError('Please enter your Administrator Password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await adminLogin(adminIdInput, adminPasswordInput);
      setAdminPasswordInput('');
    } catch (err: any) {
      setLoginError(err?.message || 'Access Denied: Incorrect Admin ID or Password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'works' | 'creators_moderation' | 'ingestion_pipeline' | 'cover_manager' | 'new_work' | 'needs_review' | 'audit_logs' | 'reports' | 'import_export'>('works');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteWorkTarget, setDeleteWorkTarget] = useState<Work | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);

  // New Work Form State
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    nativeTitle: string;
    romajiTitle: string;
    slug: string;
    type: WorkType;
    description: string;
    synopsis: string;
    coverImage: string;
    authorName: string;
    authorRole: string;
    genres: string;
    tags: string;
    licenseCode: string;
    sourceName: string;
    sourceUrl: string;
    attribution: string;
    publisher: string;
    publicationYear: number;
    jurisdictionStatus: JurisdictionStatus;
    jurisdictionNotes: string;
    readingDirection: ReadingDirection;
    demographic: Demographic;
    isHosted: boolean;
    externalReadUrl: string;
    fileFormat: FileFormat;
    chapter1Title: string;
    chapter1Content: string;
    verifiedBy: string;
    evidenceUrl: string;
  }>({
    title: '',
    nativeTitle: '',
    romajiTitle: '',
    slug: '',
    type: 'manga',
    description: '',
    synopsis: '',
    coverImage: defaultMangaCover,
    authorName: '',
    authorRole: 'Mangaka',
    genres: 'Historical, Adventure',
    tags: 'Manga, Public Domain, Japanese Heritage',
    licenseCode: 'WORLDWIDE_PD',
    sourceName: 'Smithsonian Libraries / National Diet Library',
    sourceUrl: 'https://library.si.edu',
    attribution: 'Attribution statement under open license terms.',
    publisher: '',
    publicationYear: 1910,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Author passed away >70 years ago. Free from copyright restrictions worldwide.',
    readingDirection: 'rtl',
    demographic: 'shonen',
    isHosted: true,
    externalReadUrl: '',
    fileFormat: 'images',
    chapter1Title: 'Volume 1 / Chapter 1',
    chapter1Content: 'Story text or panel description...',
    verifiedBy: 'Senior Licensing Auditor',
    evidenceUrl: 'https://library.si.edu'
  });

  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await adminLogout();
    setAdminPasswordInput('');
    setLoginError(null);
  };
  const [jsonInput, setJsonInput] = useState('');

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSaveWork = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce Rule 1 & Part 11:
    // A work cannot be published unless it allows hosting OR isHosted = false with externalReadUrl
    if (formData.licenseCode === 'LINK_OUT_ONLY' && !formData.externalReadUrl) {
      showNotification('Link-out works MUST supply an External Read URL pointing to the official authorized portal.');
      return;
    }

    const slug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = editingWorkId || ('work-' + Date.now());

    const author: Author = {
      id: 'auth-' + slug,
      name: formData.authorName || 'Unknown Creator',
      slug: (formData.authorName || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      role: formData.authorRole as any,
      bio: `Creator of ${formData.title}`,
      verifiedOpenLicense: true
    };

    const chapter: Chapter = {
      id: 'ch-' + id + '-1',
      workId: id,
      number: 1,
      chapterNumber: 1,
      title: formData.chapter1Title || 'Chapter 1',
      slug: 'chapter-1',
      wordCount: formData.chapter1Content.split(/\s+/).length,
      content: formData.chapter1Content
    };

    const newWork: Work = {
      id,
      title: formData.title,
      nativeTitle: formData.nativeTitle.trim() || undefined,
      romajiTitle: formData.romajiTitle.trim() || undefined,
      slug,
      type: formData.type,
      description: formData.description,
      synopsis: formData.synopsis || formData.description,
      coverImage: formData.coverImage,
      language: formData.type === 'manga' ? 'Japanese / English' : 'English',
      licenseCode: formData.licenseCode,
      licenseUrl: formData.licenseCode === 'CC0-1.0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : 'https://creativecommons.org/',
      sourceName: formData.sourceName,
      sourceUrl: formData.sourceUrl,
      attribution: formData.attribution,
      publisher: formData.publisher.trim() || undefined,
      originalPublicationYear: Number(formData.publicationYear) || 2024,
      jurisdictionStatus: formData.jurisdictionStatus,
      jurisdictionNotes: formData.jurisdictionNotes,
      isHosted: formData.isHosted,
      externalReadUrl: formData.externalReadUrl.trim() || undefined,
      readingDirection: formData.readingDirection,
      demographic: formData.demographic,
      authors: [author],
      genres: formData.genres.split(',').map(s => s.trim()).filter(Boolean),
      tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
      chapters: formData.isHosted ? [chapter] : [],
      fileFormat: formData.isHosted ? formData.fileFormat : 'link_only',
      status: 'completed',
      popularityScore: 85,
      verificationStatus: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: formData.verifiedBy || 'Curator',
      evidenceUrl: formData.evidenceUrl || formData.sourceUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createOrUpdateWork(newWork);
    showNotification(`Work "${formData.title}" saved & license verification audit logged!`);
    setActiveTab('works');
    setEditingWorkId(null);
  };

  const handleEdit = (w: Work) => {
    setEditingWorkId(w.id);
    setFormData({
      id: w.id,
      title: w.title,
      nativeTitle: w.nativeTitle || '',
      romajiTitle: w.romajiTitle || '',
      slug: w.slug,
      type: w.type,
      description: w.description,
      synopsis: w.synopsis,
      coverImage: w.coverImage,
      authorName: (w.authors && w.authors[0]?.name) || '',
      authorRole: (w.authors && w.authors[0]?.role) || 'Author',
      genres: (w.genres || []).join(', '),
      tags: (w.tags || []).join(', '),
      licenseCode: w.licenseCode || 'WORLDWIDE_PD',
      sourceName: w.sourceName || '',
      sourceUrl: w.sourceUrl || '',
      attribution: w.attribution || '',
      publisher: w.publisher || '',
      publicationYear: w.originalPublicationYear || 1900,
      jurisdictionStatus: w.jurisdictionStatus || 'COMMUNITY_OPEN',
      jurisdictionNotes: w.jurisdictionNotes || '',
      readingDirection: w.readingDirection || 'ltr',
      demographic: w.demographic || 'general',
      isHosted: w.isHosted !== false,
      externalReadUrl: w.externalReadUrl || '',
      fileFormat: w.fileFormat || 'images',
      chapter1Title: (w.chapters && w.chapters[0]?.title) || 'Chapter 1',
      chapter1Content: (w.chapters && w.chapters[0]?.content) || '',
      verifiedBy: w.verifiedBy || 'Senior Licensing Auditor',
      evidenceUrl: w.evidenceUrl || w.sourceUrl
    });
    setActiveTab('new_work');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(works, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `getnow-complete-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        parsed.forEach(w => createOrUpdateWork(w));
        showNotification(`Successfully imported ${parsed.length} works!`);
        setJsonInput('');
        setActiveTab('works');
      } else {
        showNotification('JSON must be an array of Work objects.');
      }
    } catch {
      showNotification('Invalid JSON formatting.');
    }
  };

  const needsReviewList = works.filter(w => w.verificationStatus === 'needs_review');

  // RESTRICTED ACCESS GATE: If not logged in as Admin, show ONLY the Admin Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-white">
              Administrator Login
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Restricted curatorial portal. Please enter your administrator ID and password to access dashboard controls.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                Administrator ID / Email:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminIdInput}
                  onChange={(e) => setAdminIdInput(e.target.value)}
                  placeholder="Enter Administrator ID or Email"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#0E121A] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                Administrator Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#0E121A] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Log In to Admin Console</span>
            </button>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center font-sans">
              Curator credentials: ID <span className="font-mono text-stone-700 dark:text-stone-300">admin</span> · Password <span className="font-mono text-stone-700 dark:text-stone-300">admin123</span>
            </p>
          </form>

          <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
            >
              ← Return to Public Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 transition-colors duration-150">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 border-b border-stone-300 dark:border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-3 py-1 rounded-full w-fit border border-amber-300 dark:border-amber-800/80 shadow-2xs">
            <Shield className="w-4.5 h-4.5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Compliance &amp; Curatorial Console</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight mt-2.5">
            Admin Dashboard &amp; License Audit System
          </h1>
          <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-medium mt-1.5 leading-relaxed">
            Enforces Rule 1 redistribution verification, jurisdiction tagging, audit trail logging, and DMCA management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRestoreModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151820] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>Restore 21 Seed Works</span>
          </button>
        </div>
      </div>

      {/* Administrator Authentication Status Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
              <span>Administrator Console Unlocked</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 font-bold uppercase tracking-wider">
                Authenticated
              </span>
            </div>
            <div className="text-emerald-700 dark:text-emerald-400 text-xs">
              Logged in as <span className="font-mono font-semibold">{userProfile?.displayName || userProfile?.email || currentUser?.email || 'System Administrator'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Sign Out</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-300 dark:border-stone-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('works')}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'works'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-black shadow-sm'
              : 'text-stone-800 dark:text-stone-100 hover:text-stone-950 dark:hover:text-white bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700'
          }`}
        >
          Cataloged Works ({works.length})
        </button>

        <button
          onClick={() => setActiveTab('creators_moderation')}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'creators_moderation'
              ? 'bg-rose-700 dark:bg-rose-600 text-white font-black shadow-sm'
              : 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/80 font-bold'
          }`}
        >
          <Users className="w-4 h-4 text-rose-600 dark:text-rose-300" />
          <span>Users, Passwords &amp; Bans</span>
        </button>

        <button
          onClick={() => setActiveTab('ingestion_pipeline')}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ingestion_pipeline'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-black shadow-sm'
              : 'text-stone-800 dark:text-stone-100 hover:text-stone-950 dark:hover:text-white bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Ingestion Engine (Bulk Harvest)</span>
        </button>

        <button
          onClick={() => setActiveTab('cover_manager')}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'cover_manager'
              ? 'bg-[#3B4CCA] text-white font-black shadow-sm'
              : 'text-stone-800 dark:text-stone-100 hover:text-stone-950 dark:hover:text-white bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Cover Manager (Open Library &amp; Sourcing)</span>
        </button>

        <button
          onClick={() => {
            setEditingWorkId(null);
            setActiveTab('new_work');
          }}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'new_work'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-black shadow-sm'
              : 'text-stone-800 dark:text-stone-100 hover:text-stone-950 dark:hover:text-white bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{editingWorkId ? 'Edit Work' : 'Add New Work'}</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'audit_logs'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-black shadow-sm'
              : 'text-stone-800 dark:text-stone-100 hover:text-stone-950 dark:hover:text-white bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>License Audit Trail ({audits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-black shadow-sm'
              : 'text-stone-800 dark:text-stone-100 hover:text-stone-950 dark:hover:text-white bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span>Reports &amp; Inquiries ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import_export')}
          className={`px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'import_export'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-black shadow-sm'
              : 'text-stone-800 dark:text-stone-100 hover:text-stone-950 dark:hover:text-white bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700'
          }`}
        >
          <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Import / Export</span>
        </button>
      </div>

      {/* ================= TAB: CREATOR MODERATION & BANS ================= */}
      {activeTab === 'creators_moderation' && <UserModerationPanel />}

      {/* ================= TAB: INGESTION PIPELINE ================= */}
      {activeTab === 'ingestion_pipeline' && <IngestionPipelinePanel />}

      {/* ================= TAB: COVER MANAGER ================= */}
      {activeTab === 'cover_manager' && <CoverManager />}

      {/* ================= TAB: WORKS LIST ================= */}
      {activeTab === 'works' && (
        <div className="bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="bg-stone-50 dark:bg-[#1A1D26] border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Title &amp; Native Script</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Author / Mangaka</th>
                  <th className="py-3 px-4">Publisher / User</th>
                  <th className="py-3 px-4">License</th>
                  <th className="py-3 px-4">Hosting Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {works.map((w: Work) => (
                  <tr key={w.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">{w.title}</div>
                      {w.nativeTitle && (
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">{w.nativeTitle}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-mono text-[11px]">
                      {w.type}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {(w.authors || []).map((a: Author) => a.name).join(', ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-stone-800 dark:text-stone-200 truncate max-w-[140px]">
                        {w.publisherName || (w.authors && w.authors[0]?.name) || 'System / Seed'}
                      </div>
                      {w.publisherEmail && (
                        <div className="text-[10px] font-mono text-stone-400 truncate max-w-[140px]">
                          {w.publisherEmail}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-[#C25E3A] dark:text-[#D9774F] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                        {w.licenseCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {w.isHosted ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Hosted</span>
                      ) : (
                        <span className="text-amber-800 dark:text-amber-400 font-medium flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          <span>Link-Out</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/work/${w.slug}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 rounded-lg cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(w)}
                        className="p-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                        title="Edit work"
                      >
                        <Edit3 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => setDeleteWorkTarget(w)}
                        className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                        title="Delete work"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: NEW / EDIT WORK ================= */}
      {activeTab === 'new_work' && (
        <form onSubmit={handleSaveWork} className="bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-6 text-xs text-stone-900 dark:text-stone-100 shadow-2xs">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {editingWorkId ? 'Edit Work Information' : 'License-Verified Work Ingestion'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
              Only publish works where worldwide redistribution is verified under Part 1.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Work Title (English) *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Hokusai Manga Vol. 4"
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Native Script (Kanji/Japanese/Original)</label>
              <input
                type="text"
                value={formData.nativeTitle}
                onChange={e => setFormData({ ...formData, nativeTitle: e.target.value })}
                placeholder="e.g., 北斎漫画 四編"
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Romaji Title (if applicable)</label>
              <input
                type="text"
                value={formData.romajiTitle}
                onChange={e => setFormData({ ...formData, romajiTitle: e.target.value })}
                placeholder="e.g., Hokusai Manga Yonhen"
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Medium / Type *</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="manga">Manga / Historical Japanese Art</option>
                <option value="comic">Comic / Webtoon</option>
                <option value="book">Book / Novel / Monograph</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Reading Direction</label>
              <select
                value={formData.readingDirection}
                onChange={e => setFormData({ ...formData, readingDirection: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="rtl">Right-to-Left (Manga Standard)</option>
                <option value="ltr">Left-to-Right (Western Books/Comics)</option>
                <option value="vertical">Vertical (Webtoon Scroll)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Demographic</label>
              <select
                value={formData.demographic}
                onChange={e => setFormData({ ...formData, demographic: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="general">General Audience</option>
                <option value="shonen">Shōnen (少年)</option>
                <option value="shojo">Shōjo (少女)</option>
                <option value="seinen">Seinen (青年)</option>
                <option value="josei">Josei (女性)</option>
                <option value="kodomomuke">Kodomomuke (子供向け)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Jurisdiction Clearance (Rule 5 &amp; 8) *</label>
              <select
                value={formData.jurisdictionStatus}
                onChange={e => setFormData({ ...formData, jurisdictionStatus: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="WORLDWIDE_PD">WORLDWIDE_PD (Life+70 &amp; Pre-1929)</option>
                <option value="CC">CC (Creative Commons Global)</option>
                <option value="PD_US_ONLY">PD_US_ONLY (Pre-1929 in US)</option>
                <option value="PD_JAPAN_ONLY">PD_JAPAN_ONLY (Expired prior to 2018)</option>
                <option value="AUTHOR_PERMITTED">AUTHOR_PERMITTED (Direct grant)</option>
                <option value="LINK_OUT_ONLY">LINK_OUT_ONLY (Never hosted)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Verified License Code *</label>
              <select
                value={formData.licenseCode}
                onChange={e => setFormData({ ...formData, licenseCode: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="WORLDWIDE_PD">WORLDWIDE_PD</option>
                <option value="CC0-1.0">CC0-1.0</option>
                <option value="CC-BY-4.0">CC-BY-4.0</option>
                <option value="CC-BY-SA-4.0">CC-BY-SA-4.0</option>
                <option value="CC-BY-NC-4.0">CC-BY-NC-4.0</option>
                <option value="CC-BY-NC-SA-3.0">CC-BY-NC-SA-3.0</option>
                <option value="FAL-1.3">FAL-1.3</option>
                <option value="AUTHOR_PERMITTED">AUTHOR_PERMITTED</option>
                <option value="LINK_OUT_ONLY">LINK_OUT_ONLY</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Hosting Mode</label>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-800 dark:text-stone-200">
                  <input
                    type="radio"
                    checked={formData.isHosted}
                    onChange={() => setFormData({ ...formData, isHosted: true })}
                    className="accent-amber-600"
                  />
                  <span>Host locally</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-800 dark:text-stone-200">
                  <input
                    type="radio"
                    checked={!formData.isHosted}
                    onChange={() => setFormData({ ...formData, isHosted: false, licenseCode: 'LINK_OUT_ONLY', jurisdictionStatus: 'LINK_OUT_ONLY' })}
                    className="accent-amber-600"
                  />
                  <span className="font-semibold text-amber-800 dark:text-amber-400">Link-Out Only (Part 3)</span>
                </label>
              </div>
            </div>

            {!formData.isHosted && (
              <div className="md:col-span-3 bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800">
                <label className="block font-bold text-amber-950 dark:text-amber-200 mb-1">
                  Official External Read Portal URL (Link-Out Only) *
                </label>
                <input
                  type="url"
                  required={!formData.isHosted}
                  value={formData.externalReadUrl}
                  onChange={e => setFormData({ ...formData, externalReadUrl: e.target.value })}
                  placeholder="https://www.mangaz.com / https://shonenjumpplus.com"
                  className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Author / Artist / Mangaka *</label>
              <input
                type="text"
                required
                value={formData.authorName}
                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="e.g., Katsushika Hokusai"
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Source Repository *</label>
              <input
                type="url"
                required
                value={formData.sourceUrl}
                onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://library.si.edu/..."
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Source Name *</label>
              <input
                type="text"
                required
                value={formData.sourceName}
                onChange={e => setFormData({ ...formData, sourceName: e.target.value })}
                placeholder="Smithsonian Libraries / Gutenberg / Project Stellar"
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Jurisdiction Legal Notes (Term &amp; Life+70 Rationale) *</label>
            <textarea
              rows={2}
              required
              value={formData.jurisdictionNotes}
              onChange={e => setFormData({ ...formData, jurisdictionNotes: e.target.value })}
              placeholder="e.g., Author died in 1849 (>175 years). Digital files dedicated to CC0 1.0 by the holding library. Safe globally."
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">Formal Attribution Statement *</label>
            <input
              type="text"
              required
              value={formData.attribution}
              onChange={e => setFormData({ ...formData, attribution: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('works')}
              className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Verify &amp; Publish Work</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB: AUDIT LOGS ================= */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs text-stone-900 dark:text-stone-100 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>License Verification Audit Trail (Rule 9 Compliance)</span>
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
                Every title carries an immutable record of verification date, auditor, and evidence URL.
              </p>
            </div>
            <button
              onClick={() => {
                const data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audits, null, 2));
                const a = document.createElement('a');
                a.href = data;
                a.download = `getnow-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
              }}
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Trail</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="bg-stone-50 dark:bg-[#1A1D26] border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Work Title</th>
                  <th className="py-2.5 px-3">Verified By</th>
                  <th className="py-2.5 px-3">Verification Timestamp</th>
                  <th className="py-2.5 px-3">Evidence Source URL</th>
                  <th className="py-2.5 px-3">Jurisdiction Assessment</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono text-[11px]">
                {audits.map((a: LicenseAudit) => (
                  <tr key={a.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                    <td className="py-3 px-3 font-sans font-semibold text-stone-900 dark:text-stone-100">{a.workTitle}</td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-300 font-sans">{a.verifiedBy}</td>
                    <td className="py-3 px-3 text-stone-500 dark:text-stone-400">{new Date(a.verifiedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-3 max-w-xs truncate">
                      <a href={a.evidenceUrl} target="_blank" rel="noreferrer" className="text-amber-700 dark:text-amber-400 hover:underline">
                        {a.evidenceUrl}
                      </a>
                    </td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-300 font-sans max-w-sm">{a.jurisdictionNotes}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: REPORTS ================= */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs text-stone-900 dark:text-stone-100 shadow-2xs">
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
            DMCA &amp; Licensing Inquiry Logs ({reports.length})
          </h3>
          <p className="text-stone-600 dark:text-stone-300">
            User notices submitted through the built-in "Report Work" modal or DMCA page.
          </p>

          {reports.length > 0 ? (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {reports.map((rep: ReportItem) => (
                <div key={rep.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 dark:text-stone-100">{rep.workTitle}</span>
                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      {new Date(rep.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-semibold">
                      Reason: {rep.reason}
                    </span>
                    {rep.reporterContact && (
                      <span className="text-stone-600 dark:text-stone-400">Contact: {rep.reporterContact}</span>
                    )}
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-[#1A1D26] p-3 rounded-xl border border-stone-200 dark:border-stone-800 font-sans">
                    {rep.details}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 dark:text-stone-500 py-8 text-center italic">
              No reports or copyright inquiries pending.
            </p>
          )}
        </div>
      )}

      {/* ================= TAB: IMPORT & EXPORT ================= */}
      {activeTab === 'import_export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs text-stone-900 dark:text-stone-100 shadow-2xs">
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              Export Catalog Snapshot
            </h3>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              Export all {works.length} works with complete metadata, chapters, jurisdiction notes, and sources as a portable JSON file.
            </p>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Catalog Backup</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#151820] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs text-stone-900 dark:text-stone-100 shadow-2xs">
            <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
              Import Metadata (JSON)
            </h3>
            <p className="text-stone-600 dark:text-stone-300">
              Paste an array of Work items or backup JSON to populate or update the catalog.
            </p>
            <textarea
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              rows={4}
              placeholder="[ { id: '...', title: '...' } ]"
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A1D26] text-stone-900 dark:text-stone-100 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
            <button
              onClick={handleImportJSON}
              className="px-4 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl border border-stone-300 dark:border-stone-700 cursor-pointer transition-colors"
            >
              Import JSON
            </button>
          </div>
        </div>
      )}

      {/* In-app Confirmation Modals replacing browser window.confirm (which blocks in iframes) */}
      <ConfirmModal
        isOpen={Boolean(deleteWorkTarget)}
        title="Delete Work from Catalog?"
        message={`Are you sure you want to permanently delete "${deleteWorkTarget?.title}"?\n\nThis action will immediately remove the work from the catalog, search results, and delete its database records.`}
        confirmLabel="Delete Work"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (deleteWorkTarget) {
            removeWork(deleteWorkTarget.id);
            showNotification(`Deleted "${deleteWorkTarget.title}"`);
            setDeleteWorkTarget(null);
          }
        }}
        onCancel={() => setDeleteWorkTarget(null)}
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        title="Restore Seed Catalog?"
        message="Are you sure you want to restore the 21 verified seed titles (Books, Comics, Manga, and Link-Out Portals)? Any previously removed default works will be reinstated."
        confirmLabel="Restore Catalog"
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={() => {
          restoreSeedCatalog();
          showNotification('Catalog restored to original 21 verified works.');
          setShowRestoreModal(false);
        }}
        onCancel={() => setShowRestoreModal(false)}
      />
    </div>
  );
};
