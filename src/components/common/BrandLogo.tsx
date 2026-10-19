import React from 'react';
import { BookOpen } from 'lucide-react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-xl bg-[#C25E3A] text-white flex items-center justify-center shadow-sm ${className}`}>
        <BookOpen className="w-3.5 h-3.5" />
      </div>
      <span className="font-serif font-bold text-lg tracking-tight">Wanna Read?</span>
    </div>
  );
};
