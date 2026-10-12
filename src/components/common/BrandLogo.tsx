import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'mark' | 'text';
}

/**
 * Official wanna read? brand logo component.
 * Features the signature original open-book geometric mark with coral page turn accent
 * paired with the lowercase serif "wanna read?" brand wordmark.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'full',
}) => {
  // Height & scale mappings
  const heightMap = {
    sm: { text: 'text-lg sm:text-xl', markW: 'w-6 sm:w-7', markH: 'h-5 sm:h-6' },
    md: { text: 'text-xl sm:text-[1.85rem]', markW: 'w-7 sm:w-9', markH: 'h-6 sm:h-8' },
    lg: { text: 'text-2xl sm:text-3xl', markW: 'w-9 sm:w-11', markH: 'h-8 sm:h-10' },
    xl: { text: 'text-3xl sm:text-5xl', markW: 'w-13 sm:w-16', markH: 'h-11 sm:h-14' },
  };

  const currentSize = heightMap[size] || heightMap.md;

  // Exact original vector icon of the open book with coral accent page
  const BookMark = (
    <svg
      viewBox="0 0 104 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentSize.markW} ${currentSize.markH} shrink-0 transition-transform duration-200 group-hover:scale-105`}
      aria-hidden="true"
    >
      {/* ── Left Open Page Frame ── */}
      <path
        d="M13 25.5C27 18 38 21.5 45 26.5V72.5C38 68 27 64 13 57.5V25.5Z"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ── Right Bottom Curved Page ── */}
      <path
        d="M55 72.5C64 68 81 64 89 57.5V47.5C81 52 66 56.5 55 59.5V72.5Z"
        fill="currentColor"
      />

      {/* ── Right Top Accent Page (Signature Coral #EE5836 Page Turn) ── */}
      <path
        d="M55 26.5C66 21 80 15 89 10.5V46.5C81 51 66 55.5 55 58.5V26.5Z"
        fill="#EE5836"
      />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {BookMark}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={`font-serif font-bold tracking-tight inline-flex items-baseline ${currentSize.text} ${className}`}>
        <span className="tracking-tight lowercase">wanna read</span>
        <span className="text-[#EE5836] font-serif font-black ml-0.5">?</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {BookMark}
      {showText && (
        <span className={`font-serif font-bold tracking-tight leading-none text-stone-900 dark:text-stone-100 flex items-baseline ${currentSize.text}`}>
          <span className="tracking-tight lowercase">wanna read</span>
          <span className="text-[#EE5836] font-serif font-black ml-0.5">?</span>
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
