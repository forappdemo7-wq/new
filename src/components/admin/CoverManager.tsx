import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Work, CoverSource, CoverLicense, CoverPalette } from '../../types';
import {
  GHOST_COVER_PALETTES,
  generateGhostCoverSvg,
  getOpenLibraryCoverUrl,
  autoFetchCoverForWork,
  isCoverLegallyPublishable,
  getStoredCoverReports,
  resolveCoverReport
} from '../../services/coverService';
import { fetchOpenLibraryCoverByISBN, fetchOpenLibraryCoverByOLID } from '../../services/openLibraryClient';
import {
  Search,
  Upload,
  Palette,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Image as ImageIcon,
  RotateCw,
  Sliders,
  ExternalLink,
  Layers,
  FileCheck,
  Zap,
  Info
} from 'lucide-react';

export const CoverManager: React.FC = () => {
  const { works, createOrUpdateWork, addAuditLog } = useLibrary();

  const [selectedWorkId, setSelectedWorkId] = useState<string>(works[0]?.id || '');
  const [filterType, setFilterType] = useState<'all' | 'books' | 'comics' | 'manga' | 'missing' | 'unknown_license'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sourcing form state
  const [activeSourceTab, setActiveSourceTab] = useState<'openlibrary' | 'upload' | 'bulk' | 'ghost' | 'reports'>('openlibrary');
  const [isbnInput, setIsbnInput] = useState('');
  const [olidInput, setOlidInput] = useState('');
  const [sizeOption, setSizeOption] = useState<'S' | 'M' | 'L'>('L');
  const [fetchingCover, setFetchingCover] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected work editable cover metadata
  const selectedWork = useMemo(() => works.find((w) => w.id === selectedWorkId), [works, selectedWorkId]);

  const [editCoverUrl, setEditCoverUrl] = useState(selectedWork?.coverImageUrl || selectedWork?.coverImage || '');
  const [editCoverSource, setEditCoverSource] = useState<CoverSource>((selectedWork?.coverSource as CoverSource) || 'Open Library');
  const [editCoverLicense, setEditCoverLicense] = useState<CoverLicense>(selectedWork?.coverLicense || 'Public Domain');
  const [editCoverAttribution, setEditCoverAttribution] = useState(
    selectedWork?.coverAttribution || `Cover art courtesy of ${selectedWork?.sourceName || 'Open Archive'}`
  );
  const [selectedGhostPalette, setSelectedGhostPalette] = useState<CoverPalette>(
    selectedWork?.coverPalette || GHOST_COVER_PALETTES[0]
  );

  // Bulk import state
  const [bulkProgress, setBulkProgress] = useState<{ running: boolean; current: number; total: number; logs: string[] }>({
    running: false,
    current: 0,
    total: 0,
    logs: []
  });

  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update form fields when selected work changes
  const handleSelectWork = (work: Work) => {
    setSelectedWorkId(work.id);
    setEditCoverUrl(work.coverImageUrl || work.coverImage || '');
    setEditCoverSource((work.coverSource as CoverSource) || 'Open Library');
    setEditCoverLicense(work.coverLicense || 'Public Domain');
    setEditCoverAttribution(
      work.coverAttribution || `Cover art for ${work.title} courtesy of ${work.sourceName || 'Open Archive'}`
    );
    if (work.isbn) setIsbnInput(work.isbn);
    if (work.olid) setOlidInput(work.olid);
    setFetchError(null);
  };

  // Filtered list of works
  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const matchSearch =
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.authors.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType === 'books') return w.type === 'book';
      if (filterType === 'comics') return w.type === 'comic';
      if (filterType === 'manga') return w.type === 'manga';
      if (filterType === 'missing') return !w.coverImage || w.coverImage.startsWith('data:image/svg');
      if (filterType === 'unknown_license') return !w.coverLicense || w.coverLicense === 'Unknown';
      return true;
    });
  }, [works, filterType, searchQuery]);

  // Open Library Fetch Trigger
  const handleFetchOpenLibrary = async () => {
    if (!selectedWork) return;
    setFetchingCover(true);
    setFetchError(null);

    try {
      let result;
      if (isbnInput.trim()) {
        result = await fetchOpenLibraryCoverByISBN(isbnInput, sizeOption, selectedWork.title);
      } else if (olidInput.trim()) {
        result = await fetchOpenLibraryCoverByOLID(olidInput, sizeOption, selectedWork.title);
      } else {
        setFetchError('Please enter an ISBN (e.g. 9780141439518) or Open Library ID (OLID).');
        setFetchingCover(false);
        return;
      }

      if (result.success && result.coverUrl) {
        setEditCoverUrl(result.coverUrl);
        setEditCoverSource('Open Library');
        setEditCoverLicense('Public Domain');
        setEditCoverAttribution(result.attribution);
        setStatusNotification({
          type: 'success',
          message: `Cover successfully retrieved from Open Library Covers API.`
        });
      } else {
        setFetchError(result.error || 'No cover found on Open Library for this identifier.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Error connecting to Open Library Covers API.');
    } finally {
      setFetchingCover(false);
    }
  };

  // Direct File Upload (Image or CBZ cover)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEditCoverUrl(dataUrl);
      setEditCoverSource('Manual Upload');
      setEditCoverLicense('Public Domain');
      setEditCoverAttribution(`Original scan/cover uploaded by archivist from file: ${file.name}`);
      setStatusNotification({
        type: 'success',
        message: `Uploaded cover file: ${file.name}`
      });
    };
    reader.readAsDataURL(file);
  };

  // Generate and Apply Ghost Cover
  const handleApplyGhostCover = () => {
    if (!selectedWork) return;
    const authorName = selectedWork.authors[0]?.name || 'Anonymous';
    const ghostSvg = generateGhostCoverSvg(
      selectedWork.title,
      authorName,
      selectedWork.type === 'manga' ? 'Manga' : selectedWork.type === 'comic' ? 'Comic' : 'Book',
      selectedWork.originalPublicationYear,
      selectedGhostPalette
    );

    setEditCoverUrl(ghostSvg);
    setEditCoverSource('Typographic Ghost Cover');
    setEditCoverLicense('CC0');
    setEditCoverAttribution(`Procedural minimalist archive cover designed with ${selectedGhostPalette.name} palette.`);
    setStatusNotification({
      type: 'success',
      message: `Generated typographic Ghost Cover with ${selectedGhostPalette.name} styling.`
    });
  };

  // Save changes to the selected work
  const handleSaveCoverMetadata = () => {
    if (!selectedWork) return;

    if (!isCoverLegallyPublishable(editCoverLicense)) {
      setStatusNotification({
        type: 'error',
        message: 'Legal Compliance Error: Cover license cannot be "Unknown". Please specify a verified license before saving.'
      });
      return;
    }

    const updatedWork: Work = {
      ...selectedWork,
      coverImage: editCoverUrl,
      coverImageUrl: editCoverUrl,
      coverSource: editCoverSource,
      coverLicense: editCoverLicense,
      coverAttribution: editCoverAttribution,
      coverStatus: 'published',
      coverPalette: selectedGhostPalette,
      isbn: isbnInput || selectedWork.isbn,
      olid: olidInput || selectedWork.olid,
      updatedAt: new Date().toISOString()
    };

    createOrUpdateWork(updatedWork);

    addAuditLog({
      workId: selectedWork.id,
      workTitle: selectedWork.title,
      verifiedBy: 'Archival Cover Manager',
      evidenceUrl: editCoverUrl.startsWith('data:') ? 'Local Archive File' : editCoverUrl,
      jurisdictionNotes: `Cover license verified as ${editCoverLicense} from source ${editCoverSource}. ${editCoverAttribution}`,
      status: 'verified'
    });

    setStatusNotification({
      type: 'success',
      message: `Successfully updated cover and legal metadata for "${selectedWork.title}".`
    });

    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Bulk Auto-Import Engine Simulator across 5 sources
  const handleRunBulkImport = async () => {
    setBulkProgress({ running: true, current: 0, total: works.length, logs: [] });

    const newLogs: string[] = [];
    for (let i = 0; i < works.length; i++) {
      const work = works[i];
      setBulkProgress((prev) => ({ ...prev, current: i + 1 }));

      const res = await autoFetchCoverForWork(work);
      newLogs.unshift(`[${work.type.toUpperCase()}] ${work.title}: ${res.message} (${res.source})`);

      if (res.success && res.coverUrl) {
        const updated: Work = {
          ...work,
          coverImage: res.coverUrl,
          coverImageUrl: res.coverUrl,
          coverSource: res.source,
          coverLicense: res.license,
          coverAttribution: res.attribution,
          coverStatus: 'published',
          updatedAt: new Date().toISOString()
        };
        createOrUpdateWork(updated);
      }
      setBulkProgress((prev) => ({ ...prev, logs: [...newLogs] }));
    }

    setBulkProgress((prev) => ({ ...prev, running: false }));
    setStatusNotification({
      type: 'success',
      message: `Bulk cover verification finished across ${works.length} titles.`
    });
  };

  const coverReports = getStoredCoverReports();

  return (
    <div className="space-y-8">
      {/* ── Section Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E3DD] dark:border-stone-800">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#3B4CCA] font-semibold mb-1">
            Archival Sourcing &amp; Compliance
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F5F3EF]">
            Cover Image Manager
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Source high-fidelity covers from Open Library, public domain archives, or procedural ghost typography with independent license tracking.
          </p>
        </div>

        <button
          onClick={handleRunBulkImport}
          disabled={bulkProgress.running}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#3B4CCA] hover:bg-[#303EAA] rounded-md transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{bulkProgress.running ? `Scanning ${bulkProgress.current}/${bulkProgress.total}…` : 'Run Bulk Auto-Import'}</span>
        </button>
      </div>

      {/* ── Status Notification Banner ────────────────────────────── */}
      {statusNotification && (
        <div
          className={`p-4 rounded-md text-xs font-sans flex items-center justify-between border ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusNotification.message}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="text-stone-400 hover:text-stone-700">
            ×
          </button>
        </div>
      )}

      {/* ── 2-Column Master Workspace ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Left Column: Works Browser (4 Cols) ─────────────────── */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1A1918] rounded-md border border-[#E5E3DD] dark:border-stone-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-xs text-[#1A1A1A] dark:text-[#F5F3EF]">
              Select Archive Work ({filteredWorks.length})
            </span>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or author…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-[#3B4CCA]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1 text-[11px] font-sans">
            {[
              { id: 'all', label: 'All' },
              { id: 'books', label: 'Books' },
              { id: 'comics', label: 'Comics' },
              { id: 'manga', label: 'Manga' },
              { id: 'missing', label: 'Ghost Only' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#1A1A1A] text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Works List */}
          <div className="max-h-[580px] overflow-y-auto space-y-1.5 pr-1">
            {filteredWorks.map((work) => {
              const isSelected = work.id === selectedWorkId;
              const hasCustomCover = work.coverImage && !work.coverImage.startsWith('data:image/svg');

              return (
                <div
                  key={work.id}
                  onClick={() => handleSelectWork(work)}
                  className={`p-2.5 rounded flex items-center gap-3 cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-[#3B4CCA] bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-[#3B4CCA]'
                      : 'border-transparent hover:border-stone-200 dark:hover:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/60'
                  }`}
                >
                  {/* Miniature 2:3 Cover preview */}
                  <div className="w-9 aspect-[2/3] shrink-0 rounded-xs overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <img
                      src={work.coverImageUrl || work.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono text-stone-400 uppercase">
                      {work.type} · {work.originalPublicationYear}
                    </div>
                    <div className="font-serif font-bold text-xs text-[#1A1A1A] dark:text-[#F5F3EF] truncate">
                      {work.title}
                    </div>
                    <div className="text-[11px] text-stone-500 font-sans truncate">
                      {work.authors.map((a) => a.name).join(', ')}
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono uppercase rounded ${
                      hasCustomCover
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {hasCustomCover ? 'Image' : 'Ghost'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Column: Sourcing & Compliance Studio (8 Cols) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {selectedWork ? (
            <div className="bg-white dark:bg-[#1A1918] rounded-md border border-[#E5E3DD] dark:border-stone-800 p-6 space-y-6">
              
              {/* Active Work Info Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#3B4CCA] font-semibold">
                    Editing Cover for
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#1A1A1A] dark:text-[#F5F3EF]">
                    {selectedWork.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-sans">
                    by {selectedWork.authors.map((a) => a.name).join(', ')} · Format: {selectedWork.type.toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 ${
                      isCoverLegallyPublishable(editCoverLicense)
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{editCoverLicense}</span>
                  </span>
                </div>
              </div>

              {/* ── Sourcing Mode Tabs ──────────────────────────────── */}
              <div className="flex border-b border-stone-200 dark:border-stone-800 gap-6 text-xs font-sans font-medium">
                {[
                  { id: 'openlibrary', label: 'Open Library Covers API' },
                  { id: 'upload', label: 'Direct Upload (Scan / CBZ)' },
                  { id: 'ghost', label: 'Typographic Ghost Studio' },
                  { id: 'reports', label: `Flagged Reports (${coverReports.length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSourceTab(tab.id as any)}
                    className={`pb-2.5 transition-colors cursor-pointer ${
                      activeSourceTab === tab.id
                        ? 'text-[#3B4CCA] font-bold border-b-2 border-[#3B4CCA]'
                        : 'text-stone-500 hover:text-[#1A1A1A] dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Tab 1: Open Library API Sourcing ─────────────────── */}
              {activeSourceTab === 'openlibrary' && (
                <div className="space-y-4 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-md border border-stone-200/80 dark:border-stone-800">
                  <div className="text-xs font-sans text-stone-600 dark:text-stone-300 leading-relaxed">
                    Fetch verified cover art directly from the Internet Archive &amp; Open Library Covers database via standard bibliographic identifiers.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-stone-500 mb-1">
                        ISBN-10 or ISBN-13
                      </label>
                      <input
                        type="text"
                        value={isbnInput}
                        onChange={(e) => setIsbnInput(e.target.value)}
                        placeholder="e.g. 9780141439518"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1A1918] rounded border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#3B4CCA]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-stone-500 mb-1">
                        Open Library ID (OLID)
                      </label>
                      <input
                        type="text"
                        value={olidInput}
                        onChange={(e) => setOlidInput(e.target.value)}
                        placeholder="e.g. OL12345M"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1A1918] rounded border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#3B4CCA]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs font-sans text-stone-600 dark:text-stone-300">
                      <span>Resolution:</span>
                      {(['S', 'M', 'L'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSizeOption(s)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                            sizeOption === s
                              ? 'bg-[#3B4CCA] text-white'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {s} ({s === 'L' ? 'Large' : s === 'M' ? 'Medium' : 'Small'})
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleFetchOpenLibrary}
                      disabled={fetchingCover}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#3B4CCA] hover:bg-[#303EAA] rounded transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${fetchingCover ? 'animate-spin' : ''}`} />
                      <span>{fetchingCover ? 'Fetching Cover…' : 'Fetch from Open Library'}</span>
                    </button>
                  </div>

                  {fetchError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs rounded">
                      {fetchError}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 2: Direct Upload (Scans / CBZ) ───────────────── */}
              {activeSourceTab === 'upload' && (
                <div className="p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg text-center space-y-3 bg-stone-50 dark:bg-stone-900/40">
                  <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                  <div>
                    <span className="font-sans font-bold text-xs text-[#1A1A1A] dark:text-white">
                      Upload Archival Image or Extract from CBZ/ZIP
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Supports JPG, PNG, WEBP, and CBZ archives (Max 15MB).
                    </p>
                  </div>
                  <label className="inline-block px-4 py-2 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#3B4CCA] rounded cursor-pointer transition-colors shadow-xs">
                    <span>Choose File from Computer</span>
                    <input type="file" accept="image/*,.cbz,.zip" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* ── Tab 3: Typographic Ghost Studio ─────────────────── */}
              {activeSourceTab === 'ghost' && (
                <div className="space-y-4 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-md border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-sans font-bold text-xs text-[#1A1A1A] dark:text-white">
                        Editorial Ghost Cover Customizer
                      </h4>
                      <p className="text-[11px] text-stone-500 font-sans">
                        Zero-slop procedural cover generator adhering to high-end European art monograph typography.
                      </p>
                    </div>

                    <button
                      onClick={handleApplyGhostCover}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#C25E3A] hover:bg-[#A84D2C] rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Render Ghost Cover</span>
                    </button>
                  </div>

                  {/* Palette Switcher */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {GHOST_COVER_PALETTES.map((pal) => (
                      <button
                        key={pal.name}
                        onClick={() => setSelectedGhostPalette(pal)}
                        className={`p-2.5 rounded border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          selectedGhostPalette.name === pal.name
                            ? 'border-[#3B4CCA] ring-1 ring-[#3B4CCA]'
                            : 'border-stone-200 dark:border-stone-800'
                        }`}
                        style={{ backgroundColor: pal.bg }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border border-white/40" style={{ backgroundColor: pal.accent }} />
                        <span className="text-[11px] font-sans font-semibold truncate" style={{ color: pal.text }}>
                          {pal.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab 4: Flagged Reports ──────────────────────────── */}
              {activeSourceTab === 'reports' && (
                <div className="space-y-3">
                  {coverReports.length > 0 ? (
                    coverReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 bg-stone-50 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4 text-xs font-sans"
                      >
                        <div>
                          <div className="font-bold text-[#1A1A1A] dark:text-white">
                            {rep.workTitle} — <span className="font-mono text-[10px] text-rose-600">{rep.reason}</span>
                          </div>
                          <p className="text-stone-600 dark:text-stone-300 mt-1">{rep.details}</p>
                          <div className="text-[10px] text-stone-400 mt-1">
                            Reported at: {new Date(rep.submittedAt).toLocaleString()}
                          </div>
                        </div>

                        {rep.status === 'pending' && (
                          <button
                            onClick={() => resolveCoverReport(rep.id)}
                            className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-stone-400 text-xs font-sans">
                      No open cover infringement or quality reports at this time.
                    </div>
                  )}
                </div>
              )}

              {/* ── Live 2:3 Cover Preview & Metadata Form ─────────── */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                
                {/* 2:3 Aspect Preview Card */}
                <div className="sm:col-span-4 flex flex-col items-center">
                  <div className="text-[11px] font-mono uppercase text-stone-500 mb-2">
                    Live 2:3 Digital Shelf Preview
                  </div>
                  <div className="w-44 aspect-[2/3] rounded-md overflow-hidden bg-stone-100 dark:bg-stone-900 border border-[#E5E3DD] dark:border-stone-700 shadow-md relative">
                    <img
                      src={editCoverUrl || generateGhostCoverSvg(selectedWork.title, selectedWork.authors[0]?.name)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Legal & Attribution Fields (CRITICAL) */}
                <div className="sm:col-span-8 space-y-4">
                  {/* Cover Source */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-stone-500 mb-1">
                      Cover Sourcing Origin
                    </label>
                    <select
                      value={editCoverSource}
                      onChange={(e) => setEditCoverSource(e.target.value as CoverSource)}
                      className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 rounded border border-stone-300 dark:border-stone-700 focus:outline-none"
                    >
                      <option value="Open Library">Open Library Covers API</option>
                      <option value="Digital Comic Museum">Digital Comic Museum (Golden Age)</option>
                      <option value="Comic Book Plus">Comic Book Plus (Golden/Silver Age)</option>
                      <option value="Wikimedia Commons">Wikimedia Commons (Public Domain Art)</option>
                      <option value="Rawpixel">Rawpixel Public Domain Vault</option>
                      <option value="Manual Upload">Manual Scan Upload</option>
                      <option value="Typographic Ghost Cover">Typographic Ghost Cover</option>
                    </select>
                  </div>

                  {/* Independent Cover License */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-stone-500 mb-1 flex items-center justify-between">
                      <span>Cover License (Independent from Work License)</span>
                      {editCoverLicense === 'Unknown' && (
                        <span className="text-rose-600 font-bold">Cannot Publish with 'Unknown'</span>
                      )}
                    </label>
                    <select
                      value={editCoverLicense}
                      onChange={(e) => setEditCoverLicense(e.target.value as CoverLicense)}
                      className={`w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 rounded border focus:outline-none ${
                        editCoverLicense === 'Unknown'
                          ? 'border-rose-500 text-rose-600 font-semibold'
                          : 'border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      <option value="Public Domain">Public Domain (Pre-1929 or Worldwide Expiry)</option>
                      <option value="CC0">CC0 1.0 Universal</option>
                      <option value="CC BY">CC BY 4.0 (Attribution Required)</option>
                      <option value="Fair Use">Fair Use (Thumbnail Reference Only)</option>
                      <option value="Unknown">Unknown (BLOCKS PUBLISHING)</option>
                    </select>
                  </div>

                  {/* Cover Attribution Statement */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-stone-500 mb-1">
                      Cover Attribution &amp; Credits
                    </label>
                    <input
                      type="text"
                      value={editCoverAttribution}
                      onChange={(e) => setEditCoverAttribution(e.target.value)}
                      placeholder="e.g. Cover art by Katsushika Hokusai, courtesy of National Diet Library"
                      className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 rounded border border-stone-300 dark:border-stone-700 focus:outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      onClick={handleSaveCoverMetadata}
                      disabled={editCoverLicense === 'Unknown'}
                      className="px-6 py-2.5 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#3B4CCA] disabled:bg-stone-400 dark:disabled:bg-stone-700 rounded transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Save &amp; Publish Cover Metadata</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 bg-white dark:bg-[#1A1918] rounded border border-[#E5E3DD]">
              Please select a work from the left panel to manage its cover image.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default CoverManager;
