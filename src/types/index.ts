export type WorkType = 'book' | 'comic' | 'manga';

export type FileFormat = 'html' | 'epub' | 'pdf' | 'cbz' | 'images' | 'link_only';

export type WorkStatus = 'completed' | 'ongoing';

export type ReadingDirection = 'rtl' | 'ltr' | 'vertical';

export type Demographic = 'shonen' | 'shojo' | 'seinen' | 'josei' | 'kodomomuke' | 'general';

export type JurisdictionStatus =
  | 'WORLDWIDE_PD'
  | 'PD_US_ONLY'
  | 'PD_JAPAN_ONLY'
  | 'PD_EU_ONLY'
  | 'CC'
  | 'AUTHOR_PERMITTED'
  | 'COMMUNITY_OPEN'
  | 'LINK_OUT_ONLY';

export interface Author {
  id: string;
  name: string;
  slug: string;
  nativeName?: string;
  role: 'Author' | 'Artist' | 'Translator' | 'Writer & Illustrator' | 'Editor' | 'Mangaka';
  bio: string;
  birthDeath?: string;
  website?: string;
  verifiedOpenLicense: boolean;
}

export interface ComicPage {
  id: string;
  pageNumber: number;
  imageUrl?: string;
  svgArt?: string;
  caption?: string;
  altText: string;
  width?: number;
  height?: number;
}

export interface Chapter {
  id: string;
  workId: string;
  volumeNumber?: number;
  chapterNumber: number;
  number: number;
  title: string;
  slug: string;
  wordCount?: number;
  pagesCount?: number;
  content?: string; // Rich text / paragraphs for books
  pages?: ComicPage[]; // Panels / pages for comics & manga
  releaseDate?: string;
  language?: string;
}

export interface LicenseInfo {
  code: string;
  name: string;
  category: 'public_domain' | 'creative_commons' | 'free_art' | 'author_permitted' | 'link_out';
  shortDesc: string;
  fullDesc: string;
  permissions: string[];
  requirements: string[];
  prohibitions: string[];
  officialUrl: string;
  badgeText: string;
  allowsHosting: boolean;
  requiresAttribution: boolean;
  allowsCommercial: boolean;
  allowsModification: boolean;
}

export interface LicenseAudit {
  id: string;
  workId: string;
  workTitle: string;
  verifiedBy: string;
  verifiedAt: string;
  evidenceUrl: string;
  jurisdictionNotes: string;
  status: 'verified' | 'needs_review' | 'rejected';
}

export interface PermissionProof {
  id: string;
  workId: string;
  granterName: string;
  granterContact?: string;
  dateGranted: string;
  documentUrl?: string;
  scope: string;
}

export type CoverSource =
  | 'Open Library'
  | 'Digital Comic Museum'
  | 'Comic Book Plus'
  | 'Wikimedia Commons'
  | 'Rawpixel'
  | 'Manual Upload'
  | 'Typographic Ghost Cover'
  | 'Other';

export type CoverLicense =
  | 'Public Domain'
  | 'CC0'
  | 'CC BY'
  | 'Fair Use'
  | 'Unknown';

export type CoverStatus = 'published' | 'pending_review' | 'flagged' | 'rejected';

export interface CoverPalette {
  bg: string;
  text: string;
  accent: string;
  border?: string;
  name: string;
}

