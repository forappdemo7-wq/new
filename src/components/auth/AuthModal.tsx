import React, { useState, useRef, useEffect } from 'react';
import { useAuth, PRESET_AVATARS } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  X,
  User,
  Mail,
  Lock,
  Camera,
  Check,
  UserPlus,
  Heart,
  ArrowRight,
  LogOut,
  Upload,
  BookOpen,
  Bookmark,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
  Sparkles
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    checkUsernameAvailability,
    signUpWithEmail,
    signInWithEmail,
    updateUserBioAndAvatar,
    changeUsername,
    logout
  } = useAuth();

  const { bookmarks, favorites, progress, clearReadingProgress } = useLibrary();

  // Profile modal active sub-tab
  const [profileTab, setProfileTab] = useState<'username' | 'avatar' | 'stats'>('username');
  const [isClearingProgress, setIsClearingProgress] = useState(false);

  const handleClearProgress = async () => {
    try {
      setIsClearingProgress(true);
      await clearReadingProgress();
    } finally {
      setIsClearingProgress(false);
    }
  };

  // Form states
  const [name, setName] = useState(userProfile?.displayName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    userProfile?.photoURL || PRESET_AVATARS[0].url
  );
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync profile details whenever userProfile updates or modal opens
  useEffect(() => {
    if (userProfile && authModalMode === 'profile') {
      setName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setSelectedAvatar(userProfile.photoURL || PRESET_AVATARS[0].url);
      setErrorMsg(null);
    }
  }, [userProfile, authModalMode, isAuthModalOpen]);

  // Live username availability check state
  const [nameAvailability, setNameAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    reason?: string;
  }>({ checking: false, available: null });

  // Debounced check for username availability
  useEffect(() => {
    const clean = name.trim();
    if (!clean) {
      setNameAvailability({ checking: false, available: null });
      return;
    }

    // In profile edit mode, if name hasn't changed from current user's name, it's valid
    if (authModalMode === 'profile' && clean.toLowerCase() === userProfile?.displayName?.trim().toLowerCase()) {
      setNameAvailability({ checking: false, available: true, reason: 'This is your current username.' });
      return;
    }

    setNameAvailability({ checking: true, available: null });
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(clean, userProfile?.uid, userProfile?.email || currentUser?.email);
        setNameAvailability({ checking: false, available: res.available, reason: res.reason });
      } catch {
        setNameAvailability({ checking: false, available: null });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [name, authModalMode, userProfile?.displayName, userProfile?.uid, userProfile?.email, currentUser?.email, checkUsernameAvailability]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  if (!isAuthModalOpen) return null;

  // Handle local image file upload & downscale to square data URI
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 160;
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Crop square center
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedAvatar(dataUrl);
          setErrorMsg(null);
        }
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Please enter your reader display name.');
      return;
    }
    if (nameAvailability.available === false) {
      setErrorMsg(nameAvailability.reason || 'This username is already taken. Please choose another name.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Please provide a valid email and password (min 6 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password, name, selectedAvatar);
      closeAuthModal();
    } catch (err: any) {
      const raw = err?.message || '';
      if (raw.includes('operation-not-allowed')) {
        setErrorMsg(null);
      } else {
        setErrorMsg(raw.replace('Firebase: ', '').replace(/auth\//g, '') || 'Failed to create account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err?.message?.replace('Firebase: ', '') || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!name.trim()) {
      setErrorMsg('Username cannot be empty.');
      return;
    }
    if (nameAvailability.available === false) {
      setErrorMsg(nameAvailability.reason || 'This username is already taken. Please choose another name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserBioAndAvatar(name, selectedAvatar, bio);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Please enter a username.');
      return;
    }

    const currentName = userProfile?.displayName?.trim() || '';
    if (cleanName.toLowerCase() === currentName.toLowerCase()) {
      setSuccessMsg(`@${cleanName} is already your current registered username.`);
      setTimeout(() => setSuccessMsg(null), 2500);
      return;
    }

    if (nameAvailability.available === false) {
      setErrorMsg(nameAvailability.reason || 'This username is already taken by another reader. Please choose a unique name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changeUsername(cleanName);
      setSuccessMsg(`Username successfully updated to @${cleanName}! This handle is permanently set to your account.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change username.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    mouseDownTargetRef.current = e.target;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if BOTH mousedown and mouseup (click) occurred directly on the backdrop container,
    // not when dragging/selecting text inside the modal and releasing mouse outside.
    if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
      closeAuthModal();
    }
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 dark:bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-[#0B101D] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col my-auto"
      >
        {/* Header (Solid Opaque to prevent background bleed-through) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-[#0B101D] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                {authModalMode === 'signup' && 'Create Your Reader Account'}
                {authModalMode === 'signin' && 'Welcome Back to wanna read?'}
                {authModalMode === 'profile' && 'Reader Profile & Preferences'}
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                {authModalMode === 'signup' && 'Choose your reader name and customize your avatar.'}
                {authModalMode === 'signin' && 'Sign in to sync your bookmarks across devices.'}
                {authModalMode === 'profile' && 'Manage your account details and chosen avatar.'}
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (flex-1 min-h-0 guarantees clean scrollbar without overflowing viewport) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 flex items-start justify-between gap-3">
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
              {authModalMode === 'signin' && (errorMsg.includes('register') || errorMsg.includes('Create') || errorMsg.includes('No account')) && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthModalMode('signup');
                  }}
                  className="shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/70 text-red-700 dark:text-red-200 transition-colors cursor-pointer"
                >
                  Create Account →
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          {/* ================= MODE: SIGN UP ================= */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Avatar Selector Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-stone-900 dark:text-white block font-sans">
                  Choose Your Reader Avatar / Photo:
                </label>

                {/* Selected Avatar Large Preview */}
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-stone-200 dark:bg-slate-800 border-2 border-amber-500 shrink-0 shadow-sm">
                    <img
                      src={selectedAvatar}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                      {name.trim() || 'Reader Name'}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-slate-400">
                      {selectedAvatar.startsWith('data:') ? 'Custom Photo' : 'Illustrated Preset'}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload custom photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Preset Avatars Grid */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Or select a literary preset:
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.url)}
                        className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-transform cursor-pointer hover:scale-105 ${
                          selectedAvatar === av.url
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-stone-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                        }`}
                        title={av.label}
                      >
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        {selectedAvatar === av.url && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-stone-950 font-bold" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-900 dark:text-white block font-sans">
                    Your Reader Name:
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">Unique username</span>
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Victor Frankenstein, Jane Eyre, Aoi"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 ${
                      nameAvailability.available === false
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : nameAvailability.available === true
                        ? 'border-emerald-500 focus:ring-emerald-500/30'
                        : 'border-stone-300 dark:border-slate-700 focus:ring-amber-500/40 focus:border-amber-500'
                    }`}
                  />
                </div>
                {name.trim() && (
                  <div className="pt-0.5">
                    {nameAvailability.checking ? (
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                        Checking availability…
                      </span>
                    ) : nameAvailability.available === true ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>@{name.trim()} is available</span>
                      </span>
                    ) : nameAvailability.available === false ? (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{nameAvailability.reason || 'This name is already taken by another reader.'}</span>
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-900 dark:text-white block font-sans">
                  Email Address:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-900 dark:text-white block font-sans">
                  Password (min 6 chars):
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-[#FF5733] hover:from-amber-700 hover:to-[#E04826] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Create Reader Account</span>
              </button>

              {/* Switch to Sign In */}
              <div className="text-center text-xs text-stone-500 dark:text-slate-400 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('signin')}
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE: SIGN IN ================= */}
          {authModalMode === 'signin' && (
            <div className="space-y-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-900 dark:text-white block font-sans">
                    Email Address:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="reader@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-900 dark:text-white block font-sans">
                    Password:
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>Sign In</span>
                  </button>
                </form>

                {/* Switch to Sign Up */}
                <div className="text-center text-xs text-stone-500 dark:text-slate-400 pt-1">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('signup')}
                    className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Create one now
                  </button>
                </div>
              </div>
            )}

            {/* ================= MODE: PROFILE & USERNAME MANAGEMENT ================= */}
          {authModalMode === 'profile' && (currentUser || userProfile) && (
            <div className="space-y-4">
              {/* Profile Hero Header Card */}
              <div className="relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-stone-50 to-stone-100/60 dark:from-[#111726] dark:via-[#131b2e] dark:to-[#0d1424] border border-amber-200/60 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-stone-200 dark:bg-slate-800 border-2 border-amber-500 shrink-0 shadow-sm">
                    <img
                      src={selectedAvatar}
                      alt={userProfile?.displayName || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setProfileTab('avatar')}
                      title="Change avatar image"
                      className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-white truncate">
                        @{userProfile?.displayName || 'Reader'}
                      </h3>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <Check className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-0.5">
                      {userProfile?.email || currentUser?.email || 'Reader account'}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-lg bg-white/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300">
                    {userProfile?.role === 'admin' ? 'Administrator' : 'Reader Account'}
                  </span>
                </div>
              </div>

              {/* Segmented Sub-Tab Switcher */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setProfileTab('username')}
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    profileTab === 'username'
                      ? 'bg-white dark:bg-slate-800 text-stone-950 dark:text-white shadow-xs font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="truncate">Username</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab('avatar')}
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    profileTab === 'avatar'
                      ? 'bg-white dark:bg-slate-800 text-stone-950 dark:text-white shadow-xs font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="truncate">Avatar &amp; Bio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab('stats')}
                  className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    profileTab === 'stats'
                      ? 'bg-white dark:bg-slate-800 text-stone-950 dark:text-white shadow-xs font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="truncate">Reading Stats</span>
                </button>
              </div>

              {/* ── TAB 1: USERNAME MANAGEMENT ── */}
              {profileTab === 'username' && (
                <form onSubmit={handleUpdateUsername} className="space-y-4 animate-in fade-in duration-150">
                  {/* Current Assigned Username Card */}
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-slate-400">
                        Assigned Account Username
                      </div>
                      <div className="text-base font-serif font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                        <span className="text-amber-600 dark:text-amber-400">@</span>
                        <span>{userProfile?.displayName || 'Reader'}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-full shrink-0">
                      <Shield className="w-3 h-3" />
                      <span>Locked to Account</span>
                    </span>
                  </div>

                  {/* Change Username Input Section */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 space-y-3 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-900 dark:text-white block font-sans">
                          Change Username
                        </label>
                        <span className="text-[11px] font-mono text-stone-400 dark:text-slate-400">
                          Unique Library Handle
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                        Enter your desired username below. Two readers cannot have the same name. Once claimed, this username will permanently stay with your account.
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 select-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="new_username"
                        className={`w-full pl-8 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-[#090D16] border font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                          nameAvailability.available === false
                            ? 'border-rose-500 focus:ring-rose-500/30'
                            : nameAvailability.available === true
                            ? 'border-emerald-500 focus:ring-emerald-500/30'
                            : 'border-stone-300 dark:border-slate-700 focus:ring-amber-500/40'
                        }`}
                      />
                    </div>

                    {/* Live Uniqueness & Availability Feedback Card */}
                    <div className="min-h-[28px] flex items-center">
                      {name.trim() ? (
                        nameAvailability.checking ? (
                          <div className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800/60 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 font-mono">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                            <span>Checking availability across all readers…</span>
                          </div>
                        ) : name.trim().toLowerCase() === userProfile?.displayName?.trim().toLowerCase() ? (
                          <div className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800/60 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 font-mono">
                            <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>This is your current username (Unchanged).</span>
                          </div>
                        ) : nameAvailability.available === true ? (
                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>✓ @{name.trim()} is available! Click "Save New Username" below to claim it.</span>
                          </div>
                        ) : nameAvailability.available === false ? (
                          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>{nameAvailability.reason || 'This name is already taken. Two accounts cannot share the same username.'}</span>
                          </div>
                        ) : null
                      ) : (
                        <div className="text-xs text-stone-400 font-mono">
                          Please type a username to check availability.
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !name.trim() ||
                          nameAvailability.available === false ||
                          name.trim().toLowerCase() === userProfile?.displayName?.trim().toLowerCase()
                        }
                        className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating Username…</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save New Username</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Username Rules Guarantee */}
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
                    <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Username Policy &amp; Account Protection</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-stone-600 dark:text-stone-400 leading-relaxed">
                      <li>Usernames are permanently locked to your account and persist across all sign-out sessions.</li>
                      <li>Strict uniqueness: Two accounts cannot share the same name under any circumstances.</li>
                      <li>Allowed characters: Letters, numbers, hyphens, and underscores (2–30 characters).</li>
                    </ul>
                  </div>
                </form>
              )}

              {/* ── TAB 2: AVATAR & BIO MANAGEMENT ── */}
              {profileTab === 'avatar' && (
                <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
                  {/* Avatar Picker & Upload */}
                  <div className="space-y-2.5 p-4 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-900 dark:text-white block font-sans">
                        Choose Reader Avatar:
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                      {PRESET_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.url)}
                          className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 transition-transform cursor-pointer hover:scale-105 ${
                            selectedAvatar === av.url
                              ? 'border-amber-500 ring-2 ring-amber-500/40'
                              : 'border-stone-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                          title={av.label}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                          {selectedAvatar === av.url && (
                            <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-stone-950 font-bold" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reader Bio */}
                  <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-900 dark:text-white block font-sans">
                        Reader Bio:
                      </label>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {bio.length}/200
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={200}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your favorite genres, classics, or authors..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#090D16] border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none font-medium"
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Profile…</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Avatar &amp; Bio</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ── TAB 3: READING STATS ── */}
              {profileTab === 'stats' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 text-center flex flex-col justify-between">
                      <div>
                        <BookOpen className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                        <div className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                          {Object.keys(progress).length}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono uppercase">In Progress</div>
                      </div>
                      {Object.keys(progress).length > 0 ? (
                        <button
                          type="button"
                          onClick={handleClearProgress}
                          disabled={isClearingProgress}
                          className="text-[10px] font-mono text-rose-600 dark:text-rose-400 hover:underline mt-2 cursor-pointer font-medium"
                        >
                          {isClearingProgress ? 'Resetting…' : 'Reset to 0'}
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                          Clean slate
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 text-center">
                      <Bookmark className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                      <div className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                        {bookmarks.length}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono uppercase">Bookmarks</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 text-center">
                      <Heart className="w-5 h-5 mx-auto text-rose-500 mb-1" />
                      <div className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                        {favorites.length}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono uppercase">Favorites</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#0E1526] border border-stone-200 dark:border-slate-800 text-xs text-stone-600 dark:text-stone-300 space-y-1">
                    <div className="font-semibold text-stone-900 dark:text-white">Account Details</div>
                    <div className="flex justify-between py-1 border-b border-stone-200/60 dark:border-slate-800">
                      <span className="text-stone-500">Member Since:</span>
                      <span className="font-mono">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Active Member'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Registered Email:</span>
                      <span className="font-mono">{userProfile?.email || currentUser?.email || 'reader'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned Sticky Footer with Safe Sign Out */}
        {authModalMode === 'profile' && (currentUser || userProfile) && (
          <div className="shrink-0 p-3.5 sm:p-4 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-[#0B101D] flex items-center justify-between gap-3">
            <div className="text-xs text-stone-500 dark:text-slate-400 truncate">
              Signed in as <strong className="text-stone-900 dark:text-white">@{userProfile?.displayName}</strong>
            </div>

            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 bg-stone-200/90 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-stone-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
