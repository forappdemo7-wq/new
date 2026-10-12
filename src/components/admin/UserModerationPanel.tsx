import React, { useState, useMemo, useEffect } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth, getAllStoredAccounts, SavedUserAccount } from '../../context/AuthContext';
import { Work, BannedUser } from '../../types';
import {
  UserX,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Shield,
  Ban,
  UserCheck,
  BookOpen,
  Calendar,
  Layers,
  Filter,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  Copy,
  Sparkles,
  Users,
  ShieldCheck,
  Check
} from 'lucide-react';

export interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'admin' | 'reader';
  works: Work[];
  isBanned: boolean;
  bannedRecord?: BannedUser;
  createdAt?: string;
}

export const UserModerationPanel: React.FC = () => {
  const { works, bannedUsers, banUser, unbanUser, removeWork } = useLibrary();
  const { navigate } = useRouter();
  const { adminChangeUserPassword, getAllUsers } = useAuth();

  const [registeredAccounts, setRegisteredAccounts] = useState<SavedUserAccount[]>(() => getAllStoredAccounts());
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'banned' | 'readers' | 'admins'>('all');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Password Change Modal state
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<AdminUserItem | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);

  // Ban Modal state
  const [selectedUserForBan, setSelectedUserForBan] = useState<AdminUserItem | null>(null);
  const [banReason, setBanReason] = useState('Posting inappropriate / adult / NSFW material');
  const [customReason, setCustomReason] = useState('');
  const [purgeWorksOnBan, setPurgeWorksOnBan] = useState(true);

  // Manual Ban state
  const [showManualBanModal, setShowManualBanModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualUid, setManualUid] = useState('');
  const [manualReason, setManualReason] = useState('Inappropriate content violation');

  // Copy email feedback
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 4500);
  };

  const refreshAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const list = await getAllUsers();
      if (list && list.length > 0) {
        setRegisteredAccounts(list);
      }
    } catch (err) {
      console.warn('Failed to refresh accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    refreshAccounts();
  }, []);

  // Consolidate all users: Registered accounts + Uploaders + Banned users
  const allUsers = useMemo(() => {
    const map = new Map<string, AdminUserItem>();

    // 1. Add all registered accounts from local storage + Firestore
    registeredAccounts.forEach((acc) => {
      const email = (acc.email || '').trim().toLowerCase();
      const uid = acc.profile?.uid || `user-${email.replace(/[^a-z0-9]/g, '-')}`;
      const name = acc.profile?.displayName || (email === 'first@user.com' ? 'first_user' : email.split('@')[0]) || 'Reader';
      const role = (email === 'admin@getnow.org' || email.startsWith('admin@')) ? 'admin' : (acc.profile?.role === 'admin' ? 'admin' : 'reader');
      const photoURL = acc.profile?.photoURL;
      const createdAt = acc.profile?.createdAt;

      const bannedRecord = bannedUsers.find(
        (b) => (b.id && b.id === uid) || (email && b.email.toLowerCase() === email)
      );

      const key = email || uid;
      map.set(key, {
        id: uid,
        email,
        name,
        photoURL,
        role,
        works: [],
        isBanned: Boolean(bannedRecord),
        bannedRecord,
        createdAt
      });
    });

    // 2. Add / associate catalog works
    works.forEach((w) => {
      const pubId = w.publisherId || `author-${(w.authors[0]?.slug || 'anonymous')}`;
      const pubEmail = (w.publisherEmail || '').trim().toLowerCase();
      const pubName = w.publisherName || w.authors[0]?.name || 'Anonymous Creator';
      const key = pubEmail || pubId;

      const bannedRecord = bannedUsers.find(
        (b) => (b.id && b.id === pubId) || (pubEmail && b.email.toLowerCase() === pubEmail)
      );

      if (!map.has(key)) {
        map.set(key, {
          id: pubId,
          email: pubEmail,
          name: pubName,
          role: 'reader',
          works: [w],
          isBanned: Boolean(bannedRecord),
          bannedRecord
        });
      } else {
        const user = map.get(key)!;
        if (!user.works.some((existing) => existing.id === w.id)) {
          user.works.push(w);
        }
        if (bannedRecord && !user.isBanned) {
          user.isBanned = true;
          user.bannedRecord = bannedRecord;
        }
      }
    });

    // 3. Add banned users who haven't uploaded or weren't registered yet
    bannedUsers.forEach((banned) => {
      const email = (banned.email || '').trim().toLowerCase();
      const key = email || banned.id;
      if (!map.has(key)) {
        map.set(key, {
          id: banned.id,
          email,
          name: banned.displayName || email.split('@')[0] || 'Banned User',
          role: 'reader',
          works: [],
          isBanned: true,
          bannedRecord: banned
        });
      }
    });

    return Array.from(map.values());
  }, [registeredAccounts, works, bannedUsers]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q) ||
        user.works.some((w) => w.title.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterMode === 'active') return !user.isBanned;
      if (filterMode === 'banned') return user.isBanned;
      if (filterMode === 'readers') return user.role === 'reader';
      if (filterMode === 'admins') return user.role === 'admin';
      return true;
    });
  }, [allUsers, searchQuery, filterMode]);

  const activeCount = allUsers.filter((u) => !u.isBanned).length;
  const readersCount = allUsers.filter((u) => u.role === 'reader').length;
  const adminsCount = allUsers.filter((u) => u.role === 'admin').length;
  const totalPurgedCount = bannedUsers.reduce((sum, u) => sum + (u.purgedWorksCount || 0), 0);

  // Password Override Handler
  const handleOpenPasswordModal = (user: AdminUserItem) => {
    setSelectedUserForPassword(user);
    setNewPasswordInput('');
    setPasswordModalError(null);
    setShowNewPassword(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(pass);
    setPasswordModalError(null);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    const cleanPass = newPasswordInput.trim();
    if (!cleanPass || cleanPass.length < 6) {
      setPasswordModalError('Password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordModalError(null);

    try {
      await adminChangeUserPassword(selectedUserForPassword.email, cleanPass);
      showNotification(`Password for ${selectedUserForPassword.email || selectedUserForPassword.name} successfully updated to "${cleanPass}".`);
      setSelectedUserForPassword(null);
      setNewPasswordInput('');
      await refreshAccounts();
    } catch (err: any) {
      setPasswordModalError(err?.message || 'Failed to update user password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleConfirmBan = () => {
    if (!selectedUserForBan) return;
    const finalReason = customReason.trim() || banReason;

    banUser(
      selectedUserForBan.id,
      selectedUserForBan.email,
      finalReason,
      purgeWorksOnBan
    );

    showNotification(
      `User ${selectedUserForBan.name} has been banned.${
        purgeWorksOnBan ? ` All ${selectedUserForBan.works.length} uploaded works were purged.` : ''
      }`
    );

    setSelectedUserForBan(null);
    setCustomReason('');
  };

  const handleManualBanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail && !manualUid) {
      alert('Please provide an email or User ID to ban.');
      return;
    }

    banUser(manualUid || `banned-${Date.now()}`, manualEmail, manualReason, true);
    showNotification(`User ${manualEmail || manualUid} has been banned.`);
    setShowManualBanModal(false);
    setManualEmail('');
    setManualUid('');
  };

  const handleUnban = (user: AdminUserItem) => {
    if (confirm(`Unban user ${user.name} (${user.email || user.id})?`)) {
      unbanUser(user.id);
      showNotification(`User ${user.name} has been unbanned and restored to good standing.`);
    }
  };

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="space-y-8 text-stone-900 dark:text-stone-100">
      
      {/* Status Notification */}
      {statusNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-200 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Moderation Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-200 font-bold">
            <span>Total Registered Users</span>
            <Users className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">{allUsers.length}</div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Readers, creators &amp; admins</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#151820] border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
            <span>Active Users</span>
            <UserCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-serif text-emerald-800 dark:text-emerald-400">
            {activeCount}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">In good standing</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#151820] border border-rose-200/70 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-rose-700 dark:text-rose-400 font-bold">
            <span>Banned Users</span>
            <UserX className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-3xl font-bold font-serif text-rose-700 dark:text-rose-400">
            {bannedUsers.length}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Restricted from platform</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#151820] border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold">
            <span>Purged Works</span>
            <Trash2 className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-serif text-amber-800 dark:text-amber-400">
            {totalPurgedCount}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Violations removed</p>
        </div>
      </div>

      {/* Control Bar: Search + Filter + Manual Ban + Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email, user ID, or book title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#12141A] border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-[#C25E3A] text-stone-900 dark:text-stone-100"
          />
        </div>

        {/* Filter Mode */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#12141A] p-1 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0 overflow-x-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            All ({allUsers.length})
          </button>
          <button
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'active'
                ? 'bg-emerald-700 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterMode('banned')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'banned'
                ? 'bg-rose-700 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Banned ({bannedUsers.length})
          </button>
          <button
            onClick={() => setFilterMode('readers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'readers'
                ? 'bg-blue-700 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Readers ({readersCount})
          </button>
          <button
            onClick={() => setFilterMode('admins')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'admins'
                ? 'bg-purple-700 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Admins ({adminsCount})
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refreshAccounts}
            disabled={isLoadingAccounts}
            title="Reload users from database"
            className="p-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowManualBanModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-700 hover:bg-rose-800 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Ban by Email / ID</span>
          </button>
        </div>
      </div>

      {/* Users & Moderation Directory */}
      <div className="rounded-2xl bg-white dark:bg-[#151820] border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>User Directory &amp; Access Controls</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Inspect user accounts, override passwords, enforce community bans, and manage uploaded content
            </p>
          </div>
          <span className="text-xs font-mono text-stone-400">
            Showing {filteredUsers.length} of {allUsers.length} users
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-500 dark:text-stone-400 space-y-2">
            <Shield className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
            <p>No users match the current filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200/70 dark:divide-stone-800/70">
            {filteredUsers.map((user) => (
              <div
                key={user.id || user.email}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
              >
                {/* User Identity */}
                <div className="space-y-1.5 min-w-[280px]">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 flex items-center justify-center font-bold text-xs uppercase text-stone-700 dark:text-stone-300 shrink-0">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.name.slice(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 flex-wrap">
                        <span>{user.name}</span>

                        {/* Role Badge */}
                        {user.role === 'admin' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            READER
                          </span>
                        )}

                        {/* Status Badge */}
                        {user.isBanned ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            BANNED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {user.email ? (
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-stone-700 dark:text-stone-300">{user.email}</span>
                            <button
                              onClick={() => handleCopyEmail(user.email)}
                              title="Copy email"
                              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                            >
                              {copiedEmail === user.email ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                        ) : (
                          <span>UID: {user.id.slice(0, 18)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.bannedRecord && (
                    <div className="text-[11px] p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 mt-2">
                      <span className="font-bold">Ban Reason:</span> {user.bannedRecord.reason} ·{' '}
                      <span className="text-stone-500 dark:text-stone-400">
                        {new Date(user.bannedRecord.bannedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Published Works Shelf */}
                <div className="flex-1 space-y-1.5">
                  <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span>Uploaded Works ({user.works.length})</span>
                  </div>

                  {user.works.length === 0 ? (
                    <span className="text-[11px] text-stone-400 italic">
                      No works uploaded (Reader account)
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {user.works.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                        >
                          <div className="w-6 h-8 rounded overflow-hidden bg-stone-200 dark:bg-stone-900 shrink-0">
                            <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="max-w-[160px] truncate">
                            <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                              {w.title}
                            </div>
                            <div className="text-[10px] uppercase font-mono text-stone-400">
                              {w.type} · {w.licenseCode}
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/work/${w.slug}`)}
                            title="View Book / Manga Page"
                            className="p-1 text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete work "${w.title}"?`)) {
                                removeWork(w.id);
                                showNotification(`Work "${w.title}" deleted.`);
                              }
                            }}
                            title="Delete this work"
                            className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moderation Actions (Change Password + Ban/Unban) */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 flex-wrap">
                  {/* Change Password Button */}
                  <button
                    onClick={() => handleOpenPasswordModal(user)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Change or reset this user's password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Password</span>
                  </button>

                  {/* Ban / Unban Button */}
                  {user.isBanned ? (
                    <button
                      onClick={() => handleUnban(user)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Unban User</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedUserForBan(user)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Ban User</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= ADMIN CHANGE PASSWORD MODAL ================= */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-150">
          <form
            onSubmit={handleSavePassword}
            className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-stone-900 dark:text-stone-100"
          >
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  Change User Password
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Administrator password override for reader account
                </p>
              </div>
            </div>

            {/* Target User Summary */}
            <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                <span>{selectedUserForPassword.name}</span>
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                  {selectedUserForPassword.role}
                </span>
              </div>
              <div className="text-[11px] font-mono text-stone-600 dark:text-stone-300">
                Email: <span className="font-bold">{selectedUserForPassword.email || 'N/A'}</span>
              </div>
              <div className="text-[10px] font-mono text-stone-400 truncate">
                UID: {selectedUserForPassword.id}
              </div>
            </div>

            {passwordModalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                {passwordModalError}
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  New Password (min 6 characters) *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate strong password</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPasswordInput}
                  onChange={(e) => {
                    setNewPasswordInput(e.target.value);
                    setPasswordModalError(null);
                  }}
                  placeholder="Enter new password for this user..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-amber-600 text-stone-900 dark:text-stone-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                The new password is saved immediately. The user can log in with this password right away.
              </p>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedUserForPassword(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isUpdatingPassword ? 'Updating...' : 'Save New Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= BAN CONFIRMATION MODAL ================= */}
      {selectedUserForBan && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-stone-900 dark:text-stone-100">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  Ban User Account
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Suspend user from publishing content and reading privileges
                </p>
              </div>
            </div>

            {/* User Summary Box */}
            <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                {selectedUserForBan.name}
              </div>
              <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                {selectedUserForBan.email || `UID: ${selectedUserForBan.id}`}
              </div>
              <div className="text-stone-600 dark:text-stone-300 pt-1">
                Currently has <span className="font-bold">{selectedUserForBan.works.length}</span> published works.
              </div>
            </div>

            {/* Ban Reason Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Violation Reason *
              </label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-rose-600 text-stone-900 dark:text-stone-100"
              >
                <option value="Posting inappropriate / adult / NSFW material">Posting inappropriate / adult / NSFW material</option>
                <option value="Copyright infringement / Pirated scanned work">Copyright infringement / Pirated scanned work</option>
                <option value="Spam / Automated bot uploads">Spam / Automated bot uploads</option>
                <option value="Harassment or abusive content">Harassment or abusive content</option>
                <option value="Corrupted / Defaced pages">Corrupted / Defaced pages</option>
                <option value="Other">Other reason (specify below)</option>
              </select>

              {banReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify custom violation details..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-rose-600 text-stone-900 dark:text-stone-100 mt-2"
                />
              )}
            </div>

            {/* Content Purge Option */}
            <label className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={purgeWorksOnBan}
                onChange={(e) => setPurgeWorksOnBan(e.target.checked)}
                className="mt-0.5 accent-rose-600"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-rose-900 dark:text-rose-300">
                  Purge &amp; Delete All Uploaded Works ({selectedUserForBan.works.length})
                </span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  Automatically removes all books, comics, and manga uploaded by this user from the catalog and Firestore database immediately.
                </p>
              </div>
            </label>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedUserForBan(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className="px-5 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Ban &amp; Execute</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANUAL BAN BY EMAIL/UID MODAL ================= */}
      {showManualBanModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-150">
          <form
            onSubmit={handleManualBanSubmit}
            className="bg-white dark:bg-[#151820] border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-stone-900 dark:text-stone-100"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <Ban className="w-6 h-6" />
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Preemptive / Manual User Ban
                </h3>
                <p className="text-xs text-stone-500">
                  Block a specific email or UID from platform access
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                User Email
              </label>
              <input
                type="email"
                placeholder="violator@example.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-rose-600 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                User UID (Optional)
              </label>
              <input
                type="text"
                placeholder="Firebase Auth User UID..."
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-rose-600 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Ban Reason
              </label>
              <input
                type="text"
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-rose-600 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowManualBanModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow-xs"
              >
                Apply Ban
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
