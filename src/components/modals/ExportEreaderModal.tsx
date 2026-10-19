import React from 'react';
import { X, Download, BookOpen } from 'lucide-react';
import { Work } from '../../types';

interface ExportEreaderModalProps {
  work: Work;
  onClose: () => void;
}

export const ExportEreaderModal: React.FC<ExportEreaderModalProps> = ({ work, onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg">Export E-Reader Edition</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-stone-500">Download {work.title} in EPUB or PDF format for your Kindle, Kobo, or e-reader device.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
