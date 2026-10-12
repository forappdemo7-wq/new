import React, { createContext, useContext, useEffect, useState } from 'react';

interface RouterContextType {
  path: string;
  searchParams: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  setSearchParam: (key: string, value: string | null) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => (window.location.pathname || '/').split('#')[0]);
  const [searchParams, setSearchParamsState] = useState<URLSearchParams>(
    () => new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath((window.location.pathname || '/').split('#')[0]);
      setSearchParamsState(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string, options?: { replace?: boolean }) => {
    // Separate hash and search from path cleanly
    let fullUrl = to;
    let hash = '';
    const hashIndex = fullUrl.indexOf('#');
    if (hashIndex !== -1) {
      hash = fullUrl.slice(hashIndex);
      fullUrl = fullUrl.slice(0, hashIndex);
    }

    const [pathname, search] = fullUrl.split('?');
    const newPath = pathname || '/';
    const newSearch = search ? `?${search}` : '';

    if (options?.replace) {
      window.history.replaceState({}, '', `${newPath}${newSearch}${hash}`);
    } else {
      window.history.pushState({}, '', `${newPath}${newSearch}${hash}`);
    }

    setCurrentPath(newPath);
    setSearchParamsState(new URLSearchParams(newSearch));
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const setSearchParam = (key: string, value: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    const searchString = nextParams.toString();
    const newUrl = `${currentPath}${searchString ? '?' + searchString : ''}`;
    window.history.replaceState({}, '', newUrl);
    setSearchParamsState(nextParams);
  };

  return (
    <RouterContext.Provider
      value={{
        path: currentPath,
        searchParams,
        navigate,
        setSearchParam,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

/**
 * Route matching helper for path patterns like:
 * - /work/:slug
 * - /read/:workId/:chapterId
 * - /author/:slug
 * - /genre/:slug
 * - /license/:code
 */
export function matchRoute(pattern: string, pathname: string): Record<string, string> | null {
  const cleanPathname = (pathname || '').split('#')[0].split('?')[0];
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = cleanPathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pPart = patternParts[i];
    const pathPart = pathParts[i];

    if (pPart.startsWith(':')) {
      const key = pPart.slice(1);
      params[key] = decodeURIComponent(pathPart.split('#')[0]);
    } else if (pPart !== pathPart) {
      return null;
    }
  }

  return params;
}
