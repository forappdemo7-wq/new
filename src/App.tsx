import React from 'react';
import { RouterProvider, useRouter, matchRoute } from './context/RouterContext';
import { LibraryProvider } from './context/LibraryContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { WorkDetailPage } from './pages/WorkDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { AuthorPage } from './pages/AuthorPage';
import { GenrePage } from './pages/GenrePage';
import { DemographicPage } from './pages/DemographicPage';
import { LicensePage } from './pages/LicensePage';
import { SourcesPage } from './pages/SourcesPage';
import { OpdsFeedPage } from './pages/OpdsFeedPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { StaticPages } from './pages/StaticPages';
import { AdminPage } from './pages/AdminPage';
import { UserUploadsPage } from './pages/UserUploadsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ReadingListPage } from './pages/ReadingListPage';
import { HistoryPage } from './pages/HistoryPage';
import { DownloadsPage } from './pages/DownloadsPage';

const AppRoutes: React.FC = () => {
  const { path } = useRouter();

  // Unified Reader Route: /read/:workId/:chapterId or /read/:workId
  const readParamsWithChap = matchRoute('/read/:workId/:chapterId', path);
  const readParamsDirect = matchRoute('/read/:workId', path);
  const readParams = readParamsWithChap || (readParamsDirect ? { workId: readParamsDirect.workId, chapterId: '1' } : null);
  if (readParams) {
    return <ReaderPage workId={readParams.workId} chapterId={readParams.chapterId || '1'} />;
  }

  // Helper to determine current page content
  const renderContent = () => {
    // Work Detail Routes: /work/:slug, /book/:slug, /comic/:slug, /manga/:slug
    const workParams = matchRoute('/work/:slug', path);
    const bookParams = matchRoute('/book/:slug', path);
    const comicParams = matchRoute('/comic/:slug', path);
    const mangaParams = matchRoute('/manga/:slug', path);
    const matchedSlug =
      workParams?.slug || bookParams?.slug || comicParams?.slug || mangaParams?.slug;
    if (matchedSlug) {
      return <WorkDetailPage slug={matchedSlug} />;
    }

    // Demographic Route: /demographic/:slug
    const demoParams = matchRoute('/demographic/:slug', path);
    if (demoParams) {
      return <DemographicPage slug={demoParams.slug} />;
    }

    // Author Route: /author/:slug
    const authorParams = matchRoute('/author/:slug', path);
    if (authorParams) {
      return <AuthorPage slug={authorParams.slug} />;
    }

    // Genre / Theme Route: /genre/:slug or /theme/:slug
    const genreParams = matchRoute('/genre/:slug', path);
    const themeParams = matchRoute('/theme/:slug', path);
    const matchedGenreSlug = genreParams?.slug || themeParams?.slug;
    if (matchedGenreSlug) {
      return <GenrePage slug={matchedGenreSlug} />;
    }

    // License Route: /license/:code or /licensing
    const licenseParams = matchRoute('/license/:code', path);
    if (licenseParams || path === '/licensing') {
      return <LicensePage code={licenseParams ? licenseParams.code : 'overview'} />;
    }

    // Sources & Blocklist Directory: /sources
    if (path === '/sources') {
      return <SourcesPage />;
    }

    // OPDS 1.2 Feed Endpoint: /opds
    if (path === '/opds') {
      return <OpdsFeedPage />;
    }

    // Collections Route
    if (path === '/collections') {
      return <CollectionsPage />;
    }

    // Static Policy Pages
    if (path === '/about') {
      return <StaticPages page="about" />;
    }
    if (path === '/privacy') {
      return <StaticPages page="privacy" />;
    }
    if (path === '/terms') {
      return <StaticPages page="terms" />;
    }
    if (path === '/dmca' || path === '/takedown') {
      return <StaticPages page="dmca" />;
    }
    if (path === '/contribute') {
      return <StaticPages page="contribute" />;
    }

    // User Uploads Dedicated Route
    if (path === '/user-uploads') {
      return <UserUploadsPage />;
    }

    // Public User Profile Route: /user/:userId or /profile/:userId
    const userParams = matchRoute('/user/:userId', path);
    const profileParams = matchRoute('/profile/:userId', path);
    const matchedUserId = userParams?.userId || profileParams?.userId;
    if (matchedUserId) {
      return <UserProfilePage userId={matchedUserId} />;
    }

    // Reading List, History, Downloads Routes
    if (path === '/reading-list') {
      return <ReadingListPage />;
    }
    if (path === '/history') {
      return <HistoryPage />;
    }
    if (path === '/downloads') {
      return <DownloadsPage />;
    }

    // Admin Route
    if (path === '/admin') {
      return <AdminPage />;
    }

    // Library / Catalog Route
    if (path === '/library') {
      return <LibraryPage />;
    }

    // Default: Home Page
    return <HomePage />;
  };

  return <Layout>{renderContent()}</Layout>;
};

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <LibraryProvider>
          <div className="app-root min-h-screen w-full antialiased">
            <AppRoutes />
            <AuthModal />
          </div>
        </LibraryProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
