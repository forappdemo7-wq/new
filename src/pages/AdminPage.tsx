import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowLeft } from 'lucide-react';
import { CoverManager } from '../components/admin/CoverManager';

export const AdminPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#0B0D13] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500" />
        <h2 className="font-serif text-2xl font-bold">Restricted Access</h2>
        <p className="text-xs text-stone-500">You must be logged in as an administrator to access this portal.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#0B0D13] text-stone-900 dark:text-stone-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Curatorial Administrator Portal</h1>
          <p className="text-xs text-stone-500">Manage catalog covers, user accounts, and library moderation.</p>
        </div>

        <CoverManager />
      </div>
    </div>
  );
};
