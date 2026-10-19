import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
  searchParams: new URLSearchParams(),
});

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(window.location.hash.replace('#', '') || '/');
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      const cleanPath = hash.split('?')[0];
      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      setPath(cleanPath);
      setSearchParams(new URLSearchParams(queryStr));
    };

    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = '#' + to;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RouterContext.Provider value={{ path, navigate, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);
