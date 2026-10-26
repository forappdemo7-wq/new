import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TextHighlight } from '../../types';
import { X, Trash2, Edit3, Check, Copy, MessageSquare, Bookmark } from 'lucide-react';

interface AnnotationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: TextHighlight[];
  onDeleteHighlight: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  workTitle: string;
  authorName: string;
}

const COLOR_CLASSES: Record<TextHighlight['color'], { bg: string; text: string; border: string; label: string }> = {
  ochre: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-800', label: 'Ochre' },
  sage: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-900 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-800', label: 'Sage' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-900 dark:text-rose-200', border: 'border-rose-300 dark:border-rose-800', label: 'Rose' },
  cobalt: { bg: 'bg-sky-100 dark:bg-sky-950/40', text: 'text-sky-900 dark:text-sky-200', border: 'border-sky-300 dark:border-sky-800', label: 'Cobalt' },
};

export const AnnotationsDrawer: React.FC<AnnotationsDrawerProps> = ({
  isOpen,
  onClose,
  highlights,
  onDeleteHighlight,
  onUpdateNote,
  workTitle,
  authorName
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleStartEdit = (h: TextHighlight) => {
    setEditingId(h.id);
    setEditNoteText(h.note || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateNote(id, editNoteText.trim());
    setEditingId(null);
  };

  const handleCopyQuote = (h: TextHighlight) => {
    const citation = `“${h.text}”\n— ${authorName}, ${workTitle} (${h.chapterTitle || 'Chapter'})\n[Archived via wanna read? Open Library]`;
    navigator.clipboard.writeText(citation);
    setCopiedId(h.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
      >
        <motion.div
          initial={{ x: 360 }}
          animate={{ x: 0 }}
          exit={{ x: 360 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#FAF8F5] dark:bg-[#121824] border-l border-stone-200 dark:border-slate-800 h-full p-6 flex flex-col space-y-5 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-semibold">
                Marginalia &amp; Folios
              </div>
              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                Highlights &amp; Notes ({highlights.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Annotations List */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {highlights.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 text-stone-400 dark:text-slate-500">
                <Bookmark className="w-8 h-8 opacity-40" />
                <p className="font-serif text-sm">No highlights or notes recorded yet.</p>
                <p className="text-xs max-w-xs leading-relaxed">
                  Select any passage of text while reading to apply archival colors, attach reflections, or copy formatted citations.
                </p>
              </div>
            ) : (
              highlights.map((h) => {
                const style = COLOR_CLASSES[h.color] || COLOR_CLASSES.ochre;
                const isEditing = editingId === h.id;

                return (
                  <div
                    key={h.id}
                    className={`p-4 rounded-xl border ${style.border} ${style.bg} space-y-2.5 shadow-2xs transition-all`}
                  >
                    {/* Chapter & Date kicker */}
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400">
                      <span>{h.chapterTitle || 'Chapter'}</span>
                      <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Excerpt text */}
                    <blockquote className={`font-serif text-xs leading-relaxed italic ${style.text} pl-2 border-l-2 ${style.border}`}>
                      “{h.text}”
                    </blockquote>

                    {/* Margin Note content or Editor */}
                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-lg text-stone-900 dark:text-white font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(h.id)}
                            className="px-3 py-1 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-md"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      h.note && (
                        <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-stone-200/60 dark:border-slate-800/60 text-xs text-stone-800 dark:text-stone-200 font-sans space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold uppercase">
                            <MessageSquare className="w-3 h-3" />
                            <span>Margin Note</span>
                          </div>
                          <p className="leading-snug">{h.note}</p>
                        </div>
                      )
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 dark:border-slate-800/50 text-xs">
                      <button
                        onClick={() => handleCopyQuote(h)}
                        className="flex items-center gap-1 text-[11px] text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white font-medium cursor-pointer"
                      >
                        {copiedId === h.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied Quote</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Citation</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEdit(h)}
                            title="Edit Note"
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteHighlight(h.id)}
                          title="Delete Highlight"
                          className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
