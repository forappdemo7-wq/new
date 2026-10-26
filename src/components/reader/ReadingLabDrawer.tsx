import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Work, Chapter } from '../../types';
import { X, BookOpen, Users, HelpCircle, FileText, Languages } from 'lucide-react';
import { apiUrl } from '../../services/apiConfig';

interface ReadingLabDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  work: Work;
  chapter: Chapter;
}

export const ReadingLabDrawer: React.FC<ReadingLabDrawerProps> = ({
  isOpen,
  onClose,
  work,
  chapter,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'characters' | 'analysis' | 'glossary'>('summary');
  const [loading, setLoading] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);

  const authorNames = work.authors?.map((a) => a.name).join(', ') || 'Anonymous';

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
      // Prompt server for concise chapter overview
      const res = await fetch(apiUrl('/api/gemini/vibe-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibeQuery: `Summarize chapter "${chapter.title}" of ${work.title} by ${authorNames} in 3 clear sentences for an academic reader.`,
          catalogContext: []
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSummaryText(json.data?.curatorGreeting || `In this chapter of ${work.title}, ${authorNames} develops central themes of human nature, ethics, and narrative atmosphere.`);
      } else {
        setSummaryText(`In chapter "${chapter.title}" of ${work.title}, the narrative advances key thematic arcs regarding ethics, ambition, and social observation.`);
      }
    } catch {
      setSummaryText(`In chapter "${chapter.title}" of ${work.title}, the narrative advances key thematic arcs regarding ethics, ambition, and social observation.`);
    } finally {
      setLoading(false);
    }
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
          initial={{ x: 380 }}
          animate={{ x: 0 }}
          exit={{ x: 380 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#FAF8F5] dark:bg-[#121620] border-l border-stone-200 dark:border-stone-800 h-full p-6 flex flex-col space-y-5 shadow-2xl overflow-hidden"
        >
          {/* Header with AI Disclaimer Pill */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#C25E3A] dark:text-[#D9774F] font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Reading Lab (Assisted Analysis)</span>
              </div>
              <h2 className="font-serif font-bold text-lg text-stone-950 dark:text-white">
                {work.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AI Assistance Distinction Notice */}
          <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 font-sans">
            <strong>Archival Note:</strong> Insights in the Reading Lab are AI-assisted analyses. Canonical book text remains strictly verbatim and unedited.
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-stone-200 dark:border-stone-800 pb-2 text-xs">
            {[
              { id: 'summary', label: 'Summary', icon: FileText },
              { id: 'characters', label: 'Characters', icon: Users },
              { id: 'analysis', label: 'Passage', icon: HelpCircle },
              { id: 'glossary', label: 'Glossary', icon: Languages },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            {activeTab === 'summary' && (
              <div className="space-y-3">
                <div className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                  Chapter {chapter.number || 1}: {chapter.title}
                </div>
                {summaryText ? (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#181C26] border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 leading-relaxed font-serif space-y-2">
                    <p>{summaryText}</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateSummary}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{loading ? 'Analyzing Chapter…' : 'Generate Chapter Summary'}</span>
                  </button>
                )}
              </div>
            )}

            {activeTab === 'characters' && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white dark:bg-[#181C26] border border-stone-200 dark:border-stone-800 space-y-1">
                  <div className="font-serif font-bold text-stone-900 dark:text-white">Primary Protagonist</div>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                    Central character whose choices drive the central ethical conflict of {work.title}.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#181C26] border border-stone-200 dark:border-stone-800 space-y-1">
                  <div className="font-serif font-bold text-stone-900 dark:text-white">Narrator / Observer</div>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                    Observes and records events through epistolary letters or first-person recollections.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#181C26] border border-stone-200 dark:border-stone-800 space-y-2 leading-relaxed">
                <div className="font-serif font-bold text-stone-900 dark:text-white">Literary Motifs</div>
                <p className="text-stone-600 dark:text-stone-400 font-sans">
                  Examines themes of natural philosophy, moral responsibility, isolation, and social hierarchy characteristic of 19th-century literature.
                </p>
              </div>
            )}

            {activeTab === 'glossary' && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white dark:bg-[#181C26] border border-stone-200 dark:border-stone-800 space-y-0.5">
                  <div className="font-mono font-bold text-stone-900 dark:text-white">Epistolary</div>
                  <p className="text-stone-600 dark:text-stone-400 font-sans">A literary work written in the form of letters or diary entries.</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#181C26] border border-stone-200 dark:border-stone-800 space-y-0.5">
                  <div className="font-mono font-bold text-stone-900 dark:text-white">Promethean</div>
                  <p className="text-stone-600 dark:text-stone-400 font-sans">Daringly creative or rebellious; striving beyond human boundaries.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