export interface CoverReportItem {
  id: string;
  workId: string;
  workTitle: string;
  reason: 'copyright' | 'cover_infringement' | 'cover_mismatch' | 'cover_broken' | 'other';
  details: string;
  suggestedSource?: string;
  reporterContact?: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface Work {
  id: string;
  title: string;
  nativeTitle?: string;
  romajiTitle?: string;
  slug: string;
  type: WorkType;
  description: string;
  synopsis: string;
  coverImage: string;
  coverImageUrl?: string;
  coverSource?: CoverSource | string;
  coverSourceUrl?: string;
  coverLicense?: CoverLicense;
  coverAttribution?: string;
  coverStatus?: CoverStatus;
  coverLqip?: string;
  coverPalette?: CoverPalette;
  isbn?: string;
  olid?: string;
  oclc?: string;
  language: string;
  licenseCode: string;
  licenseUrl: string;
  sourceUrl: string;
  sourceName: string;
  attribution: string;
  publisher?: string;
  originalPublicationYear: number;
  jurisdictionStatus: JurisdictionStatus;
  jurisdictionNotes: string;
  isHosted: boolean;
  externalReadUrl?: string;
  readingDirection?: ReadingDirection;
  demographic?: Demographic;
  themes?: string[];
  authors: Author[];
  genres: string[];
  tags: string[];
  chapters: Chapter[];
  fileFormat: FileFormat;
  status: WorkStatus;
  wordCount?: number;
  pageCount?: number;
  readingTimeMinutes?: number;
  featured?: boolean;
  recentlyAdded?: boolean;
  popularityScore: number;
  verificationStatus: 'verified' | 'needs_review';
  verifiedAt?: string;
  verifiedBy?: string;
  evidenceUrl?: string;
  permissionProofId?: string;
  publisherId?: string;
  publisherEmail?: string;
  publisherName?: string;
  uploaderId?: string;
  isCommunity?: boolean;
  likesCount?: number;
  commentsCount?: number;
  isBannedPublisher?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  workId: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  workTitle: string;
  workType: WorkType;
  coverImage: string;
  percent: number;
  currentPage?: number;
  totalPages?: number;
  scrollPosition?: number;
  readingDirection?: ReadingDirection;
  lastReadAt: string;
  completed?: boolean;
}

export interface Bookmark {
  id: string;
  workId: string;
  chapterId: string;
  workTitle: string;
  chapterTitle: string;
  pageNumber?: number;
  note?: string;
  excerpt?: string;
  createdAt: string;
}

export interface UserFavorite {
  workId: string;
  addedAt: string;
}

export interface ReportItem {
  id: string;
  workId: string;
  workTitle: string;
  reason: 'copyright' | 'license_mismatch' | 'broken_content' | 'misattribution' | 'jurisdiction_issue' | 'other';
  details: string;
  reporterContact?: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface FormatAsset {
  id: string;
  format: FileFormat;
  label: string;
  fileUrl?: string;
  fileSize?: string;
  downloadCount?: number;
  mimeType: string;
}

export interface WorkEdition {
  id: string;
  workId: string;
  editionTitle: string;
  publicationYear: number;
  publisher?: string;
  translator?: string;
  editor?: string;
  isbn?: string;
  language: string;
  coverImage?: string;
  notes?: string;
  assets: FormatAsset[];
}

export type ShelfType = 'currently_reading' | 'want_to_read' | 'finished' | 'custom';

export interface UserShelf {
  id: string;
  name: string;
  shelfType: ShelfType;
  workIds: string[];
  createdAt: string;
}

export interface ReadingSession {
  id: string;
  workId: string;
  chapterId: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  pagesRead?: number;
}

export interface ReaderSettings {
  // Books
  fontSize: number;
  lineHeight: number;
  fontFamily: 'serif' | 'sans' | 'mono' | 'dyslexic';
  theme: 'light' | 'sepia' | 'dark' | 'oled';
  mode: 'scroll' | 'paginated';
  maxWidth: 'narrow' | 'normal' | 'wide' | 'full';
  paragraphSpacing?: number;
  focusMode?: boolean;
  wakeLock?: boolean;
  // Comics & Manga
  comicMode: 'single' | 'double' | 'vertical';
  fitMode: 'width' | 'height' | 'contain' | 'original';
  readingDirection: ReadingDirection;
  zoom: number;
  lowBandwidth: boolean;
  incognito: boolean;
  simplifyInterface?: boolean;
}

export interface TextHighlight {
  id: string;
  workId: string;
  chapterId: string;
  chapterTitle?: string;
  text: string;
  color: 'ochre' | 'sage' | 'rose' | 'cobalt';
  note?: string;
  paragraphIndex?: number;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  displayNameLower?: string;
  email?: string;
  photoURL?: string;
  avatarType?: 'preset' | 'custom' | 'generated';
  bio?: string;
  role?: 'admin' | 'reader';
  favoriteGenres?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BannedUser {
  id: string; // User UID or unique identifier
  email: string;
  displayName?: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
  purgedWorksCount: number;
  notes?: string;
}

export interface WorkLike {
  id: string;
  workId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  likedAt: string;
}

export interface WorkComment {
  id: string;
  workId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  // Reply & Mention fields
  parentCommentId?: string;
  replyToUserId?: string;
  replyToUserName?: string;
  replyToCommentSnippet?: string;
  mentions?: string[];
}

export interface LibraryNotification {
  id: string;
  recipientUserId?: string;
  senderUserId?: string;
  senderName?: string;
  senderAvatar?: string;
  type: 'like' | 'comment' | 'reply' | 'mention' | 'update' | 'curatorial' | 'system' | 'recommendation' | 'follow';
  title: string;
  message: string;
  time?: string;
  unread: boolean;
  link?: string;
  workId?: string;
  workSlug?: string;
  workTitle?: string;
  commentId?: string;
  replyToCommentId?: string;
  createdAt: string;
}


