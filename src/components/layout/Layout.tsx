import React from 'react';
import { Navbar } from './Navbar';
import { LeftNavSidebar } from './LeftNavSidebar';
import { Footer } from './Footer';
import { useRouter } from '../../context/RouterContext';
import { FollowNotificationToast } from '../social/FollowNotificationToast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { path } = useRouter();

  // Hide left sidebar on full-screen reader view
  const isReaderView = path.startsWith('/read/');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 dark:bg-[#12141A] dark:text-[#F8FAFC] transition-colors duration-200">
      <Navbar />
      <div className="flex-1 max-w-[1360px] w-full mx-auto flex">
        {!isReaderView && <LeftNavSidebar />}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <Footer />
      <FollowNotificationToast />
    </div>
  );
};

export default Layout;
