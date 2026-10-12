import { Work } from '../types';

const SEARCH_HISTORY_KEY = 'getnow_search_history_v1';
const SAVED_SEARCHES_KEY = 'getnow_saved_searches_v1';

export interface SearchResultMatch {
  work: Work;
  score: number;
  matchReasons: string[];
}

/**
 * Retrieves past search history items from LocalStorage
 */
export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new search query to history
 */
export function saveToSearchHistory(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const history = getSearchHistory().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    history.unshift(trimmed);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
  } catch {
    // ignore
  }
}

/**
 * Clears search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // ignore
  }
}

/**
 * Retrieves saved queries
 */
export function getSavedSearches(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggles saving a search query
 */
export function toggleSaveSearch(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  try {
    const saved = getSavedSearches();
    const exists = saved.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    let updated: string[];
    if (exists) {
      updated = saved.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    } else {
      updated = [trimmed, ...saved];
    }
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

/**
 * Layered local-first search across all catalog fields
 */
export function searchCatalogLocal(works: Work[], query: string): SearchResultMatch[] {
  const q = query.toLowerCase().trim();
  if (!q) return works.map((w) => ({ work: w, score: 1, matchReasons: [] }));

  const tokens = q.split(/\s+/).filter(Boolean);
  const results: SearchResultMatch[] = [];

  for (const work of works) {
    let score = 0;
    const matchReasons: string[] = [];

    const title = work.title.toLowerCase();
    const nativeTitle = (work.nativeTitle || '').toLowerCase();
    const authors = (work.authors || []).map((a) => a.name.toLowerCase()).join(' ');
    const genres = (work.genres || []).map((g) => g.toLowerCase()).join(' ');
    const tags = (work.tags || []).map((t) => t.toLowerCase()).join(' ');
    const synopsis = (work.synopsis || work.description || '').toLowerCase();

    // Exact title match
    if (title === q || nativeTitle === q) {
      score += 100;
      matchReasons.push('Exact title match');
    } else if (title.includes(q)) {
      score += 50;
      matchReasons.push('Title match');
    }

    // Author match
    if (authors.includes(q)) {
      score += 40;
      matchReasons.push('Author match');
    }

    // Publisher / Creator match
    const publisher = (work.publisherName || '').toLowerCase();
    const publisherEmail = (work.publisherEmail || '').toLowerCase();
    const uploader = (work.uploaderId || '').toLowerCase();
    if (publisher.includes(q) || publisherEmail.includes(q) || uploader.includes(q)) {
      score += 45;
      matchReasons.push('Creator match');
    }

    // Token checking
    for (const token of tokens) {
      if (title.includes(token)) {
        score += 15;
      }
      if (authors.includes(token)) {
        score += 12;
      }
      if (genres.includes(token)) {
        score += 10;
        if (!matchReasons.includes('Genre match')) matchReasons.push(`Genre: ${token}`);
      }
      if (tags.includes(token)) {
        score += 8;
        if (!matchReasons.includes('Tag match')) matchReasons.push(`Tag: ${token}`);
      }
      if (synopsis.includes(token)) {
        score += 5;
      }
    }

    if (score > 0) {
      results.push({ work, score, matchReasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Gets "Because you read [Work]" contextual recommendations
 */
export function getContextualRecommendations(targetWork: Work, allWorks: Work[]): Work[] {
  const targetGenres = new Set((targetWork.genres || []).map((g) => g.toLowerCase()));
  const targetAuthors = new Set((targetWork.authors || []).map((a) => a.name.toLowerCase()));

  return allWorks
    .filter((w) => w.id !== targetWork.id)
    .map((w) => {
      let score = 0;
      if (w.type === targetWork.type) score += 20;
      (w.genres || []).forEach((g) => {
        if (targetGenres.has(g.toLowerCase())) score += 15;
      });
      (w.authors || []).forEach((a) => {
        if (targetAuthors.has(a.name.toLowerCase())) score += 30;
      });
      return { work: w, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.work)
    .slice(0, 6);
}

/**
 * Filters works by mood preset
 */
export function filterByMood(
  works: Work[],
  mood: 'eerie' | 'short_read' | 'quiet_evening' | 'fantasy' | 'dark_gothic' | 'historical'
): Work[] {
  return works.filter((w) => {
    const text = `${w.title} ${(w.genres || []).join(' ')} ${(w.tags || []).join(' ')} ${w.description || ''}`.toLowerCase();
    switch (mood) {
      case 'eerie':
      case 'dark_gothic':
        return text.includes('horror') || text.includes('gothic') || text.includes('dark') || text.includes('vampire') || text.includes('monster');
      case 'short_read':
        return (w.wordCount || 50000) < 30000 || w.type === 'comic' || (w.chapters?.length || 0) <= 3;
      case 'quiet_evening':
        return text.includes('romance') || text.includes('poetry') || text.includes('classics') || text.includes('drama');
      case 'fantasy':
        return text.includes('fantasy') || text.includes('magic') || text.includes('adventure') || text.includes('mecha');
      case 'historical':
        return (w.originalPublicationYear || 2000) < 1920 || text.includes('history') || text.includes('woodblock') || text.includes('edo');
      default:
        return true;
    }
  });
}

/**
 * Surprise Me: Returns a random curated masterpiece
 */
export function getSurpriseWork(works: Work[]): Work {
  const eligible = works.filter((w) => w.chapters?.length > 0);
  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex] || works[0];
}
