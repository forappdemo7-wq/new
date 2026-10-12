import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Work } from '../../types';
import { generateEpub, generateCbz, downloadBlob } from '../../services/exportService';
import { Download, Book, FileText, Layers, Check, Loader2, X, Tablet } from 'lucide-react';

interface ExportEreaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: Work;
}

export const ExportEreaderModal: React.FC<ExportEreaderModalProps> = ({ isOpen, onClose, work }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const cleanFilename = work.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const handleExportEpub = async () => {
    setDownloadingFormat('epub');
    try {
      const blob = await generateEpub(work);
      downloadBlob(blob, `${cleanFilename}.epub`);
      setDownloadSuccess('epub');
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err: any) {
      console.error('EPUB Generation error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportCbz = async () => {
    setDownloadingFormat('cbz');
    try {
      const blob = await generateCbz(work);
      downloadBlob(blob, `${cleanFilename}.cbz`);
      setDownloadSuccess('cbz');
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err: any) {
      console.error('CBZ Generation error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportTxt = () => {
    setDownloadingFormat('txt');
    try {
      const authorNames = work.authors?.map((a) => a.name).join(', ') || 'Anonymous';
      let fullText = `Title: ${work.title}\nAuthor: ${authorNames}\nLicense: ${work.licenseCode}\nPublisher: ${work.publisher || 'wanna read? Open Library'}\nYear: ${work.originalPublicationYear || 'Historic'}\n\n========================================\n\n`;

      (work.chapters || []).forEach((ch, idx) => {
        fullText += `\n\n[ CHAPTER ${ch.chapterNumber || idx + 1}: ${ch.title} ]\n\n${ch.content || ''}\n\n`;
      });

      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, `${cleanFilename}.txt`);
      setDownloadSuccess('txt');
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err: any) {
      console.error('TXT export error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (!isOpen) return null;

  const isComicOrManga = work.type === 'comic' || work.type === 'manga';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-[#0F172A] border border-stone-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-semibold">
              Open Commons Download
            </div>
            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
              Export for E-Reader &amp; Devices
            </h2>
          </div>
        </div>

        <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed font-sans">
          Download royalty-free unabridged editions formatted specifically for physical e-readers, tablets, and offline applications.
        </p>

        {/* Download Options */}
        <div className="space-y-3">
          {/* EPUB Option */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/60 flex items-center justify-between gap-4 hover:border-amber-400/80 transition-colors">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                  Standard EPUB Edition (.epub)
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded">
                  Kindle / Kobo / Apple Books
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Standard reflowable typography with chapters, metadata &amp; Table of Contents.
              </p>
            </div>
            <button
              onClick={handleExportEpub}
              disabled={downloadingFormat === 'epub'}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {downloadingFormat === 'epub' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : downloadSuccess === 'epub' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadSuccess === 'epub' ? 'Downloaded' : 'Download'}</span>
            </button>
          </div>

          {/* CBZ Option (For Manga / Comics) */}
          {isComicOrManga && (
            <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/60 flex items-center justify-between gap-4 hover:border-purple-400/80 transition-colors">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                    Comic Archive (.cbz)
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded">
                    Panels / Tachiyomi / Chunky
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Packaged sequential image archive with ComicInfo.xml metadata.
                </p>
              </div>
              <button
                onClick={handleExportCbz}
                disabled={downloadingFormat === 'cbz'}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {downloadingFormat === 'cbz' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : downloadSuccess === 'cbz' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{downloadSuccess === 'cbz' ? 'Downloaded' : 'Download'}</span>
              </button>
            </div>
          )}

          {/* Plain Text (.txt) Option */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/60 flex items-center justify-between gap-4 hover:border-stone-400 transition-colors">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                  Plain Text Archive (.txt)
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 rounded">
                  Raw Corpus / Archival
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                UTF-8 unabridged text without styling for study, archival preservation, or text analysis.
              </p>
            </div>
            <button
              onClick={handleExportTxt}
              disabled={downloadingFormat === 'txt'}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-900 dark:text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {downloadingFormat === 'txt' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : downloadSuccess === 'txt' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadSuccess === 'txt' ? 'Downloaded' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] font-mono text-stone-400 dark:text-slate-500 pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
          <span>License: {work.licenseCode}</span>
          <span>Redistributable Worldwide</span>
        </div>
      </motion.div>
    </div>
  );
};
export default ExportEreaderModal;
