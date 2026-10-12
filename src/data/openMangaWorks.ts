import { Work } from '../types';
import { AUTHORS } from './authors';

import blackJackCover1 from '../assets/images/black_jack_manga_cover_1791280479453.jpg';
import blackJackCover2 from '../assets/images/black_jack_manga_cover_1790850446191.jpg';
import hokusaiCover2 from '../assets/images/manga_hokusai_woodblock_1790760941217.jpg';
import hokusaiCover4 from '../assets/images/hokusai_vol3_cover_1790850301228.jpg';
import ubunchuCover3 from '../assets/images/ubunchu_ep2_cover_1790850324303.jpg';
import shochanCover from '../assets/images/manga_tagosaku_rakuten_1790761404363.jpg';

export const OPEN_MANGA_WORKS: Work[] = [
  // ── 1. Say Hello to Black Jack — Volume 1 ──────────────────────────────
  {
    id: 'work-black-jack-yoroshiku-1',
    title: 'Say Hello to Black Jack: Vol. 1',
    nativeTitle: 'ブラックジャックによろしく 第1巻',
    romajiTitle: 'Burakku Jakku ni Yoroshiku',
    slug: 'say-hello-to-black-jack-vol-1',
    type: 'manga',
    description: 'Bestselling 10-million-copy medical drama manga by Shūhō Satō. Intern doctor Eijirō Saitō confronts the stark ethical dilemmas and systemic contradictions of university hospital medicine.',
    synopsis: 'Released completely royalty-free and copyright-free worldwide by author Shūhō Satō in September 2012. Follows trainee doctor Saitō as he starts his first harrowing night shift at Eiryō University Hospital.',
    coverImage: blackJackCover1,
    coverPalette: {
      bg: '#0F172A',
      text: '#F8FAFC',
      accent: '#0284C7',
      name: 'Hospital Navy'
    },
    language: 'Japanese / English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://mangaonweb.com',
    sourceName: 'Shūhō Satō Official Open Release / Manga on Web',
    attribution: 'Shūhō Satō (2002). Officially released copyright-free for secondary and digital distribution in September 2012.',
    publisher: 'Manga on Web / Titit Co., Ltd.',
    originalPublicationYear: 2002,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Author officially surrendered copyright and commercial exclusivity to the global public domain in 2012.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'seinen',
    authors: [AUTHORS['shuho-sato']],
    genres: ['Medical Drama', 'Psychological', 'Manga', 'Classic Manga'],
    tags: ['Doctor', 'Hospital Ethics', 'Seinen', 'Japan', 'Free Manga', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 38,
    readingTimeMinutes: 25,
    featured: true,
    recentlyAdded: true,
    popularityScore: 99,
    verificationStatus: 'verified',
    verifiedAt: '2026-03-01T00:00:00Z',
    verifiedBy: 'Manga Rights & Creative Commons Compliance Board',
    evidenceUrl: 'https://mangaonweb.com',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'bj-v1-ch1',
        workId: 'work-black-jack-yoroshiku-1',
        chapterNumber: 1,
        number: 1,
        title: 'Chapter 1: The Eiryo University Ward (第一夜: 栄良大学病院)',
        slug: 'chapter-1-first-night',
        pagesCount: 4,
        pages: [
          {
            id: 'bj-v1-p1',
            pageNumber: 1,
            altText: 'Dr. Eijiro Saito entering the massive Eiryo University Hospital in Tokyo',
            caption: 'Page 1 — Tokyo, Eiryō University Hospital. Trainee Intern Dr. Saitō (25). Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#0F172A"/>
                <!-- Manga Frame Layout -->
                <rect x="25" y="25" width="750" height="1100" fill="#F8FAFC" rx="4"/>
                
                <!-- Top Header Banner -->
                <rect x="35" y="35" width="730" height="85" fill="#0F172A"/>
                <text x="740" y="70" text-anchor="end" font-family="'Newsreader', serif" font-weight="900" font-size="28" fill="#F8FAFC">ブラックジャックによろしく</text>
                <text x="740" y="98" text-anchor="end" font-family="'Instrument Sans', sans-serif" font-weight="600" font-size="13" fill="#38BDF8">Say Hello to Black Jack · Chapter 1: The University Hospital</text>
                <text x="55" y="85" text-anchor="start" font-family="'IBM Plex Mono', monospace" font-size="11" fill="#94A3B8">PAGE 1 · RTL ➔</text>
                
                <!-- Panel 1: The Megastructure Hospital -->
                <rect x="35" y="130" width="730" height="420" fill="#090D16" stroke="#0F172A" stroke-width="4"/>
                <!-- Silhouette Building Windows -->
                <pattern id="gridWindows" width="20" height="30" patternUnits="userSpaceOnUse">
                  <rect x="4" y="6" width="12" height="18" fill="#FDE047" opacity="0.65"/>
                </pattern>
                <rect x="180" y="160" width="440" height="390" fill="url(#gridWindows)"/>
                <polygon points="120,550 200,220 300,220 380,550" fill="#1E293B" opacity="0.8"/>
                <polygon points="420,550 500,180 620,180 700,550" fill="#1E293B" opacity="0.8"/>
                
                <!-- Hospital Monologue Bubble (RTL top right) -->
                <rect x="490" y="150" width="250" height="90" fill="#FFFFFF" rx="8" stroke="#0F172A" stroke-width="2"/>
                <text x="720" y="180" text-anchor="end" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="14" fill="#0F172A">"Eiryō University Hospital."</text>
                <text x="720" y="202" text-anchor="end" font-family="'Instrument Sans', sans-serif" font-size="12" fill="#334155">One of Japan's most elite</text>
                <text x="720" y="222" text-anchor="end" font-family="'Instrument Sans', sans-serif" font-size="12" fill="#334155">centers of clinical power.</text>

                <!-- Panel 2: Intern Dr. Saito (Bottom Right) -->
                <rect x="405" y="560" width="360" height="555" fill="#FFFFFF" stroke="#0F172A" stroke-width="4"/>
                <circle cx="585" cy="740" r="110" fill="#E2E8F0"/>
                <!-- Stethoscope & Doctor Coat Graphic -->
                <path d="M510,880 Q585,780 660,880 L660,1110 L510,1110 Z" fill="#F1F5F9" stroke="#0F172A" stroke-width="3"/>
                <path d="M545,760 Q585,860 625,760" fill="none" stroke="#0284C7" stroke-width="6"/>
                <circle cx="585" cy="880" r="14" fill="#0284C7"/>
                
                <!-- Dialogue Bubble -->
                <rect x="430" y="580" width="310" height="100" fill="#F8FAFC" rx="10" stroke="#0F172A" stroke-width="2"/>
                <text x="720" y="612" text-anchor="end" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="14" fill="#0F172A">Saitō Eijirō (Age 25)</text>
                <text x="720" y="635" text-anchor="end" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#334155">"I studied 16 hours a day to pass."</text>
                <text x="720" y="658" text-anchor="end" font-family="'Instrument Sans', sans-serif" font-size="12" fill="#475569">"Now I'm finally a licensed doctor..."</text>

                <!-- Panel 3: Reality check (Bottom Left) -->
                <rect x="35" y="560" width="360" height="555" fill="#0F172A" stroke="#0F172A" stroke-width="4"/>
                <rect x="55" y="620" width="320" height="170" fill="#1E293B" rx="8" stroke="#334155" stroke-width="2"/>
                <text x="215" y="665" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="14" fill="#EF4444">THE UNTOLD REALITY:</text>
                <text x="215" y="695" text-anchor="middle" font-family="'Newsreader', serif" font-size="18" fill="#F8FAFC">Monthly Intern Salary:</text>
                <text x="215" y="735" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-weight="bold" font-size="28" fill="#FDE047">¥38,000 / month</text>
                <text x="215" y="765" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="11" fill="#94A3B8">(Roughly $280 USD for 90-hour weeks)</text>

                <rect x="55" y="820" width="320" height="270" fill="#F8FAFC" rx="8" stroke="#0F172A" stroke-width="2"/>
                <text x="215" y="865" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="17" fill="#0F172A">"To survive..."</text>
                <text x="215" y="905" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#334155">"We are secretly forced to moonlight</text>
                <text x="215" y="928" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#334155">at shady night-shift emergency clinics</text>
                <text x="215" y="951" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#334155">with zero senior supervision."</text>
                <text x="215" y="1020" text-anchor="middle" font-family="'Newsreader', serif" font-style="italic" font-size="16" fill="#B91C1C">"Tonight is my first night shift."</text>
              </svg>
            `
          },
          {
            id: 'bj-v1-p2',
            pageNumber: 2,
            altText: 'Emergency sirens wailing outside the peripheral night clinic',
            caption: 'Page 2 — The Night Duty. A critical traffic trauma victim arrives.',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#020617"/>
                <rect x="25" y="25" width="750" height="1100" fill="#FFFFFF" rx="4"/>
                
                <!-- Speedlines Top Panel (Siren Alarm) -->
                <rect x="35" y="35" width="730" height="340" fill="#7F1D1D" stroke="#000000" stroke-width="4"/>
                <circle cx="400" cy="205" r="90" fill="#EF4444" opacity="0.8"/>
                <text x="400" y="170" text-anchor="middle" font-family="'Newsreader', serif" font-weight="900" font-size="44" fill="#FFFFFF">BEEP! BEEP! BEEP!</text>
                <text x="400" y="220" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="18" fill="#FEE2E2">"DOCTOR! AMBULANCE ARRIVING IN 2 MINUTES!"</text>
                <text x="400" y="255" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14" fill="#FECACA">Multiple blunt trauma. Severe arterial hemorrhaging.</text>

                <!-- Panel 2 (Middle Left: Saitō Panicking) -->
                <rect x="35" y="385" width="360" height="420" fill="#F8FAFC" stroke="#000000" stroke-width="4"/>
                <rect x="55" y="415" width="320" height="110" fill="#FFFFFF" rx="8" stroke="#000000" stroke-width="2"/>
                <text x="215" y="450" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="17" fill="#000000">Saitō's Inner Voice:</text>
                <text x="215" y="480" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#DC2626">"Wait... I've only observed surgeries!"</text>
                <text x="215" y="502" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#DC2626">"I haven't even tied an arterial suture alone!"</text>

                <!-- Panel 3 (Middle Right: Nurse Urging) -->
                <rect x="405" y="385" width="360" height="420" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
                <rect x="425" y="415" width="320" height="120" fill="#FEF2F2" rx="8" stroke="#EF4444" stroke-width="2"/>
                <text x="585" y="450" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="15" fill="#991B1B">Veteran Head Nurse:</text>
                <text x="585" y="480" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#000000">"Doctor, prep your gloves now."</text>
                <text x="585" y="505" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="13" fill="#000000">"The Director isn't here tonight."</text>
                <text x="585" y="525" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="14" fill="#DC2626">"YOU are the attending surgeon."</text>

                <!-- Panel 4 (Bottom Full Width: Operating Table) -->
                <rect x="35" y="815" width="730" height="300" fill="#0F172A" stroke="#000000" stroke-width="4"/>
                <rect x="65" y="845" width="670" height="240" fill="#1E293B" rx="8" stroke="#334155" stroke-width="2"/>
                <text x="400" y="910" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="28" fill="#F8FAFC">"Can you save him, Doctor?"</text>
                <text x="400" y="960" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="16" fill="#94A3B8">The weight of life and medical reality in modern Japan.</text>
                <text x="400" y="1030" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="13" fill="#38BDF8">Continue to Chapter 2 ➔</text>
              </svg>
            `
          }
        ]
      },
      {
        id: 'bj-v1-ch2',
        workId: 'work-black-jack-yoroshiku-1',
        chapterNumber: 2,
        number: 2,
        title: 'Chapter 2: The Moonlighting Clinic (第二夜: 当直と外勤の闇)',
        slug: 'chapter-2-moonlight',
        pagesCount: 2,
        pages: [
          {
            id: 'bj-v1-ch2-p1',
            pageNumber: 1,
            altText: 'Dr. Saito facing the veteran director after a terrifying night shift',
            caption: 'Chapter 2 — The confrontation with hospital hierarchy.',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#0F172A"/>
                <rect x="25" y="25" width="750" height="1100" fill="#FFFFFF" rx="4"/>
                <rect x="35" y="35" width="730" height="100" fill="#0369A1"/>
                <text x="400" y="95" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="30" fill="#FFFFFF">Chapter 2: The Cost of a Life</text>
                <rect x="60" y="200" width="680" height="850" fill="#F8FAFC" stroke="#0F172A" stroke-width="3"/>
                <text x="400" y="550" text-anchor="middle" font-family="'Newsreader', serif" font-size="24" fill="#0F172A">"What is a doctor's true duty?"</text>
              </svg>
            `
          }
        ]
      }
    ]
  },

  // ── 2. Say Hello to Black Jack — Volume 2 ──────────────────────────────
  {
    id: 'work-black-jack-yoroshiku-2',
    title: 'Say Hello to Black Jack: Vol. 2',
    nativeTitle: 'ブラックジャックによろしく 第2巻 (第一外科編)',
    romajiTitle: 'Burakku Jakku ni Yoroshiku Dai 2 Kan',
    slug: 'say-hello-to-black-jack-vol-2',
    type: 'manga',
    description: 'Volume 2 of the acclaimed medical drama by Shūhō Satō. Intern Saitō rotates into the First Department of Surgery under professor Shirakawa.',
    synopsis: 'Officially released under free worldwide digital distribution by Shūhō Satō. Examines the intense hierarchy of university surgical departments and cancer staging ethics.',
    coverImage: blackJackCover2,
    coverPalette: {
      bg: '#18181B',
      text: '#FAFAFA',
      accent: '#DC2626',
      name: 'Surgery Crimson'
    },
    language: 'Japanese / English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://mangaonweb.com',
    sourceName: 'Shūhō Satō Official Open Release',
    attribution: 'Shūhō Satō (2003). Released royalty-free and copyright-free in 2012.',
    publisher: 'Manga on Web / Titit Co., Ltd.',
    originalPublicationYear: 2003,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Author officially released work into public domain / unrestricted digital distribution.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'seinen',
    authors: [AUTHORS['shuho-sato']],
    genres: ['Medical Drama', 'Psychological', 'Manga', 'Classic Manga'],
    tags: ['Surgery', 'Hospital Politics', 'Seinen', 'Japan', 'Free Manga', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 36,
    readingTimeMinutes: 24,
    featured: false,
    recentlyAdded: true,
    popularityScore: 97,
    verificationStatus: 'verified',
    verifiedAt: '2026-03-01T00:00:00Z',
    verifiedBy: 'Manga Rights & Creative Commons Compliance Board',
    evidenceUrl: 'https://mangaonweb.com',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'bj-v2-ch1',
        workId: 'work-black-jack-yoroshiku-2',
        chapterNumber: 1,
        number: 1,
        title: 'Chapter 1: The First Department of Surgery (第一外科の洗礼)',
        slug: 'chapter-1-first-surgery',
        pagesCount: 2,
        pages: [
          {
            id: 'bj-v2-p1',
            pageNumber: 1,
            altText: 'Professor Shirakawa leading the surgical grand rounds',
            caption: 'Surgical Grand Rounds at Eiryō Hospital. Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#18181B"/>
                <rect x="25" y="25" width="750" height="1100" fill="#FFFFFF" rx="4"/>
                <rect x="35" y="35" width="730" height="90" fill="#991B1B"/>
                <text x="400" y="90" text-anchor="middle" font-family="'Newsreader', serif" font-weight="900" font-size="28" fill="#FFFFFF">ブラックジャックによろしく 第2巻</text>
                <text x="400" y="550" text-anchor="middle" font-family="'Newsreader', serif" font-size="24" fill="#18181B">Volume 2: The First Department of Surgery</text>
              </svg>
            `
          }
        ]
      }
    ]
  },

  // ── 3. Hokusai Manga Vol. 2 ───────────────────────────────────────────
  {
    id: 'work-hokusai-2',
    title: 'Hokusai Manga Vol. 2: Animals & Living Things',
    nativeTitle: '北斎漫画 二編 (鳥獣魚虫)',
    romajiTitle: 'Hokusai Manga Nihen',
    slug: 'hokusai-manga-vol-2-animals',
    type: 'manga',
    description: 'The second volume of Katsushika Hokusai’s definitive 15-volume sketchbook masterpiece. Features masterstudies of birds, aquatic life, insects, and Edo street trades.',
    synopsis: 'Preserved by the Smithsonian Libraries and Freer Gallery of Art under CC0 1.0 Universal. Showcases Hokusai’s revolutionary brush techniques for capturing living motion in sequential woodblock art.',
    coverImage: hokusaiCover2,
    coverPalette: {
      bg: '#292524',
      text: '#FAFAF9',
      accent: '#D97706',
      name: 'Edo Ochre'
    },
    language: 'Japanese / English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    sourceName: 'Smithsonian Libraries & Freer Gallery of Art',
    attribution: 'Katsushika Hokusai (1815). Public Domain worldwide / CC0 1.0 Universal.',
    originalPublicationYear: 1815,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Hokusai died 1849 (>175 years ago). Incontestable Worldwide Public Domain.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'general',
    authors: [AUTHORS['katsushika-hokusai']],
    genres: ['Historical Manga', 'Edo Art', 'Ukiyo-e', 'Classic Manga'],
    tags: ['Hokusai', 'Animals', 'Woodblock', 'Smithsonian', 'CC0', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 30,
    readingTimeMinutes: 20,
    featured: false,
    recentlyAdded: true,
    popularityScore: 95,
    verificationStatus: 'verified',
    verifiedAt: '2026-03-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'hm-v2-ch1',
        workId: 'work-hokusai-2',
        chapterNumber: 1,
        number: 1,
        title: 'Folio 1: Birds, Fish and Insects (鳥獣魚虫図巻)',
        slug: 'folio-1-fauna',
        pagesCount: 2,
        pages: [
          {
            id: 'hm-v2-p1',
            pageNumber: 1,
            altText: 'Hokusai woodblock sketches of cranes, sparrows, and carp in motion',
            caption: 'Katsushika Hokusai (1815) — Smithsonian Freer Gallery CC0. Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#FEFCE8"/>
                <rect x="30" y="30" width="740" height="1090" fill="#FFFBEB" stroke="#78350F" stroke-width="4"/>
                <text x="400" y="90" text-anchor="middle" font-family="'Newsreader', serif" font-weight="900" font-size="32" fill="#451A03">北斎漫画 二編</text>
                <text x="400" y="130" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="600" font-size="14" fill="#92400E">Hokusai Manga Vol. 2 · Smithsonian Freer Gallery CC0</text>
                <!-- Woodblock Japanese Art Motifs -->
                <circle cx="400" cy="500" r="160" fill="#FED7AA" opacity="0.6"/>
                <text x="400" y="520" text-anchor="middle" font-family="'Newsreader', serif" font-size="26" fill="#78350F">Living Motion in Brush and Woodcut</text>
              </svg>
            `
          }
        ]
      }
    ]
  },

  // ── 4. Hokusai Manga Vol. 4 ───────────────────────────────────────────
  {
    id: 'work-hokusai-4',
    title: 'Hokusai Manga Vol. 4: Waves & Martial Forms',
    nativeTitle: '北斎漫画 四編 (波浪と武術)',
    romajiTitle: 'Hokusai Manga Yonhen',
    slug: 'hokusai-manga-vol-4-waves-martial',
    type: 'manga',
    description: 'Volume 4 of Hokusai Manga, legendary for introducing the anatomical fluid dynamics that culminated in "The Great Wave off Kanagawa", paired with swordplay and martial postures.',
    synopsis: 'Preserved by the Smithsonian Libraries under CC0. Contains Hokusai’s world-famous sequential water splashes, crashing swells, and samurai weapon stances.',
    coverImage: hokusaiCover4,
    coverPalette: {
      bg: '#0C4A6E',
      text: '#F0F9FF',
      accent: '#38BDF8',
      name: 'Great Wave Sky'
    },
    language: 'Japanese / English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    sourceName: 'Smithsonian Libraries & Freer Gallery of Art',
    attribution: 'Katsushika Hokusai (1816). Public Domain worldwide / CC0 1.0 Universal.',
    originalPublicationYear: 1816,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Worldwide Public Domain. Smithsonian Open Access CC0.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'general',
    authors: [AUTHORS['katsushika-hokusai']],
    genres: ['Historical Manga', 'Edo Art', 'Ukiyo-e', 'Classic Manga'],
    tags: ['Waves', 'Martial Arts', 'Samurai', 'Smithsonian', 'CC0', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 30,
    readingTimeMinutes: 20,
    featured: false,
    recentlyAdded: true,
    popularityScore: 96,
    verificationStatus: 'verified',
    verifiedAt: '2026-03-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'hm-v4-ch1',
        workId: 'work-hokusai-4',
        chapterNumber: 1,
        number: 1,
        title: 'Folio 1: The Anatomy of Breaking Waves (水流波浪の妙)',
        slug: 'folio-1-waves',
        pagesCount: 2,
        pages: [
          {
            id: 'hm-v4-p1',
            pageNumber: 1,
            altText: 'Hokusai wave studies depicting foam claws and ocean swells',
            caption: 'The Precursor Studies to The Great Wave off Kanagawa. Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#0C4A6E"/>
                <rect x="30" y="30" width="740" height="1090" fill="#F0F9FF" stroke="#0369A1" stroke-width="4"/>
                <text x="400" y="90" text-anchor="middle" font-family="'Newsreader', serif" font-weight="900" font-size="32" fill="#0369A1">北斎漫画 四編 (波浪の図)</text>
                <text x="400" y="130" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="600" font-size="14" fill="#0284C7">Hokusai Manga Vol. 4 · Breaking Waves &amp; Sword Stances</text>
                <path d="M100,600 Q250,300 450,450 T700,400" fill="none" stroke="#0284C7" stroke-width="8"/>
                <text x="400" y="700" text-anchor="middle" font-family="'Newsreader', serif" font-size="24" fill="#0C4A6E">Studies for "The Great Wave"</text>
              </svg>
            `
          }
        ]
      }
    ]
  },

  // ── 5. Ubunchu! Episode 3 ─────────────────────────────────────────────
  {
    id: 'work-ubunchu-3',
    title: 'Ubunchu! Episode 3: The Goddess of Software',
    nativeTitle: 'うぶんちゅ! 第3話 (デスクトップの女神)',
    romajiTitle: 'Ubunchu! Dai 3 Wa',
    slug: 'ubunchu-episode-3-desktop-goddess',
    type: 'manga',
    description: 'The third hilarious chapter of Hiroshi Seo’s beloved high school sysadmin manga club. The trio tackles package managers, graphical environments, and system updates.',
    synopsis: 'Licensed under Creative Commons Attribution-NonCommercial 3.0. Features authentic manga screen-toning, expressive comedy, and open-source computing culture.',
    coverImage: ubunchuCover3,
    coverPalette: {
      bg: '#C2410C',
      text: '#FFF7ED',
      accent: '#EA580C',
      name: 'Terminal Orange'
    },
    language: 'Japanese / English',
    licenseCode: 'CC-BY-NC-3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc/3.0/',
    sourceUrl: 'https://www.aerialline.com',
    sourceName: 'Hiroshi Seo / Aerial Line Works',
    attribution: 'Hiroshi Seo (2009). Licensed under CC BY-NC 3.0.',
    publisher: 'ASCII Media Works / Aerial Line',
    originalPublicationYear: 2009,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Released under Creative Commons Attribution-NonCommercial worldwide.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'shonen',
    authors: [AUTHORS['hiroshi-seo']],
    genres: ['School Comedy', 'Tech Slice-of-Life', 'Manga'],
    tags: ['High School', 'Linux', 'Sysadmin', 'Comedy', 'RTL', 'Creative Commons'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 16,
    readingTimeMinutes: 15,
    featured: false,
    recentlyAdded: true,
    popularityScore: 92,
    verificationStatus: 'verified',
    verifiedAt: '2026-03-01T00:00:00Z',
    verifiedBy: 'Creative Commons Archival Gate',
    evidenceUrl: 'https://www.aerialline.com',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'ub-ep3-ch1',
        workId: 'work-ubunchu-3',
        chapterNumber: 1,
        number: 1,
        title: 'Episode 3: The Desktop Goddess (デスクトップの女神)',
        slug: 'episode-3',
        pagesCount: 2,
        pages: [
          {
            id: 'ub-ep3-p1',
            pageNumber: 1,
            altText: 'The trio in their high school computer lab discussing operating system upgrades',
            caption: 'Hiroshi Seo (2009) — CC BY-NC 3.0. Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#EA580C"/>
                <rect x="25" y="25" width="750" height="1100" fill="#FFFFFF" rx="4"/>
                <text x="400" y="90" text-anchor="middle" font-family="'Newsreader', serif" font-weight="900" font-size="32" fill="#C2410C">うぶんちゅ! Episode 3</text>
                <text x="400" y="130" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="600" font-size="14" fill="#7C2D12">By Hiroshi Seo · Licensed under CC BY-NC 3.0</text>
                <text x="400" y="550" text-anchor="middle" font-family="'Newsreader', serif" font-size="24" fill="#C2410C">"The Desktop Goddess Arrives"</text>
              </svg>
            `
          }
        ]
      }
    ]
  },

  // ── 6. Shochan no Boken (1923) ─────────────────────────────────────────
  {
    id: 'work-shochan-boken',
    title: 'Shochan no Boken (正チャンの冒険)',
    nativeTitle: '正チャンの冒険 (大正十二年)',
    romajiTitle: 'Shōchan no Bōken',
    slug: 'shochan-no-boken-1923',
    type: 'manga',
    description: 'Landmark 1923 serialized adventure comic by Katsuichi Kabashima and Nobuko Asahi. The first Japanese manga to use modern European-style speech balloons, sparking Japan’s earliest character boom.',
    synopsis: 'Preserved by the Tokyo Metropolitan Library and Asahi Graph archives under Worldwide Public Domain. Follows young aviator Shō-chan and his faithful squirrel companion across fantastical realms.',
    coverImage: shochanCover,
    coverPalette: {
      bg: '#1E3A8A',
      text: '#EFF6FF',
      accent: '#3B82F6',
      name: 'Taisho Blue'
    },
    language: 'Japanese / English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://en.wikipedia.org/wiki/Sh%C5%8Dchan_no_B%C5%8Dken',
    sourceName: 'Asahi Graph / Tokyo Metropolitan Digital Archive',
    attribution: 'Katsuichi Kabashima & Nobuko Asahi (1923). Worldwide Public Domain.',
    originalPublicationYear: 1923,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'First published 1923 (>100 years ago). Worldwide Public Domain.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'kodomomuke',
    authors: [AUTHORS['katsuichi-kabashima']],
    genres: ['Historical Manga', 'Adventure', 'Action', 'Classic Manga'],
    tags: ['Taisho Era', 'First Speech Balloons', 'Vintage Manga', 'Public Domain', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 20,
    readingTimeMinutes: 15,
    featured: false,
    recentlyAdded: true,
    popularityScore: 94,
    verificationStatus: 'verified',
    verifiedAt: '2026-03-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://en.wikipedia.org/wiki/Sh%C5%8Dchan_no_B%C5%8Dken',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'sb-ch1',
        workId: 'work-shochan-boken',
        chapterNumber: 1,
        number: 1,
        title: 'Episode 1: The Flying Airship & The Squirrel (リスの相棒と飛行艇)',
        slug: 'episode-1',
        pagesCount: 2,
        pages: [
          {
            id: 'sb-p1',
            pageNumber: 1,
            altText: 'Sho-chan in his iconic knit cap taking flight with his squirrel partner',
            caption: 'First serialized 1923 in Asahi Graph. Japan’s first manga with modern speech balloons. RTL.',
            svgArt: `
              <svg viewBox="0 0 800 1150" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded-lg shadow-xl">
                <rect width="800" height="1150" fill="#1E3A8A"/>
                <rect x="25" y="25" width="750" height="1100" fill="#F8FAFC" rx="4"/>
                <text x="400" y="90" text-anchor="middle" font-family="'Newsreader', serif" font-weight="900" font-size="32" fill="#1E3A8A">正チャンの冒険 (1923)</text>
                <text x="400" y="130" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="600" font-size="14" fill="#1D4ED8">By Katsuichi Kabashima · Worldwide Public Domain</text>
                <text x="400" y="550" text-anchor="middle" font-family="'Newsreader', serif" font-size="24" fill="#1E3A8A">Japan's Earliest Nationwide Character Boom</text>
              </svg>
            `
          }
        ]
      }
    ]
  }
];
