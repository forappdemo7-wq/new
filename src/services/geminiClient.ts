import { apiUrl } from './apiConfig';

export interface VibeMatchResult {
  curatorGreeting: string;
  vibeTags: string[];
  catalogMatches: Array<{
    id: string;
    title: string;
    author: string;
    vibeScore: number;
    whyItFits: string;
  }>;
  archiveSuggestions: Array<{
    title: string;
    author: string;
    vibeScore: number;
    whyItFits: string;
  }>;
}

export type GeminiVoiceName = 'Kore' | 'Fenrir' | 'Puck' | 'Zephyr' | 'Charon';

export const GEMINI_VOICES: Array<{ id: GeminiVoiceName; label: string; desc: string }> = [
  { id: 'Kore', label: 'Kore', desc: 'Warm, literary & thoughtful' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Deep, resonant & dramatic' },
  { id: 'Puck', label: 'Puck', desc: 'Lively, expressive & adventurous' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Calm, gentle & meditative' },
  { id: 'Charon', label: 'Charon', desc: 'Somber, classical & measured' }
];

/**
 * Mood & Vibe-based smart search using gemini-3.8-flash
 */
export async function queryVibeSearch(
  vibeQuery: string,
  catalogContext: Array<{ id: string; title: string; author: string; genres: string[]; synopsis: string }>
): Promise<VibeMatchResult> {
  const res = await fetch(apiUrl('/api/gemini/vibe-search'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vibeQuery, catalogContext })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Vibe search failed (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Text-to-speech request to server proxy
 */
export async function fetchGeminiSpeech(
  text: string,
  voiceName: GeminiVoiceName = 'Kore',
  style?: string
): Promise<{ audioBase64: string; mimeType: string }> {
  const res = await fetch(apiUrl('/api/gemini/tts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName, style })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `TTS synthesis failed (${res.status})`);
  }

  const json = await res.json();
  return {
    audioBase64: json.audioBase64,
    mimeType: json.mimeType || 'audio/wav'
  };
}

export interface TextAnnotationResult {
  termOrPhrase: string;
  simplifiedMeaning: string;
  historicalEraContext: string;
  literarySignificance: string;
  etymologyOrOrigin: string;
  synonyms: string[];
}

/**
 * AI Contextual Annotation request to server proxy
 */
export async function fetchGeminiAnnotation(
  text: string,
  bookTitle?: string,
  author?: string,
  paragraphContext?: string
): Promise<TextAnnotationResult> {
  const res = await fetch(apiUrl('/api/gemini/annotate-text'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, bookTitle, author, paragraphContext })
  });

  const json = await res.json();
  return json.annotation;
}

export interface MangaVisionResult {

  panelCount: number;
  sceneDescription: string;
  extractedDialogue: Array<{ speaker: string; text: string }>;
  fullTranscript: string;
  artStyleNotes: string;
}

/**
 * Manga page visual inspection & speech bubble extraction via Gemini 3.8 Flash Vision
 */
export async function fetchMangaPageVision(
  imageUrl: string,
  mangaTitle?: string,
  chapterTitle?: string,
  pageNumber?: number
): Promise<MangaVisionResult> {
  const res = await fetch(apiUrl('/api/gemini/manga-vision'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, mangaTitle, chapterTitle, pageNumber })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Manga vision analysis failed (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}


