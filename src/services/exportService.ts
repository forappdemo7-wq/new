import JSZip from 'jszip';
import { Work, Chapter, ComicPage } from '../types';

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Triggers a browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Generates an official, standard-compliant .EPUB file for e-readers (Kindle, Apple Books, Kobo)
 */
export async function generateEpub(work: Work): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (must be first, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = zip.folder('OEBPS');
  if (!oebps) throw new Error('Could not initialize EPUB folder structure');

  // 3. CSS stylesheet
  const cssContent = `
body {
  font-family: 'Newsreader', 'Georgia', 'Times New Roman', serif;
  line-height: 1.65;
  margin: 5% 8%;
  color: #1a1a1a;
}
h1, h2, h3 {
  font-family: 'Newsreader', 'Georgia', serif;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  font-weight: bold;
}
h1 { font-size: 1.8em; }
h2 { font-size: 1.4em; }
p {
  margin-top: 0;
  margin-bottom: 0.85em;
  text-indent: 1.25em;
  text-align: justify;
}
p.first {
  text-indent: 0;
}
.titlepage {
  text-align: center;
  margin-top: 20%;
}
.author {
  font-size: 1.2em;
  font-style: italic;
  margin-top: 1em;
}
.colophon {
  font-size: 0.85em;
  color: #666;
  text-align: center;
  margin-top: 4em;
  border-top: 1px solid #ccc;
  padding-top: 1em;
}
`;
  oebps.file('style.css', cssContent);

  const chapters: Chapter[] = work.chapters || [];
  const authorNames = work.authors?.map((a) => a.name).join(', ') || 'Anonymous';
  const cleanTitle = escapeXml(work.title);
  const cleanAuthor = escapeXml(authorNames);
  const bookId = `urn:uuid:${work.id}`;

  // 4. Title Page (XHTML)
  const titlePageHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${cleanTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="titlepage">
    <h1>${cleanTitle}</h1>
    <div class="author">by ${cleanAuthor}</div>
    <div class="colophon">
      <p>Edition: wanna read? Open Library Archive</p>
      <p>License: ${escapeXml(work.licenseCode)}</p>
      <p>Original Publication Year: ${work.originalPublicationYear || 'Historic'}</p>
    </div>
  </div>
</body>
</html>`;
  oebps.file('titlepage.xhtml', titlePageHtml);

  // 5. Chapter XHTML files
  chapters.forEach((ch, idx) => {
    const chapterNum = ch.chapterNumber || ch.number || idx + 1;
    const cleanChapterTitle = escapeXml(ch.title || `Chapter ${chapterNum}`);
    const paragraphs = (ch.content || '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const paragraphsHtml = paragraphs
      .map((p, pIdx) => `<p class="${pIdx === 0 ? 'first' : ''}">${escapeXml(p)}</p>`)
      .join('\n    ');

    const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${cleanChapterTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h2>${cleanChapterTitle}</h2>
  <div class="chapter-body">
    ${paragraphsHtml || '<p class="first">No textual content.</p>'}
  </div>
</body>
</html>`;
    oebps.file(`chapter_${idx + 1}.xhtml`, chapterHtml);
  });

  // 6. NCX Navigation File (for older e-readers & TOC)
  const ncxNavPoints = chapters
    .map(
      (ch, idx) => `
    <navPoint id="navpoint-${idx + 1}" playOrder="${idx + 2}">
      <navLabel><text>${escapeXml(ch.title || `Chapter ${idx + 1}`)}</text></navLabel>
      <content src="chapter_${idx + 1}.xhtml"/>
    </navPoint>`
    )
    .join('');

  const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${cleanTitle}</text></docTitle>
  <docAuthor><text>${cleanAuthor}</text></docAuthor>
  <navMap>
    <navPoint id="navpoint-0" playOrder="1">
      <navLabel><text>Title Page</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>${ncxNavPoints}
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', ncxContent);

  // 7. OPF Package File (Manifest & Spine)
  const manifestItems = [
    `<item id="style" href="style.css" media-type="text/css"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>`,
    ...chapters.map(
      (_, idx) => `<item id="chapter_${idx + 1}" href="chapter_${idx + 1}.xhtml" media-type="application/xhtml+xml"/>`
    )
  ].join('\n    ');

  const spineItems = [
    `<itemref idref="titlepage"/>`,
    ...chapters.map((_, idx) => `<itemref idref="chapter_${idx + 1}"/>`)
  ].join('\n    ');

  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>${cleanTitle}</dc:title>
    <dc:creator>${cleanAuthor}</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>wanna read? Open Library</dc:publisher>
    <dc:rights>${escapeXml(work.licenseCode)}</dc:rights>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`;
  oebps.file('content.opf', opfContent);

  // Generate binary EPUB
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

/**
 * Generates an official, standard-compliant .CBZ comic archive with ComicInfo.xml for Panels, Chunky, and Tachiyomi
 */
export async function generateCbz(work: Work): Promise<Blob> {
  const zip = new JSZip();
  const authorNames = work.authors?.map((a) => a.name).join(', ') || 'Anonymous';

  // 1. Collect all comic pages across chapters
  const allPages: { pageNum: number; chapterTitle: string; page: ComicPage }[] = [];
  (work.chapters || []).forEach((ch) => {
    (ch.pages || []).forEach((p) => {
      allPages.push({
        pageNum: allPages.length + 1,
        chapterTitle: ch.title,
        page: p
      });
    });
  });

  // 2. Add ComicInfo.xml metadata
  const comicInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Title>${escapeXml(work.title)}</Title>
  <Series>${escapeXml(work.title)}</Series>
  <Writer>${escapeXml(authorNames)}</Writer>
  <Penciller>${escapeXml(authorNames)}</Penciller>
  <Publisher>${escapeXml(work.publisher || 'wanna read? Open Commons')}</Publisher>
  <Genre>${escapeXml((work.genres || []).join(', '))}</Genre>
  <PageCount>${allPages.length}</PageCount>
  <LanguageISO>en</LanguageISO>
  <Format>${work.type === 'manga' ? 'Manga' : 'Comic'}</Format>
  <Manga>${work.readingDirection === 'rtl' ? 'YesAndRightToLeft' : 'Yes'}</Manga>
  <Summary>${escapeXml(work.synopsis || work.description || '')}</Summary>
</ComicInfo>`;
  zip.file('ComicInfo.xml', comicInfoXml);

  // 3. Add image files / SVG pages
  for (let i = 0; i < allPages.length; i++) {
    const item = allPages[i];
    const paddedNum = String(i + 1).padStart(3, '0');

    if (item.page.svgArt) {
      zip.file(`page_${paddedNum}.svg`, item.page.svgArt);
    } else if (item.page.imageUrl) {
      try {
        const response = await fetch(item.page.imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const ext = item.page.imageUrl.endsWith('.png') ? 'png' : 'jpg';
          zip.file(`page_${paddedNum}.${ext}`, blob);
        }
      } catch (e) {
        // Fallback placeholder
        zip.file(
          `page_${paddedNum}.svg`,
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><rect width="800" height="1200" fill="#fff"/><text x="400" y="600" font-family="sans-serif" font-size="24" text-anchor="middle">Page ${i + 1}</text></svg>`
        );
      }
    }
  }

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/x-cbz' });
}
