import React, { useState } from 'react';
import { Work } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { generateGhostCoverSvg } from '../../services/coverService';

interface PopularCardProps {
  work: Work;
  badgeTag?: string;
}

export const PopularCard: React.FC<PopularCardProps> = ({ work, badgeTag }) => {
  const { navigate } = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  const authorName = work.authors?.[0]?.name || 'Anonymous';
  const typeLabel = work.type === 'book' ? 'Book' : work.type === 'comic' ? 'Comic' : 'Manga';
  const tagLabel = badgeTag || (work.genres?.[0] || (work.type === 'manga' ? 'Manga' : work.type === 'comic' ? 'Comics' : 'Classic'));

  const coverSrc = !imageFailed && (work.coverImage || work.coverImageUrl)
    ? (work.coverImageUrl || work.coverImage)
    : generateGhostCoverSvg(
        work.title,
        authorName,
        typeLabel,
        work.originalPublicationYear,
        work.coverPalette
      );

  const handleCardClick = () => {
    const prefix =
      work.type === 'book' ? 'book' : work.type === 'comic' ? 'comic' : work.type === 'manga' ? 'manga' : 'work';
    navigate(`/${prefix}/${work.slug}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col cursor-pointer select-none space-y-2.5 transition-all duration-200"
    >
      {/* 2:3 Aspect Ratio Container with Tactile Hardcover Bevel */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-stone-200 dark:bg-slate-900 border border-stone-200/80 dark:border-white/[0.08] shadow-[0_4px_14px_-2px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5)] group-hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.28)] dark:group-hover:shadow-[0_20px_40px_-6px_rgba(0,0,0,0.7)] group-hover:-translate-y-1.5 transition-all duration-300">
        <img
          src={coverSrc}
          alt={work.title}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {/* Subtle Archival Hardcover Spine Shadow */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/45 via-black/15 to-transparent pointer-events-none" />
        {/* Page Edge Rim Highlight on Right */}
        <div className="absolute inset-y-0 right-0 w-[1.5px] bg-white/20 pointer-events-none" />
        {/* Subtle Ambient Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Literary Typography Details (Clean, Unboxed Metadata) */}
      <div className="space-y-0.5 min-w-0">
        {/* Unboxed Metadata Kicker (Zero-Pill Architecture) */}
        <div
          title={tagLabel}
          className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400/90 font-semibold truncate flex items-center gap-1.5"
        >
          <span className="truncate">{tagLabel}</span>
          {work.originalPublicationYear && (
            <>
              <span className="text-stone-300 dark:text-slate-600 font-sans" aria-hidden="true">·</span>
              <span className="text-stone-400 dark:text-slate-500 font-normal shrink-0">{work.originalPublicationYear}</span>
            </>
          )}
        </div>

        {/* Work Title */}
        <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
          {work.title}
        </h3>

        {/* Author Name */}
        <p className="text-xs text-stone-500 dark:text-slate-400 font-sans line-clamp-1">
          {authorName}
        </p>
      </div>
    </article>
  );
};

export default PopularCard;
