import React, { useState } from 'react';
import { X, Upload, BookOpen } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { Work, Chapter, WorkType } from '../../types';
import { generateGhostCoverSvg, GHOST_COVER_PALETTES } from '../../services/coverService';

interface PublishWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishWorkModal: React.FC<PublishWorkModalProps> = ({ isOpen, onClose }) => {
  const { works, saveStoredWorks } = useLibrary();
  const { currentUser, userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(userProfile?.displayName || currentUser?.displayName || 'Community Creator');
  const [synopsis, setSynopsis] = useState('');
  const [type, setType] = useState<WorkType>('book');

  if (!isOpen) return null;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    const cover = generateGhostCoverSvg(title, authorName, type, new Date().getFullYear(), GHOST_COVER_PALETTES[1]);

    const newWork: Work = {
      id: `work-${slug}`,
      slug,
      title: title.trim(),
      type,
      description: synopsis.trim() || 'A self-published creation shared with the community.',
      synopsis: synopsis.trim() || 'A self-published creation shared with the community.',
      coverImage: cover,
      coverImageUrl: cover,
      language: 'English',
      licenseCode: 'COMMUNITY_OPEN',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceName: 'Community Self-Published',
      sourceUrl: '',
      attribution: `${authorName} (${new Date().getFullYear()})`,
      originalPublicationYear: new Date().getFullYear(),
      jurisdictionStatus: 'COMMUNITY_OPEN',
      jurisdictionNotes: 'Community open creation.',
      isHosted: true,
      readingDirection: 'ltr',
      publisherId: currentUser?.uid || 'user-anon',
      publisherEmail: currentUser?.email || '',
      publisherName: authorName,
      chapters: [
        {
          id: `chap-${slug}-1`,
          workId: `work-${slug}`,
          chapterNumber: 1,
          number: 1,
          title: 'Chapter 1: Opening',
          slug: 'chapter-1',
          content: synopsis.trim() || 'Welcome to this newly published creation.',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    saveStoredWorks([newWork, ...works]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg">Publish New Work</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Chronicles of the Star"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Author / Creator</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Format Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WorkType)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A]"
            >
              <option value="book">Book / Novel / Prose</option>
              <option value="manga">Manga / Webtoon</option>
              <option value="comic">Comic / Graphic Novel</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Synopsis</label>
            <textarea
              rows={3}
              placeholder="Brief summary of your work..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#C25E3A]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#C25E3A] hover:bg-[#a84e2e] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Publish Work
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
