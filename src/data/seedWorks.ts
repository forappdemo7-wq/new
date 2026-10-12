import { Work } from '../types';
import { AUTHORS } from './authors';
import { METAMORPHOSIS_CHAPTERS } from './fullTexts/metamorphosis';
import { YELLOW_WALLPAPER_CHAPTERS } from './fullTexts/yellowWallpaper';
import { ALICE_CHAPTERS } from './fullTexts/aliceInWonderland';
import { FRANKENSTEIN_CHAPTERS } from './fullTexts/frankenstein';
import { GREAT_GATSBY_CHAPTERS } from './fullTexts/greatGatsby';
import { NINETEEN_EIGHTY_FOUR_CHAPTERS } from './fullTexts/nineteenEightyFour';
import { PRIDE_AND_PREJUDICE_CHAPTERS } from './fullTexts/prideAndPrejudice';
import { MOBY_DICK_CHAPTERS } from './fullTexts/mobyDick';
import { DRACULA_CHAPTERS } from './fullTexts/dracula';
import { SHERLOCK_HOLMES_CHAPTERS } from './fullTexts/sherlockHolmes';
import { TIME_MACHINE_CHAPTERS } from './fullTexts/timeMachine';
import { TWENTY_THOUSAND_LEAGUES_CHAPTERS } from './fullTexts/twentyThousandLeagues';
import { DORIAN_GRAY_CHAPTERS } from './fullTexts/dorianGray';
import { WAR_OF_THE_WORLDS_CHAPTERS } from './fullTexts/warOfTheWorlds';
import { JEKYLL_AND_HYDE_CHAPTERS } from './fullTexts/jekyllAndHyde';
import { PRINCESS_OF_MARS_CHAPTERS } from './fullTexts/princessOfMars';
import { OPEN_MANGA_WORKS } from './openMangaWorks';
import { INITIAL_COMMUNITY_WORKS } from './communityWorks';

import frankensteinCover from '../assets/images/book_frankenstein_cover_1790759531684.jpg';
import peppercarrotCover from '../assets/images/comic_peppercarrot_cover_1790759548368.jpg';
import aliceCover from '../assets/images/book_alice_wonderland_1790759564032.jpg';
import scifiCover from '../assets/images/comic_scifi_odyssey_1790759577653.jpg';
import kafkaCover from '../assets/images/book_metamorphosis_vintage_1790760925460.jpg';
import hokusaiCover from '../assets/images/manga_hokusai_woodblock_1790760941217.jpg';
import ubunchuCover from '../assets/images/manga_ubunchu_school_club_1790760962313.jpg';
import nemoCover from '../assets/images/comic_little_nemo_slumberland_1790760979508.jpg';
import kaguyaCover from '../assets/images/manga_kaguya_heian_scroll_1790760991586.jpg';
import yellowWallpaperCover from '../assets/images/book_yellow_wallpaper_1790761378893.jpg';
import talesOfCosmosCover from '../assets/images/comic_tales_of_cosmos_1790761391667.jpg';
import tagosakuCover from '../assets/images/manga_tagosaku_rakuten_1790761404363.jpg';

import draculaCover from '../assets/images/dracula_gothic_cover_1790849425104.jpg';
import sherlockCover from '../assets/images/sherlock_detective_cover_1790849444735.jpg';
import leaguesCover from '../assets/images/leagues_submarine_cover_1790849466456.jpg';
import timeMachineCover from '../assets/images/time_machine_cover_1790849482794.jpg';
import dorianGrayCover from '../assets/images/dorian_gray_cover_1790849497795.jpg';
import warOfWorldsCover from '../assets/images/war_of_worlds_cover_1790849513563.jpg';
import jekyllHydeCover from '../assets/images/jekyll_hyde_cover_1790849531557.jpg';
import princessMarsCover from '../assets/images/princess_mars_cover_1790849549941.jpg';
import littleBrotherCover from '../assets/images/little_brother_cover_1790849567116.jpg';
import flatlandCover from '../assets/images/flatland_dimensions_cover_1790849586830.jpg';
import dreamersTomorrowCover from '../assets/images/dreamers_tomorrow_cover_1790849607144.jpg';
import wanderersDustCover from '../assets/images/wanderers_dust_cover_1790849624826.jpg';
import pepperRainbowCover from '../assets/images/pepper_rainbow_cover_1790849649215.jpg';

import hokusaiVol3Cover from '../assets/images/hokusai_vol3_cover_1790850301228.jpg';
import ubunchuEp2Cover from '../assets/images/ubunchu_ep2_cover_1790850324303.jpg';
import mobyDickPaintingCover from '../assets/images/moby_dick_painting_cover_1790850359425.jpg';
import nineteen84DystopianCover from '../assets/images/nineteen84_distopian_cover_1790850382066.jpg';
import gatsbyVintageCover from '../assets/images/great_gatsby_vintage_cover_1790850405905.jpg';
import pridePrejudiceRegencyCover from '../assets/images/pride_prejudice_regency_cover_1790850423526.jpg';
import blackJackCover from '../assets/images/black_jack_manga_cover_1790850446191.jpg';

