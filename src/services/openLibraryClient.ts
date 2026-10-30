import { CoverLicense, CoverSource } from '../types';
import { verifyImageUrl } from './coverService';

export interface OpenLibraryFetchResult {
  success: boolean;
  coverUrl?: string;
  source: CoverSource;
  license: CoverLicense;
  attribution: string;
  sourceUrl?: string;
  error?: string;
}

/**
 * Client-side fetcher for Open Library Covers API with fallback verification
 */
export async function fetchOpenLibraryCoverByISBN(
  isbn: string,
  size: 'S' | 'M' | 'L' = 'L',
  workTitle?: string,
  _authorName?: string
): Promise<OpenLibraryFetchResult> {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
  if (!cleanIsbn) {
    return {
      success: false,
      source: 'Open Library',
      license: 'Unknown',
      attribution: '',
      error: 'Invalid ISBN format. Expected 10 or 13 digits.'
    };
  }

  const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-${size}.jpg?default=false`;
  const isValid = await verifyImageUrl(coverUrl);

  if (!isValid) {
    return {
      success: false,
      source: 'Open Library',
      license: 'Unknown',
      attribution: '',
      error: `No cover found on Open Library for ISBN ${cleanIsbn}.`
    };
  }

  return {
    success: true,
    coverUrl,
    source: 'Open Library',
    license: 'Public Domain',
    attribution: `Cover image for ${workTitle || 'this work'} sourced via Open Library Covers API (ISBN: ${cleanIsbn}).`,
    sourceUrl: `https://openlibrary.org/isbn/${cleanIsbn}`
  };
}

/**
 * Fetch Open Library cover by Open Library ID (OLID)
 */
export async function fetchOpenLibraryCoverByOLID(
  olid: string,
  size: 'S' | 'M' | 'L' = 'L',
  workTitle?: string
): Promise<OpenLibraryFetchResult> {
  const cleanOlid = olid.trim();
  if (!cleanOlid) {
    return {
      success: false,
      source: 'Open Library',
      license: 'Unknown',
      attribution: '',
      error: 'Invalid OLID format.'
    };
  }

  const coverUrl = `https://covers.openlibrary.org/b/olid/${cleanOlid}-${size}.jpg?default=false`;
  const isValid = await verifyImageUrl(coverUrl);

  if (!isValid) {
    return {
      success: false,
      source: 'Open Library',
      license: 'Unknown',
      attribution: '',
      error: `No cover found on Open Library for OLID ${cleanOlid}.`
    };
  }

  return {
    success: true,
    coverUrl,
    source: 'Open Library',
    license: 'Public Domain',
    attribution: `Cover image for ${workTitle || 'this work'} sourced via Open Library Covers API (OLID: ${cleanOlid}).`,
    sourceUrl: `https://openlibrary.org/books/${cleanOlid}`
  };
}
