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
    const parsed = JSON.parse(text);

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
 * Generates natural literary voice narration using gemini-3.8-flash-lite-tts
 */
geminiApiRouter.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore', style } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing text parameter' });
    }

    // Keep chunk to ~2000 chars per paragraph/section request
    const cleanText = text.trim().substring(0, 2500);

    const ai = getAiClient();
    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = allowedVoices.includes(voiceName) ? voiceName : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
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
    if (!base64Audio) {
      return res.status(500).json({
        success: false,
        error: 'No audio data returned by Gemini TTS model.'
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice: chosenVoice
    });
  } catch (err: any) {
    console.error('Gemini TTS error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to synthesize speech'
    });
  }
});
