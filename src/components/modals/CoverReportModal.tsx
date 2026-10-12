import React, { useState } from 'react';
import { Work } from '../../types';
import { saveCoverReport } from '../../services/coverService';
import { AlertTriangle, CheckCircle2, X, ShieldAlert, Flag } from 'lucide-react';

interface CoverReportModalProps {
  work: Work;
  isOpen: boolean;
  onClose: () => void;
}

export const CoverReportModal: React.FC<CoverReportModalProps> = ({ work, isOpen, onClose }) => {
  const [reason, setReason] = useState<'cover_infringement' | 'cover_mismatch' | 'cover_broken' | 'copyright' | 'other'>('cover_mismatch');
  const [details, setDetails] = useState('');
  const [suggestedSource, setSuggestedSource] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    saveCoverReport({
      workId: work.id,
      workTitle: work.title,
      reason,
      details,
      suggestedSource: suggestedSource.trim() || undefined,
      reporterContact: reporterContact.trim() || undefined
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1A1918] rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 text-[#C25E3A]">
            <Flag className="w-5 h-5" />
            <h3 className="font-serif text-xl font-bold text-[#1A1A1A] dark:text-white">
              Report Cover Image
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-serif text-lg font-bold text-[#1A1A1A] dark:text-white">
              Cover Report Logged
            </h4>
            <p className="text-xs text-stone-500 font-sans max-w-xs mx-auto">
              Our licensing compliance registrar will audit the cover image provenance for "{work.title}" within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <span className="text-stone-500">Reporting cover for: </span>
              <span className="font-bold text-[#1A1A1A] dark:text-white">{work.title}</span>
            </div>

            {/* Reason selector */}
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Reason for Cover Flag
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 rounded border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#3B4CCA]"
              >
                <option value="cover_mismatch">Incorrect Cover (Doesn't match this edition/title)</option>
                <option value="cover_infringement">Copyright / Unauthorized Modern Artwork</option>
                <option value="cover_broken">Low Quality, Cropped, or Broken Scan</option>
                <option value="other">Other Sourcing / Licensing Issue</option>
              </select>
            </div>

            {/* Explanation */}
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Details &amp; Observations *
              </label>
              <textarea
                required
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the discrepancy, why the cover may infringe copyright, or link to the verified public domain original…"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 rounded border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#3B4CCA]"
              />
            </div>

            {/* Suggested public domain replacement link */}
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Suggested Public Domain Source / URL (Optional)
              </label>
              <input
                type="url"
                value={suggestedSource}
                onChange={(e) => setSuggestedSource(e.target.value)}
                placeholder="https://commons.wikimedia.org/... or Open Library link"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 rounded border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#3B4CCA]"
              />
            </div>

            {/* Reporter Contact */}
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Your Email (Optional, for auditor follow-up)
              </label>
              <input
                type="email"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                placeholder="archivist@example.org"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 rounded border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#3B4CCA]"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#C25E3A] hover:bg-[#A84D2C] rounded transition-colors shadow-xs"
              >
                Submit Cover Audit Report
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
export default CoverReportModal;
