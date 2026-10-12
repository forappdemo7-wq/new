import React, { useState } from 'react';
import { Work } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ReportModalProps {
  work: Work;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ work, onClose }) => {
  const { sendReport } = useLibrary();
  const [reason, setReason] = useState<'copyright' | 'license_mismatch' | 'broken_content' | 'misattribution' | 'other'>('copyright');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    sendReport({
      workId: work.id,
      workTitle: work.title,
      reason,
      details: details.trim(),
      reporterContact: contactEmail.trim() || undefined
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-stone-200 transition-all duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2 text-stone-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif text-lg font-semibold">Report or DMCA Inquiry</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-serif text-base font-semibold text-stone-900">
              Inquiry Logged
            </h4>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Thank you for helping protect creator rights and catalog integrity. Our curatorial and compliance review team logs every inquiry immediately and takes down disputed material within 24 hours pending review.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded hover:bg-stone-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-4 space-y-4 text-xs">
            <div>
              <span className="font-semibold text-stone-700">Reporting Work: </span>
              <span className="font-medium text-stone-900">{work.title}</span>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1.5">
                Reason for Notice
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as any)}
                className="w-full p-2.5 rounded border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
              >
                <option value="copyright">Copyright Infringement / DMCA Takedown</option>
                <option value="license_mismatch">Incorrect License Specification</option>
                <option value="misattribution">Creator / Artist Misattribution</option>
                <option value="broken_content">Corrupted Content or Missing Pages</option>
                <option value="other">Other Legal or Catalog Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1.5">
                Specific Details &amp; Evidence (URLs, Proof of Ownership, or Source)
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                required
                rows={4}
                placeholder="Provide exact original publication details, proof of rights ownership, or description of license conflict..."
                className="w-full p-2.5 rounded border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1.5">
                Your Contact Email (Optional, for resolution confirmation)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="rights-holder@example.com"
                className="w-full p-2.5 rounded border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded transition-colors"
              >
                Submit Notice
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
