import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const geminiApiRouter = Router();

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function cleanJsonParse<T = any>(rawText: string, fallback: T): T {
  if (!rawText) return fallback;
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch {}
    }
    return fallback;
  }
}

/**
 * POST /api/gemini/vibe-search
 * Semantic, mood, and vibe-based book recommendations using gemini-3.8-flash
 */
geminiApiRouter.post('/vibe-search', async (req: Request, res: Response) => {
  try {
    const { vibeQuery, catalogContext } = req.body;
    if (!vibeQuery || typeof vibeQuery !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing vibeQuery string.' });
    }

    const ai = getAiClient();

    const prompt = `You are a warm, erudite literary curator for "get-now", an open public domain library of classic books, comics, and manga.
A reader is searching for reading material matching this mood, vibe, aesthetic, or feeling:
"${vibeQuery.trim()}"

Here is a selection of the library catalog:
${JSON.stringify(catalogContext || [], null, 2)}

Recommend:
1. Up to 4 best matching works from the catalog provided above.
2. Up to 3 additional famous public domain classic works (from the 70,000+ Project Gutenberg archive, like Dracula, Frankenstein, Meditations, Treasure Island, Jane Eyre, Crime and Punishment, etc.) that capture this vibe.

Return ONLY a strict JSON object with this exact shape:
{
  "curatorGreeting": "A poetic, evocative 1-sentence thought on their chosen mood/vibe",
  "vibeTags": ["e.g. Gothic", "Melancholy", "Atmospheric"],
  "catalogMatches": [
    {
      "id": "matching catalog work id",
      "title": "Title",
      "author": "Author",
      "vibeScore": 96,
      "whyItFits": "1-2 sentences on why this fits their vibe"
    }
  ],
  "archiveSuggestions": [
    {
      "title": "Title",
      "author": "Author",
      "vibeScore": 92,
      "whyItFits": "1-2 sentences on why this fits their vibe"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = cleanJsonParse(text, {
      curatorGreeting: 'Explore timeless literary creations matching your mood.',
      vibeTags: ['Classic', 'Literary'],
      catalogMatches: [],
      archiveSuggestions: []
    });

    return res.json({
      success: true,
      data: parsed
    });
  } catch (err: any) {
    console.error('Gemini vibe-search error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate recommendations'
    });
  }
});

/**
 * POST /api/gemini/tts
 * Generates natural literary voice narration with multi-model fallback strategy:
 * Tier 1: gemini-3.8-flash-lite-tts (High efficiency)
 * Tier 2: gemini-3.8-flash-tts (Flagship audio)
 * Tier 3: Browser Web Speech API (Client fallback)
 */
geminiApiRouter.post('/tts', async (req: Request, res: Response) => {
  const { text, voiceName = 'Kore', style } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing text parameter' });
  }

  // Keep chunk to ~2000 chars per paragraph/section request
  const cleanText = text.trim().substring(0, 2500);

  const ai = getAiClient();
  const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const chosenVoice = allowedVoices.includes(voiceName) ? voiceName : 'Kore';

  const ttsModelsToTry = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];
  let lastError: any = null;

  for (const modelName of ttsModelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: style || 'Clear, warm, expressive literary narration with natural cadence and comfortable pacing'
                }
              }
            ]
          }
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          success: true,
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
          voice: chosenVoice,
          modelUsed: modelName
        });
      }
    } catch (err: any) {
      console.warn(`Gemini TTS model ${modelName} encountered rate limit / error:`, err?.message || err);
      lastError = err;
    }
  }

  // If all Gemini TTS models hit rate limits or errors, instruct client to use Web Speech API fallback
  const isRateLimit =
    lastError?.status === 429 ||
    lastError?.statusCode === 429 ||
    String(lastError?.message || '').includes('429') ||
    String(lastError?.message || '').includes('Quota exceeded') ||
    String(lastError?.message || '').includes('RESOURCE_EXHAUSTED');

  return res.status(isRateLimit ? 429 : 500).json({
    success: false,
    error: isRateLimit
      ? 'All Gemini TTS model quotas reached. Switching seamlessly to browser speech engine.'
      : (lastError?.message || 'Failed to synthesize speech across available TTS models'),
    isRateLimit: true,
    fallbackToBrowser: true
  });
});



/**
 * POST /api/gemini/annotate-text
 * Smart contextual annotation, historical analysis, and plain-English breakdown of highlighted literary passages.
 */
geminiApiRouter.post('/annotate-text', async (req: Request, res: Response) => {
  try {
    const { text, bookTitle, author, paragraphContext } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing highlighted text parameter.' });
    }

    const ai = getAiClient();
    const prompt = `You are an expert literary scholar and annotations curator for classic literature.
A reader highlighted this phrase or passage while reading "${bookTitle || 'a classic book'}" by ${author || 'the author'}:
"${text.trim()}"

Surrounding Paragraph Context:
"${(paragraphContext || '').trim()}"

Provide a rich, accessible, plain-English breakdown of this highlighted text.
Return ONLY a strict JSON object with this exact shape:
{
  "termOrPhrase": "${text.trim()}",
  "simplifiedMeaning": "1-2 sentence clear, direct plain-English explanation",
  "historicalEraContext": "1-2 sentences on the historical, cultural, or era-specific background (or N/A if general)",
  "literarySignificance": "1-2 sentences on why this word/phrase matters in classic literature or this work's themes",
  "etymologyOrOrigin": "Brief word origin/root if notable, or empty string",
  "synonyms": ["up to 3 modern equivalent words"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const outputText = response.text || '{}';
    const parsed = cleanJsonParse(outputText, {
      termOrPhrase: text.trim(),
      simplifiedMeaning: 'Literary term or historical passage from the work.',
      historicalEraContext: 'Classic public domain literature context.',
      literarySignificance: 'Enhances depth and tone of the narrative.',
      etymologyOrOrigin: '',
      synonyms: []
    });

    return res.json({
      success: true,
      annotation: parsed
    });
  } catch (err: any) {
    console.error('Gemini annotate-text error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate contextual annotation'
    });
  }
});

/**
 * POST /api/gemini/manga-vision
 * Analyzes a manga page image using Gemini 3.8 Flash, extracting dialogue, panel layout, and scene context.
 */
geminiApiRouter.post('/manga-vision', async (req: Request, res: Response) => {
  try {
    const { imageUrl, mangaTitle, chapterTitle, pageNumber } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing imageUrl parameter.' });
    }

    const ai = getAiClient();
    let imagePart: any = null;

    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
      if (match) {
        imagePart = { inlineData: { mimeType: match[1], data: match[2] } };
      }
    } else {
      // If relative URL, resolve against local server port
      const targetUrl = imageUrl.startsWith('/')
        ? `http://127.0.0.1:${process.env.PORT || 3000}${imageUrl}`
        : imageUrl;

      const imgRes = await fetch(targetUrl);
      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString('base64');
        const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        imagePart = { inlineData: { mimeType, data: base64 } };
      }
    }

    if (!imagePart) {
      return res.status(400).json({ success: false, error: 'Failed to fetch or parse manga page image.' });
    }

    const prompt = `You are a manga curator and OCR dialogue analyzer.
Analyze this manga page from "${mangaTitle || 'Manga'}" (${chapterTitle || 'Chapter'}, Page ${pageNumber || '1'}).

Return ONLY a strict JSON object with this exact shape:
{
  "panelCount": 4,
  "sceneDescription": "1-2 sentences summarizing the visual action, emotional mood, and setting on this page",
  "extractedDialogue": [
    { "speaker": "Character Name or Unknown", "text": "Extracted speech bubble text or dialogue" }
  ],
  "fullTranscript": "A clean concatenated text transcript of all dialogue and sound effects on this page for TTS reading",
  "artStyleNotes": "Brief comment on shading, action lines, or dramatic panel composition"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const outputText = response.text || '{}';
    const parsed = cleanJsonParse(outputText, {
      panelCount: 1,
      sceneDescription: 'Visual sequential manga page with artistic illustration and dialogues.',
      extractedDialogue: [],
      fullTranscript: '',
      artStyleNotes: 'Sequential art layout with custom line work and visual paneling.'
    });

    return res.json({
      success: true,
      data: parsed
    });
  } catch (err: any) {
    console.error('Gemini manga-vision error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to analyze manga page image'
    });
  }
});


