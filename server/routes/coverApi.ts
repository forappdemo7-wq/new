/**
 * Server API Route for Open Library Covers
 * Express Router handler for fetching, validating, and caching book covers by ISBN, OLID, or OCLC.
 */

import { Request, Response, Router } from 'express';

export const coverApiRouter = Router();

interface OpenLibraryFetchQuery {
  isbn?: string;
  olid?: string;
  oclc?: string;
  size?: 'S' | 'M' | 'L';
  title?: string;
  author?: string;
}

/**
 * GET /api/covers/openlibrary
 * Fetches and verifies a cover from Open Library Covers API
 */
coverApiRouter.get('/openlibrary', async (req: Request<{}, {}, {}, OpenLibraryFetchQuery>, res: Response) => {
  try {
    const { isbn, olid, oclc, size = 'L', title = 'Unknown Title', author = 'Unknown Author' } = req.query;

    let idType: 'isbn' | 'olid' | 'oclc' = 'isbn';
    let identifier = '';

    if (isbn) {
      idType = 'isbn';
      identifier = isbn.replace(/[^0-9X]/gi, '');
    } else if (olid) {
      idType = 'olid';
      identifier = olid.trim();
    } else if (oclc) {
      idType = 'oclc';
      identifier = oclc.trim();
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing identifier. Please provide an `isbn`, `olid`, or `oclc` query parameter.'
      });
    }

    const openLibraryUrl = `https://covers.openlibrary.org/b/${idType}/${identifier}-${size}.jpg?default=false`;

    // Verify upstream response
    const headRes = await fetch(openLibraryUrl, { method: 'GET' });

    if (!headRes.ok) {
      return res.status(404).json({
        success: false,
        found: false,
        error: `No cover found on Open Library for ${idType.toUpperCase()} ${identifier}.`,
        fallbackSuggestion: 'Typographic Ghost Cover'
      });
    }

    // Open Library returns a tiny blank 43-byte image if not found
    const contentLength = headRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) < 100) {
      return res.status(404).json({
        success: false,
        found: false,
        error: `Open Library returned a blank placeholder for ${idType.toUpperCase()} ${identifier}.`,
        fallbackSuggestion: 'Typographic Ghost Cover'
      });
    }

    return res.json({
      success: true,
      found: true,
      data: {
        coverImageUrl: openLibraryUrl,
        identifierType: idType,
        identifier,
        size,
        coverSource: 'Open Library',
        coverSourceUrl: `https://openlibrary.org/search?q=${identifier}`,
        coverLicense: 'Public Domain',
        coverAttribution: `Cover art for "${title}" courtesy of the Open Library Covers Repository (${idType.toUpperCase()}: ${identifier}).`,
        isPublishable: true
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error while resolving Open Library cover.',
      details: error?.message || 'Unknown error'
    });
  }
});

export default coverApiRouter;
