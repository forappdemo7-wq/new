import React from 'react';
import { Bell } from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  return (
    <div className="relative">
      <button aria-label="Notifications" className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer">
        <Bell className="w-4 h-4" />
      </button>
    </div>
  );
};
