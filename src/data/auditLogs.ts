import { LicenseAudit } from '../types';

export const INITIAL_AUDIT_LOGS: LicenseAudit[] = [
  {
    id: 'audit-001',
    workId: 'work-frankenstein',
    workTitle: 'Frankenstein; or, The Modern Prometheus',
    verifiedBy: 'Chief Compliance Registrar (Legal Dept)',
    verifiedAt: '2026-01-10T14:30:00Z',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/84',
    jurisdictionNotes: 'Author Mary Shelley died 1851 (>170 yrs ago). Published 1818. Fully in Public Domain worldwide (Life+70 and Pre-1929 US rules satisfied).',
    status: 'verified'
  },
  {
    id: 'audit-002',
    workId: 'work-alice',
    workTitle: "Alice's Adventures in Wonderland",
    verifiedBy: 'Chief Compliance Registrar (Legal Dept)',
    verifiedAt: '2026-01-12T11:00:00Z',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/11',
    jurisdictionNotes: 'Lewis Carroll passed away 1898. Original text and Tenniel engravings entered global public domain.',
    status: 'verified'
  },
  {
    id: 'audit-003',
    workId: 'work-metamorphosis',
    workTitle: 'The Metamorphosis',
    verifiedBy: 'Curatorial Verification Officer',
    verifiedAt: '2026-01-15T09:15:00Z',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/5200',
    jurisdictionNotes: 'Franz Kafka passed away 1924 (>100 years). Ian Johnston translation released into public domain.',
    status: 'verified'
  },
  {
    id: 'audit-004',
    workId: 'work-yellow-wallpaper',
    workTitle: 'The Yellow Wallpaper',
    verifiedBy: 'Curatorial Verification Officer',
    verifiedAt: '2026-01-18T16:20:00Z',
    evidenceUrl: 'https://www.gutenberg.org/ebooks/1952',
    jurisdictionNotes: 'Published 1892 in New England Magazine. Charlotte Perkins Gilman passed away 1935 (>90 years ago). Worldwide public domain.',
    status: 'verified'
  },
  {
    id: 'audit-005',
    workId: 'work-little-brother',
    workTitle: 'Little Brother',
    verifiedBy: 'Senior Licensing Auditor',
    verifiedAt: '2026-01-20T10:45:00Z',
    evidenceUrl: 'https://craphound.com/littlebrother/download/',
    jurisdictionNotes: 'Author Cory Doctorow officially released book under CC BY-NC-SA 3.0 on craphound.com with open distribution permission.',
    status: 'verified'
  },
  {
    id: 'audit-006',
    workId: 'work-flatland',
    workTitle: 'Flatland: A Romance of Many Dimensions',
    verifiedBy: 'Curatorial Verification Officer',
    verifiedAt: '2026-01-22T13:10:00Z',
    evidenceUrl: 'https://standardebooks.org/ebooks/edwin-a-abbott/flatland',
    jurisdictionNotes: 'Published 1884. Edwin A. Abbott passed away 1926. Verified via Standard Ebooks public domain collection.',
    status: 'verified'
  },
  {
    id: 'audit-007',
    workId: 'work-peppercarrot-1',
    workTitle: 'Pepper & Carrot: The Potion Contest',
    verifiedBy: 'Lead Open Culture Counsel',
    verifiedAt: '2026-01-25T15:00:00Z',
    evidenceUrl: 'https://www.peppercarrot.com/en/article271/episode-1-potion-contest',
    jurisdictionNotes: 'David Revoy explicitly licenses all episodes and art under Creative Commons Attribution 4.0 International worldwide.',
    status: 'verified'
  },
  {
    id: 'audit-008',
    workId: 'work-peppercarrot-2',
    workTitle: 'Pepper & Carrot: Rainbow Potion',
    verifiedBy: 'Lead Open Culture Counsel',
    verifiedAt: '2026-01-25T15:30:00Z',
    evidenceUrl: 'https://www.peppercarrot.com/en/article273/episode-2-rainbow-potions',
    jurisdictionNotes: 'Episode 2 CC BY 4.0 verification confirmed directly against official repository.',
    status: 'verified'
  },
  {
    id: 'audit-009',
    workId: 'work-tales-cosmos',
    workTitle: 'Tales of the Cosmos: The Signal',
    verifiedBy: 'Senior Licensing Auditor',
    verifiedAt: '2026-02-01T11:20:00Z',
    evidenceUrl: 'https://creativecommons.org',
    jurisdictionNotes: 'Project Stellar confirmed CC BY-SA 4.0 license deed included in comic colophon.',
    status: 'verified'
  },
  {
    id: 'audit-010',
    workId: 'work-little-nemo',
    workTitle: 'Little Nemo in Slumberland: The Walking Bed',
    verifiedBy: 'Curatorial Verification Officer',
    verifiedAt: '2026-02-05T14:40:00Z',
    evidenceUrl: 'https://comicbookplus.com/?dlid=16200',
    jurisdictionNotes: 'Winsor McCay published July 1908 in New York Herald. Artist passed away 1934 (>90 years). Preserved on Comic Book Plus.',
    status: 'verified'
  },
  {
    id: 'audit-011',
    workId: 'work-dreamers-tomorrow',
    workTitle: 'The Dreamers of Tomorrow',
    verifiedBy: 'Senior Licensing Auditor',
    verifiedAt: '2026-02-08T10:00:00Z',
    evidenceUrl: 'https://opencomics.org/dreamers-tomorrow',
    jurisdictionNotes: 'Creator Nina Chen released series under CC BY 4.0 on Open Comics Federation.',
    status: 'verified'
  },
  {
    id: 'audit-012',
    workId: 'work-wanderers-dust',
    workTitle: 'Wanderers of the Dust: Solitude',
    verifiedBy: 'Lead Open Culture Counsel',
    verifiedAt: '2026-02-12T16:15:00Z',
    evidenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    jurisdictionNotes: 'Marcus Vance dedicated full high-res ink panels to global public domain under CC0 1.0 Universal.',
    status: 'verified'
  },
  {
    id: 'audit-013',
    workId: 'work-hokusai-1',
    workTitle: 'Hokusai Manga Vol. 1: Sketched Figures (北斎漫画 初編)',
    verifiedBy: 'Chief Japanese Copyright Specialist',
    verifiedAt: '2026-02-15T09:30:00Z',
    evidenceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    jurisdictionNotes: 'Katsushika Hokusai passed away in 1849 (175+ years ago). Digital scans released under CC0 1.0 by the Smithsonian Libraries. 100% Worldwide Public Domain safe.',
    status: 'verified'
  },
  {
    id: 'audit-014',
    workId: 'work-hokusai-3',
    workTitle: 'Hokusai Manga Vol. 3: Landscapes & Yokai (北斎漫画 三編)',
    verifiedBy: 'Chief Japanese Copyright Specialist',
    verifiedAt: '2026-02-15T10:15:00Z',
    evidenceUrl: 'https://library.si.edu/digital-library/book/hokusai-manga',
    jurisdictionNotes: 'Preserved at Smithsonian Freer Gallery of Art. CC0 1.0 dedication confirmed. Historical Edo manga predecessor.',
    status: 'verified'
  },
  {
    id: 'audit-015',
    workId: 'work-ubunchu-1',
    workTitle: 'Ubunchu! Episode 1: Up and Running! (うぶんちゅ!)',
    verifiedBy: 'Senior Licensing Auditor',
    verifiedAt: '2026-02-18T13:45:00Z',
    evidenceUrl: 'https://www.aerialline.com/ubunchu',
    jurisdictionNotes: 'Hiroshi Seo officially licensed Ubunchu! under Creative Commons Attribution-NonCommercial 3.0 (CC BY-NC 3.0). Allows free non-commercial hosting.',
    status: 'verified'
  },
  {
    id: 'audit-016',
    workId: 'work-ubunchu-2',
    workTitle: 'Ubunchu! Episode 2: CLI and Hardcore CLI',
    verifiedBy: 'Senior Licensing Auditor',
    verifiedAt: '2026-02-18T14:15:00Z',
    evidenceUrl: 'https://www.aerialline.com/ubunchu',
    jurisdictionNotes: 'CC BY-NC 3.0 license confirmed via author Hiroshi Seo’s official distribution page.',
    status: 'verified'
  },
  {
    id: 'audit-017',
    workId: 'work-tagosaku',
    workTitle: "Tagosaku and Mokube's Tokyo Sightseeing (田吾作と杢兵衛の東京見物)",
    verifiedBy: 'Chief Japanese Copyright Specialist',
    verifiedAt: '2026-02-20T11:00:00Z',
    evidenceUrl: 'https://commons.wikimedia.org/wiki/Category:Rakuten_Kitazawa',
    jurisdictionNotes: 'Serialized 1902 in Jiji Manga. Creator Rakuten Kitazawa died 1955. Under Japan Copyright Act of 1970 prior to TPP, 50-year term expired Dec 31, 2005. Free in Japan and worldwide.',
    status: 'verified'
  },
  {
    id: 'audit-018',
    workId: 'work-princess-kaguya',
    workTitle: 'The Legend of Princess Kaguya: Illustrated Scrolls (竹取物語絵巻)',
    verifiedBy: 'Chief Japanese Copyright Specialist',
    verifiedAt: '2026-02-22T15:20:00Z',
    evidenceUrl: 'https://www.ndl.go.jp/en/',
    jurisdictionNotes: 'Ancient 10th-century Japanese tale. Digitized historical scrolls held in National Diet Library Collections under Public Domain (no restrictions). Worldwide PD.',
    status: 'verified'
  }
];
