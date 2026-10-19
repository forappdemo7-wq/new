import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DuneHeroCarousel } from './components/home/DuneHeroCarousel';
import { CategoryBanners } from './components/home/CategoryBanners';
import { LibraryFilterBar } from './components/catalog/LibraryFilterBar';
import { MediaCard } from './components/catalog/MediaCard';
import { WorkDetailPage } from './pages/WorkDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { UserUploadsPage } from './pages/UserUploadsPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { AdminPage } from './pages/AdminPage';
import { AuthorPage } from './pages/AuthorPage';
import { LicensePage } from './pages/LicensePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SourcesPage } from './pages/SourcesPage';
import { OpdsFeedPage } from './pages/OpdsFeedPage';
import { useLibrary } from './context/LibraryContext';

const MainLayout: React.FC = () => {
  const { path } = useRouter();
  const { works } = useLibrary();

  // Route matching
  if (path.startsWith('/work/')) {
    const slug = path.replace('/work/', '');
    return <WorkDetailPage slug={slug} />;
  }

  if (path.startsWith('/read/')) {
    const parts = path.replace('/read/', '').split('/');
    return <ReaderPage workId={parts[0]} chapterId={parts[1] || '1'} />;
  }

  if (path === '/uploads') {
    return <UserUploadsPage />;
  }

  if (path === '/downloads') {
    return <DownloadsPage />;
  }

  if (path === '/admin') {
    return <AdminPage />;
  }

  if (path.startsWith('/author/')) {
    const slug = path.replace('/author/', '');
    return <AuthorPage slug={slug} />;
  }

  if (path.startsWith('/license/')) {
    const code = path.replace('/license/', '');
    return <LicensePage code={code} />;
  }

  if (path.startsWith('/profile/')) {
    const userId = path.replace('/profile/', '');
    return <UserProfilePage userId={userId} />;
  }

  if (path === '/sources') {
    return <SourcesPage />;
  }

  if (path === '/opds') {
    return <OpdsFeedPage />;
  }

  // Home / Catalog View
  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#0B0D13] text-stone-900 dark:text-stone-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10 w-full">
        <DuneHeroCarousel />
        <CategoryBanners />
        <div id="catalog-section" className="space-y-6">
          <LibraryFilterBar />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {works.map((work) => (
              <MediaCard key={work.id} work={work} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LibraryProvider>
        <RouterProvider>
          <MainLayout />
        </RouterProvider>
      </LibraryProvider>
    </AuthProvider>
  );
};

export default App;
