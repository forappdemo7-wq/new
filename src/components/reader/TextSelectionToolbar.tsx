import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, MessageSquarePlus, Check, X, Sparkles } from 'lucide-react';

interface TextSelectionToolbarProps {
  position: { top: number; left: number };
  selectedText?: string;
  onHighlight: (color: 'ochre' | 'sage' | 'rose' | 'cobalt', note?: string) => void;
  onCopyQuote: () => void;
  onExplainContext?: () => void;
  onClose: () => void;
}

const COLORS: { key: 'ochre' | 'sage' | 'rose' | 'cobalt'; bg: string; border: string; label: string }[] = [
  { key: 'ochre', bg: 'bg-amber-400', border: 'border-amber-600', label: 'Ochre Gold' },
  { key: 'sage', bg: 'bg-emerald-400', border: 'border-emerald-600', label: 'Sage Green' },
  { key: 'rose', bg: 'bg-rose-400', border: 'border-rose-600', label: 'Rose Red' },
  { key: 'cobalt', bg: 'bg-sky-400', border: 'border-sky-600', label: 'Cobalt Blue' },
];

export const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({
  position,
  onHighlight,
  onCopyQuote,
  onExplainContext,
  onClose
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedColor, setSelectedColor] = useState<'ochre' | 'sage' | 'rose' | 'cobalt'>('ochre');
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyQuote();
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  const handleSaveWithNote = () => {
    onHighlight(selectedColor, noteText.trim());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }}
      style={{
        top: `${Math.max(10, position.top - 54)}px`,
        left: `${Math.max(10, position.left)}px`,
      }}
      className="fixed z-50 -translate-x-1/2 bg-stone-900 dark:bg-stone-950 text-white rounded-xl shadow-2xl border border-stone-700/80 p-1.5 flex flex-col gap-2 backdrop-blur-md select-none"
    >
      {!showNoteInput ? (
        <div className="flex items-center gap-1">
          {/* AI Explain Context Button */}
          {onExplainContext && (
            <button
              onClick={() => {
                onExplainContext();
                onClose();
              }}
              title="Explain Context & History with AI"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg transition-colors cursor-pointer border border-amber-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Explain</span>
            </button>
          )}

          {/* Highlight Color Pickers */}
          <div className="flex items-center gap-1.5 px-2 py-1 border-r border-stone-700/80">
            {COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => onHighlight(c.key)}
                title={`Highlight in ${c.label}`}
                className={`w-5 h-5 rounded-full ${c.bg} hover:scale-115 transition-transform cursor-pointer border border-black/20 shadow-xs`}
              />
            ))}
          </div>

          {/* Add Margin Note Button */}
          <button
            onClick={() => setShowNoteInput(true)}
            title="Add Margin Note"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-200 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Note</span>
          </button>

          {/* Copy Quote Button */}
          <button
            onClick={handleCopy}
            title="Copy Quote with Citation"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-200 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Quote</span>
              </>
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded-md transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Note Input Form */
        <div className="p-2 space-y-2 w-72">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Add Margin Note
            </span>
            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedColor(c.key)}
                  className={`w-3.5 h-3.5 rounded-full ${c.bg} ${selectedColor === c.key ? 'ring-2 ring-white' : 'opacity-60'} cursor-pointer`}
                />
              ))}
            </div>
          </div>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your observation or reflection..."
            rows={2}
            autoFocus
            className="w-full p-2 text-xs bg-stone-800 border border-stone-700 rounded-lg text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans resize-none"
          />

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              onClick={() => setShowNoteInput(false)}
              className="px-2.5 py-1 text-xs text-stone-400 hover:text-white rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWithNote}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-xs"
            >
              Save Note
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