export const SEED_WORKS: Work[] = [
  ...INITIAL_COMMUNITY_WORKS,
  ...OPEN_MANGA_WORKS,
  // ==========================================
  // MOCKUP FEATURED ROW 1 & 2 (10 Works)
  // ==========================================
  {
    id: 'work-1984',
    title: '1984',
    slug: '1984-george-orwell',
    type: 'book',
    description: 'A dystopian social science fiction novel and cautionary tale warning against totalitarianism, mass surveillance, and repressive regimentation.',
    synopsis: 'Winston Smith struggles against the omnipresent Party and Big Brother in the totalitarian province of Airstrip One.',
    coverImage: nineteen84DystopianCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://gutenberg.net.au/ebooks01/0100021.txt',
    sourceName: 'Project Gutenberg (Worldwide PD)',
    attribution: 'George Orwell (1949). Public domain in countries where copyright is life + 70 or life + 50.',
    originalPublicationYear: 1949,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'George Orwell died 1950 (>70 years ago).',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['george-orwell']],
    genres: ['Sci-Fi', 'Classics', 'Dystopian'],
    tags: ['Dystopia', 'Classics', 'Surveillance'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 88900,
    pageCount: 328,
    readingTimeMinutes: 340,
    featured: true,
    recentlyAdded: true,
    popularityScore: 99,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://gutenberg.net.au/ebooks01/0100021.txt',
    createdAt: '2026-03-10T12:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    chapters: NINETEEN_EIGHTY_FOUR_CHAPTERS
  },
  {
    id: 'work-gatsby',
    title: 'The Great Gatsby',
    slug: 'the-great-gatsby',
    type: 'book',
    description: 'Set in the Jazz Age on Long Island, the novel depicts narrator Nick Carraway’s interactions with mysterious millionaire Jay Gatsby and his obsession to reunite with Daisy Buchanan.',
    synopsis: 'F. Scott Fitzgerald’s 1925 masterpiece explores themes of decadence, idealism, social upheaval, and the disillusionment of the American Dream.',
    coverImage: gatsbyVintageCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/64317',
    sourceName: 'Project Gutenberg',
    attribution: 'F. Scott Fitzgerald (1925). Public Domain worldwide (Pre-1929 US, Author died 1940).',
    originalPublicationYear: 1925,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Entered public domain on January 1, 2021.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['f-scott-fitzgerald']],
    genres: ['Classics', 'Romance', 'Literary Fiction'],
    tags: ['Jazz Age', 'Tragedy', 'American Classics'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 47094,
    pageCount: 180,
    readingTimeMinutes: 190,
    featured: true,
    recentlyAdded: true,
    popularityScore: 98,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/64317',
    createdAt: '2026-03-10T11:00:00Z',
    updatedAt: '2026-03-10T11:00:00Z',
    chapters: GREAT_GATSBY_CHAPTERS
  },
  {
    id: 'work-dracula',
    title: 'Dracula',
    slug: 'dracula-bram-stoker',
    type: 'book',
    description: 'Jonathan Harker travels to the mysterious Carpathian Castle Dracula, uncovering an ancient vampiric evil that threatens London.',
    synopsis: 'Bram Stoker’s 1897 epistolary gothic masterpiece defining vampire literature through diaries, letters, telegraphs, and ship logs.',
    coverImage: draculaCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/345',
    sourceName: 'Project Gutenberg',
    attribution: 'Bram Stoker (1897). Public Domain worldwide.',
    originalPublicationYear: 1897,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Bram Stoker died 1912 (>110 years ago). Worldwide public domain.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['bram-stoker']],
    genres: ['Gothic Fiction', 'Horror', 'Classics'],
    tags: ['Vampires', 'Gothic', 'Transylvania', 'Epistolary'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 164000,
    pageCount: 418,
    readingTimeMinutes: 520,
    featured: true,
    recentlyAdded: true,
    popularityScore: 98,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/345',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
    chapters: DRACULA_CHAPTERS
  },
  {
    id: 'work-sherlock-holmes',
    title: 'The Adventures of Sherlock Holmes',
    slug: 'the-adventures-of-sherlock-holmes',
    type: 'book',
    description: 'The world’s most famous consulting detective, Sherlock Holmes, and Dr. John H. Watson unravel twelve baffling Victorian mysteries.',
    synopsis: 'Sir Arthur Conan Doyle’s quintessential detective fiction collection published in The Strand Magazine between 1891 and 1892.',
    coverImage: sherlockCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1661',
    sourceName: 'Project Gutenberg',
    attribution: 'Arthur Conan Doyle (1892). Public Domain worldwide.',
    originalPublicationYear: 1892,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Arthur Conan Doyle died 1930 (>90 years ago). Free worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['arthur-conan-doyle']],
    genres: ['Mystery', 'Classics', 'Detective'],
    tags: ['Sherlock Holmes', 'Baker Street', 'Victorian', 'Deduction'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 104000,
    pageCount: 307,
    readingTimeMinutes: 340,
    featured: true,
    recentlyAdded: true,
    popularityScore: 99,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/1661',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z',
    chapters: SHERLOCK_HOLMES_CHAPTERS
  },
  {
    id: 'work-pride-prejudice',
    title: 'Pride and Prejudice',
    slug: 'pride-and-prejudice-jane-austen',
    type: 'book',
    description: 'The romantic clash between the opinionated Elizabeth Bennet and her proud aristocratic suitor, Mr. Fitzwilliam Darcy.',
    synopsis: 'Jane Austen’s beloved 1813 comedy of manners examining the friction between hasty judgments and genuine character in Regency England.',
    coverImage: pridePrejudiceRegencyCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1342',
    sourceName: 'Project Gutenberg',
    attribution: 'Jane Austen (1813). Public Domain worldwide.',
    originalPublicationYear: 1813,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Jane Austen died 1817 (>200 years ago). Free worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'shojo',
    authors: [AUTHORS['jane-austen']],
    genres: ['Romance', 'Classics', 'Literary Fiction'],
    tags: ['Regency', 'Romance', 'Satire', 'Classics'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 122000,
    pageCount: 380,
    readingTimeMinutes: 440,
    featured: true,
    recentlyAdded: true,
    popularityScore: 97,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/1342',
    createdAt: '2026-03-10T07:00:00Z',
    updatedAt: '2026-03-10T07:00:00Z',
    chapters: PRIDE_AND_PREJUDICE_CHAPTERS
  },
  {
    id: 'work-twenty-thousand-leagues',
    title: 'Twenty Thousand Leagues Under the Sea',
    slug: 'twenty-thousand-leagues-under-the-sea',
    type: 'book',
    description: 'Professor Aronnax, Conseil, and Ned Land embark on the futuristic submarine Nautilus under the command of the enigmatic Captain Nemo.',
    synopsis: 'Jules Verne’s 1870 pioneer sci-fi voyage traversing the world’s oceans, the lost city of Atlantis, and the South Pole.',
    coverImage: leaguesCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/164',
    sourceName: 'Project Gutenberg',
    attribution: 'Jules Verne (1870). Public Domain worldwide.',
    originalPublicationYear: 1870,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Jules Verne died 1905 (>120 years ago). Worldwide public domain.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['jules-verne']],
    genres: ['Science Fiction', 'Adventure', 'Classics'],
    tags: ['Submarine', 'Captain Nemo', 'Ocean', 'Sci-Fi Pioneer'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 130000,
    pageCount: 375,
    readingTimeMinutes: 420,
    featured: true,
    recentlyAdded: true,
    popularityScore: 98,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/164',
    createdAt: '2026-03-10T06:00:00Z',
    updatedAt: '2026-03-10T06:00:00Z',
    chapters: TWENTY_THOUSAND_LEAGUES_CHAPTERS
  },
  {
    id: 'work-time-machine',
    title: 'The Time Machine',
    slug: 'the-time-machine-hg-wells',
    type: 'book',
    description: 'A Victorian scientist invents a device to journey into the distant future, discovering the gentle Eloi and subterranean Morlocks in the year 802,701 AD.',
    synopsis: 'H.G. Wells’s seminal 1895 novella that popularized the concept of time travel through intentional mechanical technology.',
    coverImage: timeMachineCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/35',
    sourceName: 'Project Gutenberg',
    attribution: 'H.G. Wells (1895). Public Domain worldwide.',
    originalPublicationYear: 1895,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'H.G. Wells died 1946 (>75 years ago). Free worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['hg-wells']],
    genres: ['Science Fiction', 'Dystopian', 'Classics'],
    tags: ['Time Travel', 'Eloi', 'Morlocks', 'Sci-Fi Classic'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 32400,
    pageCount: 118,
    readingTimeMinutes: 130,
    featured: true,
    recentlyAdded: true,
    popularityScore: 99,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/35',
    createdAt: '2026-03-10T05:00:00Z',
    updatedAt: '2026-03-10T05:00:00Z',
    chapters: TIME_MACHINE_CHAPTERS
  },
  {
    id: 'work-dorian-gray',
    title: 'The Picture of Dorian Gray',
    slug: 'the-picture-of-dorian-gray',
    type: 'book',
    description: 'A handsome young man sells his soul so that his portrait ages and absorbs his sins while he remains perpetually young.',
    synopsis: 'Oscar Wilde’s only novel, first published in 1890, exploring aestheticism, hedonism, moral duplicity, and the dark cost of eternal youth.',
    coverImage: dorianGrayCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/174',
    sourceName: 'Project Gutenberg',
    attribution: 'Oscar Wilde (1890). Public Domain worldwide.',
    originalPublicationYear: 1890,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Oscar Wilde died 1900 (>120 years ago). Worldwide public domain.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['oscar-wilde']],
    genres: ['Gothic Fiction', 'Philosophical', 'Classics'],
    tags: ['Aestheticism', 'Gothic', 'Portrait', 'Victorian London'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 78000,
    pageCount: 254,
    readingTimeMinutes: 290,
    featured: true,
    recentlyAdded: true,
    popularityScore: 97,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/174',
    createdAt: '2026-03-10T04:00:00Z',
    updatedAt: '2026-03-10T04:00:00Z',
    chapters: DORIAN_GRAY_CHAPTERS
  },
  {
    id: 'work-war-of-the-worlds',
    title: 'The War of the Worlds',
    slug: 'the-war-of-the-worlds-hg-wells',
    type: 'book',
    description: 'Martians invade southern England with towering three-legged fighting machines, heat-rays, and poisonous black smoke.',
    synopsis: 'H.G. Wells’s 1898 pioneering extraterrestrial invasion masterpiece, exploring survival, human fragility, and interstellar conflict.',
    coverImage: warOfWorldsCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/36',
    sourceName: 'Project Gutenberg',
    attribution: 'H.G. Wells (1898). Public Domain worldwide.',
    originalPublicationYear: 1898,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'H.G. Wells died 1946. Worldwide public domain.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['hg-wells']],
    genres: ['Science Fiction', 'Invasion', 'Classics'],
    tags: ['Martians', 'Alien Invasion', 'Tripods', 'Sci-Fi Pioneer'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 60000,
    pageCount: 220,
    readingTimeMinutes: 240,
    featured: true,
    recentlyAdded: true,
    popularityScore: 98,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/36',
    createdAt: '2026-03-10T03:30:00Z',
    updatedAt: '2026-03-10T03:30:00Z',
    chapters: WAR_OF_THE_WORLDS_CHAPTERS
  },
  {
    id: 'work-jekyll-hyde',
    title: 'Strange Case of Dr. Jekyll and Mr. Hyde',
    slug: 'dr-jekyll-and-mr-hyde',
    type: 'book',
    description: 'A respected London doctor concocts a potion that separates human nature into good and an uninhibited, murderous evil persona.',
    synopsis: 'Robert Louis Stevenson’s 1886 gothic novella exploring the dual nature of man and Victorian respectability.',
    coverImage: jekyllHydeCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/43',
    sourceName: 'Project Gutenberg',
    attribution: 'Robert Louis Stevenson (1886). Public Domain worldwide.',
    originalPublicationYear: 1886,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Robert Louis Stevenson died 1894. Worldwide public domain.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['robert-louis-stevenson']],
    genres: ['Gothic Fiction', 'Psychological', 'Classics'],
    tags: ['Duality', 'Victorian Gothic', 'Mystery', 'Transformation'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 26000,
    pageCount: 96,
    readingTimeMinutes: 110,
    featured: false,
    recentlyAdded: true,
    popularityScore: 97,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/43',
    createdAt: '2026-03-10T03:00:00Z',
    updatedAt: '2026-03-10T03:00:00Z',
    chapters: JEKYLL_AND_HYDE_CHAPTERS
  },
  {
    id: 'work-princess-of-mars',
    title: 'A Princess of Mars',
    slug: 'a-princess-of-mars-edgar-rice-burroughs',
    type: 'book',
    description: 'American Civil War veteran John Carter is mysteriously transported to Mars (Barsoom), where he encounters green Tharks and falls for princess Dejah Thoris.',
    synopsis: 'Edgar Rice Burroughs’s 1912 seminal planetary romance and sword-and-planet epic that inspired modern space fantasy.',
    coverImage: princessMarsCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/62',
    sourceName: 'Project Gutenberg',
    attribution: 'Edgar Rice Burroughs (1912). Public Domain worldwide.',
    originalPublicationYear: 1912,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Edgar Rice Burroughs died 1950 (>70 years ago). Free worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'shonen',
    authors: [AUTHORS['edgar-rice-burroughs']],
    genres: ['Science Fiction', 'Adventure', 'Fantasy'],
    tags: ['Barsoom', 'John Carter', 'Planetary Romance', 'Mars'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 68000,
    pageCount: 236,
    readingTimeMinutes: 260,
    featured: false,
    recentlyAdded: true,
    popularityScore: 96,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/62',
    createdAt: '2026-03-10T02:00:00Z',
    updatedAt: '2026-03-10T02:00:00Z',
    chapters: PRINCESS_OF_MARS_CHAPTERS
  },
  {
    id: 'work-moby-dick',
    title: 'Moby-Dick',
    slug: 'moby-dick-herman-melville',
    type: 'book',
    description: 'Sailor Ishmael narrates the monomaniacal quest of Ahab, captain of the whaling ship Pequod, for revenge against the giant albino sperm whale Moby Dick.',
    synopsis: 'Herman Melville’s 1851 masterpiece of world literature exploring fate, obsession, epistemology, and the terrifying majesty of nature.',
    coverImage: mobyDickPaintingCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/2701',
    sourceName: 'Project Gutenberg',
    attribution: 'Herman Melville (1851). Public Domain worldwide.',
    originalPublicationYear: 1851,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Herman Melville died 1891 (>130 years ago). Free worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['herman-melville']],
    genres: ['Adventure', 'Classics', 'Literary Fiction'],
    tags: ['Whaling', 'Obsession', 'Sea Tale'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 206000,
    pageCount: 635,
    readingTimeMinutes: 750,
    featured: true,
    recentlyAdded: true,
    popularityScore: 96,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-01T00:00:00Z',
    verifiedBy: 'Archival Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/2701',
    createdAt: '2026-03-10T03:00:00Z',
    updatedAt: '2026-03-10T03:00:00Z',
    chapters: MOBY_DICK_CHAPTERS
  },
  // ==========================================
  // SECTION 1: BOOKS (Original Titles)
  // ==========================================
  {
    id: 'work-frankenstein',
    title: 'Frankenstein; or, The Modern Prometheus',
    slug: 'frankenstein-modern-prometheus',
    type: 'book',
    description: 'The foundational masterpiece of gothic science fiction. Victor Frankenstein infuses life into an artificial creature assembled from stolen human remains.',
    synopsis: 'First published anonymously in 1818, Mary Shelley’s timeless novel confronts the consequences of unchecked hubris. Narrated through letters from Arctic explorer Robert Walton and Frankenstein’s own harrowing confession.',
    coverImage: frankensteinCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/84',
    sourceName: 'Project Gutenberg',
    attribution: 'Mary Wollstonecraft Shelley (1818). Public Domain worldwide (Author life + 70 and US Pre-1929).',
    originalPublicationYear: 1818,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Mary Shelley died 1851 (>170 years ago). Free from copyright restrictions worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['mary-shelley']],
    genres: ['Gothic Fiction', 'Science Fiction', 'Classic Literature'],
    tags: ['Gothic', 'Classics', 'Sci-Fi Pioneer', 'Philosophical'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 75400,
    pageCount: 280,
    readingTimeMinutes: 310,
    featured: true,
    recentlyAdded: false,
    popularityScore: 98,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-10T14:30:00Z',
    verifiedBy: 'Chief Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/84',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: FRANKENSTEIN_CHAPTERS
  },
  {
    id: 'work-alice',
    title: "Alice's Adventures in Wonderland",
    slug: 'alices-adventures-in-wonderland',
    type: 'book',
    description: 'The premier classic of literary nonsense. A curious young girl falls down a rabbit hole into a subterranean realm of tea-drinking eccentrics and playing-card monarchs.',
    synopsis: 'Published in 1865, Lewis Carroll’s masterpiece revolutionized literature by prioritizing linguistic wit, imagination, and dream logic over Victorian moralizing.',
    coverImage: aliceCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/11',
    sourceName: 'Project Gutenberg',
    attribution: 'Lewis Carroll (1865). Public Domain worldwide.',
    originalPublicationYear: 1865,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Lewis Carroll died 1898. Free from copyright restrictions worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'kodomomuke',
    authors: [AUTHORS['lewis-carroll']],
    genres: ['Fantasy', 'Literary Nonsense', "Children's Literature"],
    tags: ['Nonsense', 'Whimsical', 'Dream Logic', 'Classics'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 26800,
    pageCount: 160,
    readingTimeMinutes: 140,
    featured: true,
    recentlyAdded: false,
    popularityScore: 96,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-12T11:00:00Z',
    verifiedBy: 'Chief Compliance Registrar',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/11',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: ALICE_CHAPTERS
  },
  {
    id: 'work-metamorphosis',
    title: 'The Metamorphosis',
    slug: 'the-metamorphosis',
    type: 'book',
    description: 'Gregor Samsa awakens one morning from troubled dreams to find himself transformed in his bed into a monstrous insect.',
    synopsis: 'First published in 1915 in German as Die Verwandlung, Franz Kafka’s novella stands as one of the quintessential works of modern literature exploring alienation and social pressure.',
    coverImage: kafkaCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/5200',
    sourceName: 'Project Gutenberg',
    attribution: 'Franz Kafka (1915). English translation public domain worldwide.',
    originalPublicationYear: 1915,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Franz Kafka passed away 1924 (>100 years). Safe worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['franz-kafka']],
    genres: ['Absurdist Fiction', 'Existentialism', 'Novella'],
    tags: ['Absurdism', 'Psychological', 'Metamorphosis'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 21800,
    pageCount: 110,
    readingTimeMinutes: 105,
    featured: false,
    recentlyAdded: true,
    popularityScore: 92,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-15T09:15:00Z',
    verifiedBy: 'Curatorial Verification Officer',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/5200',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: METAMORPHOSIS_CHAPTERS
  },
  {
    id: 'work-yellow-wallpaper',
    title: 'The Yellow Wallpaper',
    slug: 'the-yellow-wallpaper',
    type: 'book',
    description: 'A psychological tour de force examining postpartum depression and female autonomy in Victorian medicine.',
    synopsis: 'Published in 1892, Charlotte Perkins Gilman’s semi-autobiographical journal chronicles a confined narrator who perceives an imprisoned woman behind the nursery’s yellow wallpaper.',
    coverImage: yellowWallpaperCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1952',
    sourceName: 'Project Gutenberg',
    attribution: 'Charlotte Perkins Gilman (1892). Public Domain worldwide.',
    originalPublicationYear: 1892,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Charlotte Perkins Gilman died 1935 (>90 years ago). Worldwide public domain.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['charlotte-perkins-gilman']],
    genres: ['Psychological Fiction', 'Gothic Horror', 'Short Stories'],
    tags: ['Psychological', '19th Century', 'American Classics'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 6200,
    pageCount: 42,
    readingTimeMinutes: 35,
    featured: false,
    recentlyAdded: true,
    popularityScore: 91,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-18T16:20:00Z',
    verifiedBy: 'Curatorial Verification Officer',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/1952',
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: YELLOW_WALLPAPER_CHAPTERS
  },
  {
    id: 'work-little-brother',
    title: 'Little Brother',
    slug: 'little-brother',
    type: 'book',
    description: 'A bestselling techno-thriller celebrating digital rights, mesh networks, and civil liberties in a surveillance state.',
    synopsis: 'Published by Tor Books and simultaneously released under Creative Commons by Cory Doctorow. Seventeen-year-old hacker Marcus Yallow uses open cryptography to challenge totalitarian overreach.',
    coverImage: littleBrotherCover,
    language: 'English',
    licenseCode: 'CC-BY-NC-SA-3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
    sourceUrl: 'https://craphound.com/littlebrother/download/',
    sourceName: 'Craphound (Author Portal)',
    attribution: 'Cory Doctorow (2008). Licensed under Creative Commons Attribution-NonCommercial-ShareAlike 3.0.',
    originalPublicationYear: 2008,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Author granted explicit worldwide non-commercial redistribution rights under CC BY-NC-SA 3.0.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'shonen',
    authors: [AUTHORS['cory-doctorow']],
    genres: ['Cyberpunk', 'Techno-Thriller', 'Science Fiction'],
    tags: ['Open Culture', 'Cryptography', 'Hacking', 'Surveillance'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 114000,
    pageCount: 380,
    readingTimeMinutes: 440,
    featured: true,
    recentlyAdded: false,
    popularityScore: 97,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-20T10:45:00Z',
    verifiedBy: 'Senior Licensing Auditor',
    evidenceUrl: 'https://craphound.com/littlebrother/download/',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'lb-ch-1',
        workId: 'work-little-brother',
        chapterNumber: 1,
        number: 1,
        title: 'Chapter 1: The Gait Recognition Bypass',
        slug: 'chapter-1',
        wordCount: 3400,
        content: `I’m a senior at Cesar Chavez High School in San Francisco’s sunny Mission District, and that makes me one of the most surveilled people in the world. My name is Marcus Yallow, but back when this story starts, I went by w1n5t0n. Pronounced “Winston.”\n\nThe hallway cameras were the newest thing. The school board had spent millions on a system called “FAST” (Focus on Academic and Student Tracking). It tracked us everywhere: hall passes, attendance, our gait as we walked between classrooms.\n\nI had a pebble in my right shoe. It sounds stupid, but gait recognition relies on the rhythm of your stride. A small pebble in your right shoe makes you limp just slightly. The algorithm gets confused; it calculates an error rate of 42% and flags the record for manual review.`
      }
    ]
  },
  {
    id: 'work-flatland',
    title: 'Flatland: A Romance of Many Dimensions',
    slug: 'flatland-romance-of-many-dimensions',
    type: 'book',
    description: 'An ingenious mathematical satire exploring higher spatial dimensions and rigid social hierarchies through a planar universe.',
    synopsis: 'Published in 1884 by Edwin A. Abbott, this allegory serves simultaneously as an accessible introduction to geometry and a sharp critique of Victorian dogma.',
    coverImage: flatlandCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://standardebooks.org/ebooks/edwin-a-abbott/flatland',
    sourceName: 'Standard Ebooks / Project Gutenberg',
    attribution: 'Edwin A. Abbott (1884). Public Domain worldwide.',
    originalPublicationYear: 1884,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Edwin Abbott died 1926 (>95 years ago). Worldwide public domain.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'general',
    authors: [AUTHORS['edwin-abbott']],
    genres: ['Mathematical Fiction', 'Satire', 'Science Fiction'],
    tags: ['Dimensions', 'Geometry', 'Satire', 'Victorian'],
    fileFormat: 'html',
    status: 'completed',
    wordCount: 34500,
    pageCount: 140,
    readingTimeMinutes: 160,
    featured: false,
    recentlyAdded: true,
    popularityScore: 89,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-22T13:10:00Z',
    verifiedBy: 'Curatorial Verification Officer',
    evidenceUrl: 'https://standardebooks.org/ebooks/edwin-a-abbott/flatland',
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'flat-ch-1',
        workId: 'work-flatland',
        chapterNumber: 1,
        number: 1,
        title: 'Section 1: Of the Nature of Flatland',
        slug: 'nature-of-flatland',
        wordCount: 2800,
        content: `I call our world Flatland, not because we call it so, but to make its nature clearer to you, my happy readers, who are privileged to live in Space.\n\nImagine a vast sheet of paper on which straight Lines, Triangles, Squares, Pentagons, Hexagons, and other figures, instead of remaining fixed in their places, move freely about, on or in the surface, but without the power of rising above or sinking below it.`
      }
    ]
  },

  // ==========================================
  // SECTION 2: COMICS & SEQUENTIAL ART (6 Titles)
  // ==========================================
  {
    id: 'work-peppercarrot-1',
    title: 'Pepper & Carrot: The Potion Contest',
    slug: 'peppercarrot-the-potion-contest',
    type: 'comic',
    description: 'The world-famous open webcomic by David Revoy. Young witch Pepper and her cat Carrot enter the grand annual potion competition of Komona.',
    synopsis: 'Crafted entirely with free and open-source software (Krita) and released under CC BY 4.0. Anyone can read, translate, and print this beloved comic.',
    coverImage: peppercarrotCover,
    language: 'English',
    licenseCode: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://www.peppercarrot.com/en/article271/episode-1-potion-contest',
    sourceName: 'Pepper & Carrot Official',
    attribution: 'David Revoy (peppercarrot.com). Licensed under Creative Commons Attribution 4.0 International.',
    originalPublicationYear: 2014,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Worldwide Creative Commons Attribution 4.0 license grant.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'kodomomuke',
    authors: [AUTHORS['david-revoy']],
    genres: ['Fantasy', 'Comedy', 'All Ages', 'Webcomic'],
    tags: ['Open Source Art', 'Krita', 'Whimsical', 'CC BY 4.0'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 8,
    readingTimeMinutes: 10,
    featured: true,
    recentlyAdded: false,
    popularityScore: 99,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-25T15:00:00Z',
    verifiedBy: 'Lead Open Culture Counsel',
    evidenceUrl: 'https://www.peppercarrot.com/en/article271/episode-1-potion-contest',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'pc1-ch-1',
        workId: 'work-peppercarrot-1',
        chapterNumber: 1,
        number: 1,
        title: 'Episode 1: The Potion Contest',
        slug: 'episode-1',
        pagesCount: 3,
        pages: [
          {
            id: 'pc1-p1',
            pageNumber: 1,
            altText: 'Pepper and Carrot entering the potion arena in Komona',
            caption: 'Page 1 — The Grand Arena of Komona. Thousands gather for the annual tournament.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#F8FAFC"/>
                <rect x="30" y="30" width="740" height="320" rx="8" fill="#38BDF8" stroke="#1E293B" stroke-width="4"/>
                <polygon points="120,350 200,180 280,350" fill="#7DD3FC" opacity="0.6"/>
                <text x="400" y="80" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="bold" font-size="28" fill="#0F172A">THE KOMONA POTION CONTEST</text>
                <rect x="30" y="380" width="355" height="340" rx="8" fill="#FEF3C7" stroke="#1E293B" stroke-width="4"/>
                <circle cx="160" cy="580" r="45" fill="#EA580C"/>
                <text x="210" y="455" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14" font-weight="600" fill="#1E293B">"Mrrow! (Are you ready?)"</text>
                <rect x="415" y="380" width="355" height="340" rx="8" fill="#F0FDF4" stroke="#1E293B" stroke-width="4"/>
                <ellipse cx="590" cy="580" rx="70" ry="22" fill="#22C55E"/>
                <text x="590" y="450" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="18" fill="#166534">"Bubble, swirl, and glow..."</text>
                <rect x="30" y="750" width="740" height="320" rx="8" fill="#ECFDF5" stroke="#1E293B" stroke-width="4"/>
                <text x="400" y="870" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="bold" font-size="34" fill="#065F46">F Z Z Z Z T !</text>
              </svg>
            `
          },
          {
            id: 'pc1-p2',
            pageNumber: 2,
            altText: 'The unexpected colorful levitation of the potion stage',
            caption: 'Page 2 — The concoction floats into the clouds as the judges cheer.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#FFFBEB"/>
                <rect x="30" y="30" width="740" height="500" rx="8" fill="#FEF08A" stroke="#1E293B" stroke-width="4"/>
                <text x="400" y="240" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="bold" font-size="44" fill="#B45309">BOOOOOOM!</text>
                <rect x="30" y="560" width="740" height="500" rx="8" fill="#F3E8FF" stroke="#1E293B" stroke-width="4"/>
                <text x="400" y="730" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="32" fill="#581C87">FIRST PRIZE WINNER!</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-peppercarrot-2',
    title: 'Pepper & Carrot: Rainbow Potion',
    slug: 'peppercarrot-rainbow-potion',
    type: 'comic',
    description: 'Carrot knocks over an alchemical elixir, setting off a multi-colored prismatic spell across the forest of Squirrel’s End.',
    synopsis: 'A hilarious sequel from David Revoy released under CC BY 4.0, proving that open culture produces visual storytelling of the highest caliber.',
    coverImage: pepperRainbowCover,
    language: 'English',
    licenseCode: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://www.peppercarrot.com/en/article273/episode-2-rainbow-potions',
    sourceName: 'Pepper & Carrot Official',
    attribution: 'David Revoy (peppercarrot.com). Licensed under CC BY 4.0.',
    originalPublicationYear: 2014,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Worldwide Creative Commons Attribution 4.0 license grant.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'kodomomuke',
    authors: [AUTHORS['david-revoy']],
    genres: ['Fantasy', 'Comedy', 'Webcomic'],
    tags: ['Open Source', 'Webcomic', 'Humor', 'CC BY 4.0'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 6,
    readingTimeMinutes: 8,
    featured: false,
    recentlyAdded: true,
    popularityScore: 94,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-25T15:30:00Z',
    verifiedBy: 'Lead Open Culture Counsel',
    evidenceUrl: 'https://www.peppercarrot.com/en/article273/episode-2-rainbow-potions',
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'pc2-ch-1',
        workId: 'work-peppercarrot-2',
        chapterNumber: 1,
        number: 1,
        title: 'Episode 2: Rainbow Potion',
        slug: 'episode-2',
        pagesCount: 1,
        pages: [
          {
            id: 'pc2-p1',
            pageNumber: 1,
            altText: 'Pepper measuring prismatic drops into a crystal vial',
            caption: 'Page 1 — Squirrel’s End cottage. A delicate formula requires total concentration.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#F8FAFC"/>
                <rect x="30" y="30" width="740" height="480" rx="8" fill="#F1F5F9" stroke="#0F172A" stroke-width="4"/>
                <text x="400" y="80" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="bold" font-size="28" fill="#0F172A">RAINBOW EXPERIMENT</text>
                <rect x="30" y="540" width="740" height="530" rx="8" fill="#FDF2F8" stroke="#0F172A" stroke-width="4"/>
                <text x="400" y="760" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="bold" font-size="36" fill="#BE185D">*CLATTER!*</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-tales-cosmos',
    title: 'Tales of the Cosmos: The Signal',
    slug: 'tales-of-the-cosmos-the-signal',
    type: 'comic',
    description: 'A deep-space hard sci-fi graphic story. On a silent research station orbiting Saturn’s moon Enceladus, exobiologists intercept a mysterious mathematical sequence.',
    synopsis: 'Created by an international collective of artists and science educators, released under Creative Commons Attribution-ShareAlike 4.0.',
    coverImage: talesOfCosmosCover,
    language: 'English',
    licenseCode: 'CC-BY-SA-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://creativecommons.org',
    sourceName: 'Project Stellar Archive',
    attribution: 'Open Art Collective & Project Stellar. CC BY-SA 4.0 International.',
    originalPublicationYear: 2022,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Worldwide Creative Commons Attribution-ShareAlike 4.0 license grant.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'seinen',
    authors: [AUTHORS['open-art-collective']],
    genres: ['Science Fiction', 'Space Opera', 'Graphic Novel'],
    tags: ['Hard Sci-Fi', 'Astronomy', 'Space Exploration'],
    fileFormat: 'images',
    status: 'ongoing',
    pageCount: 16,
    readingTimeMinutes: 20,
    featured: true,
    recentlyAdded: false,
    popularityScore: 95,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-01T11:20:00Z',
    verifiedBy: 'Senior Licensing Auditor',
    evidenceUrl: 'https://creativecommons.org',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'tc-ch-1',
        workId: 'work-tales-cosmos',
        chapterNumber: 1,
        number: 1,
        title: 'Issue 1: Subsurface Contact',
        slug: 'issue-1',
        pagesCount: 1,
        pages: [
          {
            id: 'tc-p1',
            pageNumber: 1,
            altText: 'Orbiting Enceladus station with Saturn’s rings glowing in the void',
            caption: 'Page 1 — Station Cassini-IV. Sector 9. Orbiting Enceladus at 12,000 km.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#020617"/>
                <circle cx="620" cy="200" r="120" fill="#FDE68A" opacity="0.9"/>
                <ellipse cx="620" cy="200" rx="280" ry="25" fill="none" stroke="#FBBF24" stroke-width="12" opacity="0.7" transform="rotate(-20 620 200)"/>
                <text x="400" y="945" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-weight="bold" font-size="20" fill="#38BDF8">PATTERN REPEATS: PRIME NUMBERS</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-little-nemo',
    title: 'Little Nemo in Slumberland: The Walking Bed',
    slug: 'little-nemo-walking-bed',
    type: 'comic',
    description: 'Winsor McCay’s groundbreaking art nouveau comic strip. Little Nemo’s brass bed sprouts elongated legs, galloping over the moonlit rooftops of early 20th-century New York.',
    synopsis: 'Originally serialized in the New York Herald in 1908, Winsor McCay revolutionized visual pacing, perspective distortion, and surreal fantasy in sequential art.',
    coverImage: nemoCover,
    language: 'English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://comicbookplus.com/?dlid=16200',
    sourceName: 'Comic Book Plus Archive',
    attribution: 'Winsor McCay (1908). Public Domain in the US and worldwide.',
    originalPublicationYear: 1908,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Winsor McCay died 1934 (>90 years ago). Published 1908. Free worldwide.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'kodomomuke',
    authors: [AUTHORS['winsor-mccay']],
    genres: ['Historical Comics', 'Surrealism', 'Fantasy'],
    tags: ['Art Nouveau', 'Pioneering Comics', 'Public Domain Heritage'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 12,
    readingTimeMinutes: 15,
    featured: false,
    recentlyAdded: true,
    popularityScore: 90,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-05T14:40:00Z',
    verifiedBy: 'Curatorial Verification Officer',
    evidenceUrl: 'https://comicbookplus.com/?dlid=16200',
    createdAt: '2026-02-12T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'nemo-ch-1',
        workId: 'work-little-nemo',
        chapterNumber: 1,
        number: 1,
        title: 'Full Strip: The Walking Bed',
        slug: 'the-walking-bed',
        pagesCount: 1,
        pages: [
          {
            id: 'nemo-p1',
            pageNumber: 1,
            altText: 'The bed begins to stretch its brass posts and walk across the city roofs',
            caption: 'Winsor McCay, July 26, 1908 — Little Nemo discovers his bed has grown four long legs.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#FEFCE8"/>
                <text x="400" y="60" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="bold" font-size="28" fill="#713F12">LITTLE NEMO IN SLUMBERLAND</text>
                <rect x="40" y="410" width="720" height="640" rx="4" fill="#0C4A6E" stroke="#713F12" stroke-width="4"/>
                <text x="400" y="880" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="22" fill="#F0F9FF">"HOLD ON TIGHT, LITTLE NEMO!"</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-dreamers-tomorrow',
    title: 'The Dreamers of Tomorrow',
    slug: 'the-dreamers-of-tomorrow',
    type: 'comic',
    description: 'An uplifting solar-punk webcomic following apprentice botanist Mei Lin restoring historic rainwater cisterns and vertical rooftop canopies.',
    synopsis: 'Created by Nina Chen and released under Creative Commons Attribution 4.0. Marries botanical illustration with hopeful community building.',
    coverImage: dreamersTomorrowCover,
    language: 'English',
    licenseCode: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://opencomics.org/dreamers-tomorrow',
    sourceName: 'Open Comics Federation',
    attribution: 'Nina Chen (2023). Licensed under Creative Commons Attribution 4.0 International.',
    originalPublicationYear: 2023,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Worldwide Creative Commons Attribution 4.0 license grant.',
    isHosted: true,
    readingDirection: 'vertical',
    demographic: 'shojo',
    authors: [AUTHORS['nina-chen']],
    genres: ['Solar-Punk', 'Slice of Life', 'Graphic Novel'],
    tags: ['Solarpunk', 'Botanical', 'Cozy Sci-Fi', 'CC BY 4.0'],
    fileFormat: 'images',
    status: 'ongoing',
    pageCount: 14,
    readingTimeMinutes: 18,
    featured: false,
    recentlyAdded: true,
    popularityScore: 93,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-08T10:00:00Z',
    verifiedBy: 'Senior Licensing Auditor',
    evidenceUrl: 'https://opencomics.org/dreamers-tomorrow',
    createdAt: '2026-02-18T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'dt-ch-1',
        workId: 'work-dreamers-tomorrow',
        chapterNumber: 1,
        number: 1,
        title: 'Chapter 1: The Rooftop Canopy',
        slug: 'chapter-1',
        pagesCount: 1,
        pages: [
          {
            id: 'dt-p1',
            pageNumber: 1,
            altText: 'Mei Lin tending hydroponic trellises overlooking the green terracotta city',
            caption: 'Page 1 — Sunrise over the North District terraces.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#ECFDF5"/>
                <text x="400" y="80" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="bold" font-size="28" fill="#065F46">THE DREAMERS OF TOMORROW</text>
                <text x="400" y="660" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="600" font-size="20" fill="#065F46">"Moss on the windward walls drops the summer heat."</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-wanderers-dust',
    title: 'Wanderers of the Dust: Solitude',
    slug: 'wanderers-of-the-dust-solitude',
    type: 'comic',
    description: 'A wordless, atmospheric post-cataclysmic graphic poem. A solitary traveler journeys through petrified dunes seeking forgotten acoustic libraries.',
    synopsis: 'Marcus Vance dedicated this complete visual narrative to the global commons under CC0 1.0 Universal.',
    coverImage: wanderersDustCover,
    language: 'English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceName: 'Public Domain Commons',
    attribution: 'Marcus Vance (2021). Dedicated to the Public Domain under CC0 1.0 Universal.',
    originalPublicationYear: 2021,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Worldwide Public Domain Dedication via CC0 1.0 Universal.',
    isHosted: true,
    readingDirection: 'ltr',
    demographic: 'seinen',
    authors: [AUTHORS['marcus-vance']],
    genres: ['Post-Apocalyptic', 'Wordless Comic', 'Minimalism'],
    tags: ['Wordless', 'CC0 Public Domain', 'Minimalist', 'Ink Art'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 10,
    readingTimeMinutes: 12,
    featured: false,
    recentlyAdded: true,
    popularityScore: 88,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-12T16:15:00Z',
    verifiedBy: 'Lead Open Culture Counsel',
    evidenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    createdAt: '2026-02-22T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'wd-ch-1',
        workId: 'work-wanderers-dust',
        chapterNumber: 1,
        number: 1,
        title: 'Canto I: The Sandstone Archive',
        slug: 'canto-1',
        pagesCount: 1,
        pages: [
          {
            id: 'wd-p1',
            pageNumber: 1,
            altText: 'Stark monochrome ink illustration of an immense stone arch over desert dunes',
            caption: 'Canto I — Silence and Sand. CC0 1.0 Public Domain Dedication.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#18181B"/>
                <path d="M 180 900 L 180 380 Q 400 160 620 380 L 620 900 L 520 900 L 520 420 Q 400 280 280 420 L 280 900 Z" fill="#F4F4F5"/>
                <text x="400" y="100" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-size="22" letter-spacing="4" fill="#A1A1AA">WANDERERS OF THE DUST</text>
              </svg>
            `
          }
        ]
      }
    ]
  },

  // ==========================================
  // SECTION 3: MANGA (6 Titles - All Verified Open Licenses)
  // ==========================================
  {
    id: 'work-hokusai-1',
    title: 'Hokusai Manga Vol. 1: Sketched Figures',
    nativeTitle: '北斎漫画 初編',
    romajiTitle: 'Hokusai Manga Shohen',
    slug: 'hokusai-manga-vol-1',
    type: 'manga',
    description: 'The monumental 1814 collection of woodblock sketches by Katsushika Hokusai that established the visual vocabulary and foundational concept of modern manga.',
    synopsis: 'Hokusai Manga is considered one of the quintessential cornerstones of Japanese sequential and figure art. Digitized from original woodblock editions by the Smithsonian Libraries and Freer Gallery of Art, released under CC0 1.0 worldwide public domain dedication.',
    coverImage: hokusaiCover,
    language: 'Japanese / English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    sourceName: 'Smithsonian Libraries Digital Collections',
    attribution: 'Katsushika Hokusai (1814). Digitized by Smithsonian Libraries. Dedicated to the Public Domain under CC0 1.0 Universal.',
    originalPublicationYear: 1814,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Katsushika Hokusai passed away in 1849 (>175 years). Digital assets released under CC0 1.0 by Smithsonian. 100% Worldwide safe.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'general',
    authors: [AUTHORS['katsushika-hokusai']],
    genres: ['Historical Manga', 'Edo Art', 'Ukiyo-e', 'Art Book'],
    tags: ['Hokusai', 'Edo Period', 'Manga Origin', 'CC0 Smithsonian', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 15,
    readingTimeMinutes: 20,
    featured: true,
    recentlyAdded: false,
    popularityScore: 99,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-15T09:30:00Z',
    verifiedBy: 'Chief Japanese Copyright Specialist',
    evidenceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'hm1-ch-1',
        workId: 'work-hokusai-1',
        volumeNumber: 1,
        chapterNumber: 1,
        number: 1,
        title: 'Volume 1: The Human Form & Postures (初編 人物相)',
        slug: 'volume-1',
        pagesCount: 3,
        pages: [
          {
            id: 'hm1-p1',
            pageNumber: 1,
            altText: 'Hokusai woodblock study of acrobats and martial artists in dynamic motion',
            caption: 'Folio 1 — Dynamic movement and bodily balance. Read Right-to-Left.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#F4ECD8"/>
                <rect x="25" y="25" width="750" height="1050" fill="none" stroke="#292524" stroke-width="3"/>
                <!-- Japanese Title Header strip -->
                <rect x="680" y="50" width="60" height="260" fill="#FFFFFF" stroke="#292524" stroke-width="2"/>
                <text x="710" y="100" font-family="'Newsreader', serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#1C1917">北</text>
                <text x="710" y="140" font-family="'Newsreader', serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#1C1917">斎</text>
                <text x="710" y="180" font-family="'Newsreader', serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#1C1917">漫</text>
                <text x="710" y="220" font-family="'Newsreader', serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#1C1917">画</text>
                <text x="710" y="260" font-family="'Newsreader', serif" font-weight="bold" font-size="16" text-anchor="middle" fill="#B91C1C">初編</text>
                
                <!-- Woodblock Figure Studies (Sumo, acrobats) -->
                <circle cx="350" cy="350" r="80" fill="none" stroke="#1C1917" stroke-width="4"/>
                <path d="M 320 380 Q 350 480 400 480" stroke="#1C1917" stroke-width="6" fill="none"/>
                <text x="350" y="540" text-anchor="middle" font-family="'Newsreader', serif" font-size="18" fill="#44403C">Edo Dynamic Gesture Studies (1814)</text>

                <circle cx="200" cy="720" r="70" fill="none" stroke="#1C1917" stroke-width="3"/>
                <circle cx="500" cy="720" r="70" fill="none" stroke="#1C1917" stroke-width="3"/>
                <text x="400" y="980" text-anchor="middle" font-family="'Newsreader', serif" font-style="italic" font-size="16" fill="#57534E">Smithsonian Libraries CC0 1.0 Worldwide Public Domain</text>
              </svg>
            `
          },
          {
            id: 'hm1-p2',
            pageNumber: 2,
            altText: 'Hokusai caricature and facial expressions from daily Edo street life',
            caption: 'Folio 2 — The Hundred Expressions of Edo. Reading Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#F4ECD8"/>
                <rect x="25" y="25" width="750" height="1050" fill="none" stroke="#292524" stroke-width="3"/>
                <text x="400" y="80" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="26" fill="#1C1917">Hokusai: The Expressive Eye (1814)</text>
                <rect x="80" y="160" width="280" height="280" rx="8" fill="#FFFDF5" stroke="#1C1917" stroke-width="2"/>
                <rect x="440" y="160" width="280" height="280" rx="8" fill="#FFFDF5" stroke="#1C1917" stroke-width="2"/>
                <rect x="80" y="520" width="280" height="280" rx="8" fill="#FFFDF5" stroke="#1C1917" stroke-width="2"/>
                <rect x="440" y="520" width="280" height="280" rx="8" fill="#FFFDF5" stroke="#1C1917" stroke-width="2"/>
                <text x="220" y="320" text-anchor="middle" font-family="'Newsreader', serif" font-size="20">Laughing Artisan</text>
                <text x="580" y="320" text-anchor="middle" font-family="'Newsreader', serif" font-size="20">Scowling Merchant</text>
                <text x="220" y="680" text-anchor="middle" font-family="'Newsreader', serif" font-size="20">Shocked Traveler</text>
                <text x="580" y="680" text-anchor="middle" font-family="'Newsreader', serif" font-size="20">Sleeping Monk</text>
                <text x="400" y="960" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14" fill="#78716C">RTL Navigation: Tap left or press right arrow to advance</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-hokusai-3',
    title: 'Hokusai Manga Vol. 3: Landscapes & Yokai',
    nativeTitle: '北斎漫画 三編',
    romajiTitle: 'Hokusai Manga Sanhen',
    slug: 'hokusai-manga-vol-3',
    type: 'manga',
    description: 'The celebrated third volume of Hokusai’s woodblock series featuring natural elements, cascading waterfalls, and folklore spirits.',
    synopsis: 'Preserved at the Freer Gallery of Art and Smithsonian Libraries under CC0 1.0. Shows how Hokusai mastered weather, supernatural folklore, and architectural perspective.',
    coverImage: hokusaiVol3Cover,
    language: 'Japanese / English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    sourceName: 'Smithsonian Libraries Digital Collections',
    attribution: 'Katsushika Hokusai (1815). Smithsonian Libraries CC0 1.0 Universal.',
    originalPublicationYear: 1815,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Worldwide Public Domain via creator death (1849) + CC0 dedication.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'general',
    authors: [AUTHORS['katsushika-hokusai']],
    genres: ['Historical Manga', 'Mythology', 'Ukiyo-e'],
    tags: ['Yokai', 'Landscapes', 'CC0 Smithsonian', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 14,
    readingTimeMinutes: 18,
    featured: false,
    recentlyAdded: true,
    popularityScore: 94,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-15T10:15:00Z',
    verifiedBy: 'Chief Japanese Copyright Specialist',
    evidenceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'hm3-ch-1',
        workId: 'work-hokusai-3',
        volumeNumber: 3,
        chapterNumber: 1,
        number: 1,
        title: 'Volume 3: Mountain Mist & Spirits (三編 山水怪異)',
        slug: 'volume-3',
        pagesCount: 1,
        pages: [
          {
            id: 'hm3-p1',
            pageNumber: 1,
            altText: 'Hokusai depiction of mountain torrents and ethereal misty forest spirits',
            caption: 'Folio 1 — Cascades and cloud formations over Mount Fuji.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#F4ECD8"/>
                <polygon points="400,200 150,680 650,680" fill="#E7E5E4" stroke="#1C1917" stroke-width="4"/>
                <polygon points="400,200 320,360 480,360" fill="#FFFFFF"/>
                <text x="400" y="800" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="28" fill="#1C1917">MOUNT FUJI IN STORM &amp; CLOUD</text>
                <text x="400" y="850" text-anchor="middle" font-family="'Newsreader', serif" font-size="16" fill="#78716C">Hokusai Manga Vol. 3 · Smithsonian CC0</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-ubunchu-1',
    title: 'Ubunchu! Episode 1: Up and Running!',
    nativeTitle: 'うぶんちゅ! 第1話',
    romajiTitle: 'Ubunchu! Dai-1-Wa',
    slug: 'ubunchu-episode-1',
    type: 'manga',
    description: 'The world’s premier open-source high-school manga by Hiroshi Seo. A school computer club president decides to switch their aging systems to Ubuntu Linux.',
    synopsis: 'Officially released under Creative Commons Attribution-NonCommercial 3.0. Ubunchu! has been translated into over twenty languages worldwide, celebrated for bringing warm humor to system administration and software freedom.',
    coverImage: ubunchuCover,
    language: 'Japanese / English',
    licenseCode: 'CC-BY-NC-3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc/3.0/',
    sourceUrl: 'https://www.aerialline.com/ubunchu',
    sourceName: 'Aerial Line (Hiroshi Seo Official)',
    attribution: 'Hiroshi Seo (瀬尾浩史). Licensed under Creative Commons Attribution-NonCommercial 3.0.',
    originalPublicationYear: 2008,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Worldwide Creative Commons Attribution-NonCommercial 3.0 license grant.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'shonen',
    authors: [AUTHORS['hiroshi-seo']],
    genres: ['School Comedy', 'Tech Slice-of-Life', 'Manga'],
    tags: ['Ubuntu', 'Linux', 'Sysadmin', 'School Club', 'CC BY-NC', 'RTL'],
    fileFormat: 'images',
    status: 'ongoing',
    pageCount: 16,
    readingTimeMinutes: 18,
    featured: true,
    recentlyAdded: false,
    popularityScore: 97,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-18T13:45:00Z',
    verifiedBy: 'Senior Licensing Auditor',
    evidenceUrl: 'https://www.aerialline.com/ubunchu',
    createdAt: '2026-01-08T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'ub1-ch-1',
        workId: 'work-ubunchu-1',
        chapterNumber: 1,
        number: 1,
        title: 'Episode 1: Up and Running! (うぶんちゅがやってきた!)',
        slug: 'episode-1',
        pagesCount: 2,
        pages: [
          {
            id: 'ub1-p1',
            pageNumber: 1,
            altText: 'The school computer club discovering the Ubuntu LiveCD',
            caption: 'Page 1 — The SysAdmin Club room. Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#FFFFFF"/>
                <rect x="30" y="30" width="740" height="420" fill="#FFF7ED" stroke="#431407" stroke-width="4"/>
                <text x="400" y="80" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="32" fill="#C2410C">UBUNCHU! EPISODE 1</text>
                <text x="400" y="120" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="16" fill="#9A3412">By Hiroshi Seo · Licensed under CC BY-NC 3.0</text>
                <!-- Live CD Disk -->
                <circle cx="400" cy="270" r="100" fill="#EA580C"/>
                <circle cx="400" cy="270" r="30" fill="#FFFFFF" stroke="#431407" stroke-width="4"/>
                <text x="400" y="278" text-anchor="middle" font-family="'IBM Plex Mono', monospace" font-size="12" fill="#431407">LIVE CD</text>
                
                <!-- Manga Panel Grid (RTL) -->
                <rect x="415" y="480" width="355" height="580" fill="#F8FAFC" stroke="#0F172A" stroke-width="4"/>
                <text x="590" y="530" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="16">Panel 1 (Right):</text>
                <text x="590" y="570" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14">"President, our hard drives</text>
                <text x="590" y="595" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14">crashed completely!"</text>
                
                <rect x="30" y="480" width="355" height="580" fill="#F8FAFC" stroke="#0F172A" stroke-width="4"/>
                <text x="210" y="530" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="16">Panel 2 (Left):</text>
                <text x="210" y="570" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14">"Don't panic. Boot from the</text>
                <text x="210" y="595" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14">Ubuntu terminal disk!"</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-ubunchu-2',
    title: 'Ubunchu! Episode 2: CLI and Hardcore CLI',
    nativeTitle: 'うぶんちゅ! 第2話',
    romajiTitle: 'Ubunchu! Dai-2-Wa',
    slug: 'ubunchu-episode-2',
    type: 'manga',
    description: 'The club learns bash scripting, permissions, and command-line wizardry while troubleshooting a campus server glitch.',
    synopsis: 'Created by Hiroshi Seo under CC BY-NC 3.0. Features charming character banter and authentic command-line humor.',
    coverImage: ubunchuEp2Cover,
    language: 'Japanese / English',
    licenseCode: 'CC-BY-NC-3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://www.aerialline.com/ubunchu',
    sourceName: 'Aerial Line (Hiroshi Seo Official)',
    attribution: 'Hiroshi Seo (瀬尾浩史). CC BY-NC 3.0.',
    originalPublicationYear: 2008,
    jurisdictionStatus: 'CC',
    jurisdictionNotes: 'Worldwide Creative Commons Attribution-NonCommercial 3.0 license grant.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'shonen',
    authors: [AUTHORS['hiroshi-seo']],
    genres: ['School Comedy', 'Tech Slice-of-Life', 'Manga'],
    tags: ['Command Line', 'Linux', 'CC BY-NC', 'RTL'],
    fileFormat: 'images',
    status: 'ongoing',
    pageCount: 16,
    readingTimeMinutes: 18,
    featured: false,
    recentlyAdded: true,
    popularityScore: 92,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-18T14:15:00Z',
    verifiedBy: 'Senior Licensing Auditor',
    evidenceUrl: 'https://www.aerialline.com/ubunchu',
    createdAt: '2026-01-09T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'ub2-ch-1',
        workId: 'work-ubunchu-2',
        chapterNumber: 2,
        number: 1,
        title: 'Episode 2: Terminal Warfare (CUIとCLI)',
        slug: 'episode-2',
        pagesCount: 1,
        pages: [
          {
            id: 'ub2-p1',
            pageNumber: 1,
            altText: 'The characters arguing passionately over sudo vs su',
            caption: 'Page 1 — The Command Line Interface controversy.',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#18181B"/>
                <rect x="30" y="30" width="740" height="1040" fill="#09090B" stroke="#3F3F46" stroke-width="3"/>
                <text x="50" y="80" font-family="'IBM Plex Mono', monospace" font-size="20" fill="#22C55E">$ sudo apt-get update &amp;&amp; sudo apt-get dist-upgrade</text>
                <text x="400" y="550" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-weight="bold" font-size="26" fill="#F4F4F5">UBUNCHU! EPISODE 2: HARDCORE CLI</text>
                <text x="400" y="600" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="16" fill="#A1A1AA">Hiroshi Seo · CC BY-NC 3.0</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-tagosaku',
    title: "Tagosaku and Mokube's Tokyo Sightseeing",
    nativeTitle: '田吾作と杢兵衛の東京見物',
    romajiTitle: 'Tagosaku to Mokube no Tokyo Kenbutsu',
    slug: 'tagosaku-and-mokube-tokyo-sightseeing',
    type: 'manga',
    description: 'The historic 1902 serial cartoon by Rakuten Kitazawa, widely acknowledged as the very first modern serial manga published in Japan.',
    synopsis: 'Published in Jiji Manga in 1902. Two rural travelers arrive in Meiji-era Tokyo, bewildered by Western electric streetcars, modern cafes, and telephone poles. Expired into global public domain.',
    coverImage: tagosakuCover,
    language: 'Japanese / English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Rakuten_Kitazawa',
    sourceName: 'Wikimedia Commons / National Diet Library',
    attribution: 'Rakuten Kitazawa (北澤楽天, 1902). Public domain under Japan Copyright Act and worldwide.',
    originalPublicationYear: 1902,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Rakuten Kitazawa passed away 1955. 50-year term expired Dec 31, 2005. Free in Japan and worldwide.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'seinen',
    authors: [AUTHORS['rakuten-kitazawa']],
    genres: ['Historical Manga', 'Comedy', 'Satire'],
    tags: ['Meiji Era', 'Manga History', 'First Serial Manga', 'PD Japan', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 8,
    readingTimeMinutes: 10,
    featured: false,
    recentlyAdded: true,
    popularityScore: 91,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-20T11:00:00Z',
    verifiedBy: 'Chief Japanese Copyright Specialist',
    evidenceUrl: 'https://commons.wikimedia.org/wiki/Category:Rakuten_Kitazawa',
    createdAt: '2026-01-04T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'tm-ch-1',
        workId: 'work-tagosaku',
        chapterNumber: 1,
        number: 1,
        title: 'Issue 1: Arrival at Tokyo Central (東京停車場の場)',
        slug: 'issue-1',
        pagesCount: 1,
        pages: [
          {
            id: 'tm-p1',
            pageNumber: 1,
            altText: 'Rural travelers in 1902 Tokyo marveling at modern streetcars and bowler hats',
            caption: 'First serialized 1902 in Jiji Manga. Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#FEFCE8"/>
                <text x="400" y="80" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="28" fill="#1C1917">田吾作と杢兵衛の東京見物 (1902)</text>
                <text x="400" y="115" text-anchor="middle" font-family="'Instrument Sans', sans-serif" font-size="14" fill="#78350F">By Rakuten Kitazawa · Public Domain Worldwide</text>
                <rect x="40" y="160" width="720" height="880" fill="#FFFBEB" stroke="#713F12" stroke-width="4"/>
                <text x="400" y="550" text-anchor="middle" font-family="'Newsreader', serif" font-size="22" fill="#713F12">The Birth of Modern Serial Manga</text>
              </svg>
            `
          }
        ]
      }
    ]
  },
  {
    id: 'work-princess-kaguya',
    title: 'The Legend of Princess Kaguya: Illustrated Scrolls',
    nativeTitle: '竹取物語絵巻',
    romajiTitle: 'Taketori Monogatari Emaki',
    slug: 'legend-of-princess-kaguya-scrolls',
    type: 'manga',
    description: 'Ancient 10th-century proto-manga sequential picture scroll (emakimono) depicting the Moon Princess born inside a glowing stalk of bamboo.',
    synopsis: 'Preserved by the National Diet Library Digital Collections. Recognized by scholars as Japan’s earliest prose narrative and sequential pictorial predecessor to modern manga.',
    coverImage: kaguyaCover,
    language: 'Japanese / English',
    licenseCode: 'WORLDWIDE_PD',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    sourceUrl: 'https://www.ndl.go.jp/en/',
    sourceName: 'National Diet Library Digital Collections (Japan)',
    attribution: 'Heian Tradition (10th century). Public domain worldwide. Preserved by the National Diet Library.',
    originalPublicationYear: 950,
    jurisdictionStatus: 'WORLDWIDE_PD',
    jurisdictionNotes: 'Created over a thousand years ago. Incontestable worldwide public domain.',
    isHosted: true,
    readingDirection: 'rtl',
    demographic: 'josei',
    authors: [AUTHORS['traditional-japanese']],
    genres: ['Folklore', 'Sequential Scroll', 'Historical Proto-Manga'],
    tags: ['Princess Kaguya', 'Heian Era', 'Emakimono', 'Worldwide PD', 'RTL'],
    fileFormat: 'images',
    status: 'completed',
    pageCount: 10,
    readingTimeMinutes: 15,
    featured: false,
    recentlyAdded: true,
    popularityScore: 93,
    verificationStatus: 'verified',
    verifiedAt: '2026-02-22T15:20:00Z',
    verifiedBy: 'Chief Japanese Copyright Specialist',
    evidenceUrl: 'https://www.ndl.go.jp/en/',
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    chapters: [
      {
        id: 'pk-ch-1',
        workId: 'work-princess-kaguya',
        chapterNumber: 1,
        number: 1,
        title: 'Scroll I: The Glowing Bamboo Stalk (竹取の段)',
        slug: 'scroll-1',
        pagesCount: 1,
        pages: [
          {
            id: 'pk-p1',
            pageNumber: 1,
            altText: 'The old bamboo cutter discovering the tiny celestial infant inside the glowing golden stalk',
            caption: 'Scroll I — The Miracle of the Grove. Read Right-to-Left (RTL).',
            svgArt: `
              <svg viewBox="0 0 800 1100" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto rounded shadow-inner">
                <rect width="800" height="1100" fill="#FDF4E3"/>
                <text x="400" y="80" text-anchor="middle" font-family="'Newsreader', serif" font-weight="bold" font-size="28" fill="#1C1917">竹取物語絵巻 (10th Century)</text>
                <text x="400" y="115" text-anchor="middle" font-family="'Newsreader', serif" font-style="italic" font-size="16" fill="#854D0E">The Earliest Sequential Narrative of Japan · Worldwide Public Domain</text>
                <circle cx="400" cy="500" r="140" fill="#FEF08A" opacity="0.8"/>
                <text x="400" y="750" text-anchor="middle" font-family="'Newsreader', serif" font-size="22" fill="#1C1917">"The Celestial Child of the Moon"</text>
              </svg>
            `
          }
        ]
      }
    ]
  }
];

