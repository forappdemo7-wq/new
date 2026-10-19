/**
 * OpenLibrary Client for fetching book covers and metadata.
 */

export async function fetchOpenLibraryCoverByISBN(isbn: string): Promise<string | null> {
  if (!isbn) return null;
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').trim();
  if (!cleanIsbn) return null;
  
  const url = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) {
      return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
    }
  } catch {
    // fallback or network error
  }
  return null;
}

export async function fetchOpenLibraryCoverByOLID(olid: string): Promise<string | null> {
  if (!olid) return null;
  const cleanOlid = olid.trim();
  if (!cleanOlid) return null;

  const url = `https://covers.openlibrary.org/b/olid/${cleanOlid}-L.jpg?default=false`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) {
      return `https://covers.openlibrary.org/b/olid/${cleanOlid}-L.jpg`;
    }
  } catch {}
  return null;
}

export async function searchOpenLibraryBooks(query: string): Promise<any[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.docs || [];
  } catch {
    return [];
  }
}
