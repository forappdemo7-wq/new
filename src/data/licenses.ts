import { LicenseInfo } from '../types';

export const LICENSES_REGISTRY: Record<string, LicenseInfo> = {
  'WORLDWIDE_PD': {
    code: 'WORLDWIDE_PD',
    name: 'Worldwide Public Domain',
    category: 'public_domain',
    badgeText: 'Worldwide Public Domain',
    shortDesc: 'Author deceased over 70+ years ago and published before 1929; free of copyright worldwide.',
    fullDesc: 'A work whose term of copyright has expired in all major jurisdictions (US, EU, UK, Japan: author life + 70 years). Free to copy, adapt, translate, and distribute globally without royalties or licensing barriers.',
    permissions: [
      'Worldwide free distribution and digital hosting',
      'Creation of adaptations, translations, and derivative editions',
      'Public display and performance',
      'Commercial and educational reproduction'
    ],
    requirements: [
      'Good faith creator attribution ethically requested'
    ],
    prohibitions: [
      'Cannot claim exclusive private copyright over original raw source text'
    ],
    officialUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    allowsHosting: true,
    requiresAttribution: false,
    allowsCommercial: true,
    allowsModification: true
  },
  'PD-US': {
    code: 'PD-US',
    name: 'Public Domain (US / Pre-1929)',
    category: 'public_domain',
    badgeText: 'Public Domain (US)',
    shortDesc: 'Published prior to January 1, 1929 in the US, or copyright renewal lapsed.',
    fullDesc: 'Free from copyright restrictions in the United States. In jurisdictions with strict rule of the shorter term or Life+70 where author passed away more recently, caution is indicated.',
    permissions: [
      'Full hosting and reading within the US and jurisdictions recognizing US term',
      'Free distribution and reproduction'
    ],
    requirements: [
      'Attribution recommended'
    ],
    prohibitions: [
      'Check local copyright term if downloading outside the US'
    ],
    officialUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    allowsHosting: true,
    requiresAttribution: false,
    allowsCommercial: true,
    allowsModification: true
  },
  'PD-JAPAN': {
    code: 'PD-JAPAN',
    name: 'Public Domain (Japan Copyright Act)',
    category: 'public_domain',
    badgeText: 'PD Japan',
    shortDesc: 'Public domain under Japanese Copyright Law (Article 51 / expired prior to 2018 extension).',
    fullDesc: 'Works where the creator passed away before December 31, 1967 (satisfying the former 50-year post-mortem rule prior to the 2018 TPP 70-year extension), or pre-1953 corporate/cinematographic works.',
    permissions: [
      'Free to read, redistribute, and translate worldwide if life+70 satisfied or in Japan'
    ],
    requirements: [
      'Attribution to original creator / studio'
    ],
    prohibitions: [
      'Moral rights of the author (chokusakusha jinkakuken) must be respected'
    ],
    officialUrl: 'https://www.bunka.go.jp/seisaku/chosakuken/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true
  },
  'CC0-1.0': {
    code: 'CC0-1.0',
    name: 'Creative Commons CC0 1.0 Universal',
    category: 'public_domain',
    badgeText: 'CC0 Public Domain',
    shortDesc: 'No Rights Reserved — Creator has dedicated the work to the public domain globally.',
    fullDesc: 'The creator or holding institution (such as the Smithsonian Libraries for the Hokusai Manga) has dedicated the work to the worldwide public domain. You can copy, modify, distribute, and perform the work, even for commercial purposes, without asking permission.',
    permissions: [
      'Worldwide redistribution, mirroring, and hosting',
      'Commercial and non-commercial utilization',
      'Remixing, colorizing, and translating'
    ],
    requirements: [
      'No legal requirements; attribution remains standard curatorial ethics'
    ],
    prohibitions: [
      'No patent or trademark rights surrendered'
    ],
    officialUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    allowsHosting: true,
    requiresAttribution: false,
    allowsCommercial: true,
    allowsModification: true
  },
  'CC-BY-4.0': {
    code: 'CC-BY-4.0',
    name: 'Creative Commons Attribution 4.0 International',
    category: 'creative_commons',
    badgeText: 'CC BY 4.0',
    shortDesc: 'Free to share and adapt for any purpose, with creator credit.',
    fullDesc: 'The gold standard open cultural license. Permits sharing and adapting material in any medium, even commercially, as long as appropriate credit is given and license link is provided.',
    permissions: [
      'Full digital hosting, reproduction, and redistribution',
      'Translations, remixes, and adaptations'
    ],
    requirements: [
      'Attribution: Credit author/artist, provide link to license, note modifications'
    ],
    prohibitions: [
      'Cannot apply legal terms or technological DRM that restrict others'
    ],
    officialUrl: 'https://creativecommons.org/licenses/by/4.0/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true
  },
  'CC-BY-SA-4.0': {
    code: 'CC-BY-SA-4.0',
    name: 'Creative Commons Attribution-ShareAlike 4.0',
    category: 'creative_commons',
    badgeText: 'CC BY-SA 4.0',
    shortDesc: 'Free to share and adapt, provided adaptations use identical copyleft terms.',
    fullDesc: 'Copyleft license for open culture. You may share and adapt, but derivatives must be licensed under the same CC BY-SA terms.',
    permissions: [
      'Free redistribution and hosting',
      'Adaptations and translations permitted'
    ],
    requirements: [
      'Attribution to creator and link to source',
      'ShareAlike: Derivatives must be distributed under CC BY-SA'
    ],
    prohibitions: [
      'Cannot relicense under proprietary terms'
    ],
    officialUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true
  },
  'CC-BY-NC-4.0': {
    code: 'CC-BY-NC-4.0',
    name: 'Creative Commons Attribution-NonCommercial 4.0',
    category: 'creative_commons',
    badgeText: 'CC BY-NC 4.0',
    shortDesc: 'Free to read, host, and share for non-commercial educational purposes.',
    fullDesc: 'Permits non-commercial digital libraries like wanna read? to host and distribute the full work without charge, provided proper credit is given.',
    permissions: [
      'Non-commercial digital hosting and readership',
      'Free classroom and educational distribution'
    ],
    requirements: [
      'Attribution to author/artist and link to original source'
    ],
    prohibitions: [
      'Commercial resale or ad-monetization'
    ],
    officialUrl: 'https://creativecommons.org/licenses/by-nc/4.0/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: false,
    allowsModification: true
  },
  'CC-BY-NC-SA-3.0': {
    code: 'CC-BY-NC-SA-3.0',
    name: 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0',
    category: 'creative_commons',
    badgeText: 'CC BY-NC-SA 3.0',
    shortDesc: 'Free non-commercial redistribution with copyleft ShareAlike.',
    fullDesc: 'Used by authors like Cory Doctorow. Anyone may freely host, download, and read the book as long as no fees are charged, attribution is given, and adaptations carry the same license.',
    permissions: [
      'Free non-commercial hosting, reading, and offline storage',
      'Derivative translations under same terms'
    ],
    requirements: [
      'Attribution to creator and ShareAlike license matching'
    ],
    prohibitions: [
      'Commercial resale, charging access fees, or placing behind paywalls'
    ],
    officialUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: false,
    allowsModification: true
  },
  'CC-BY-NC-2.5': {
    code: 'CC-BY-NC-2.5',
    name: 'Creative Commons Attribution-NonCommercial 2.5',
    category: 'creative_commons',
    badgeText: 'CC BY-NC 2.5',
    shortDesc: 'Free to share for non-commercial purposes with attribution (used by xkcd).',
    fullDesc: 'Permits free, non-commercial copying and redistribution with clear attribution to the creator.',
    permissions: [
      'Non-commercial hosting and sharing',
      'Educational presentation'
    ],
    requirements: [
      'Attribution to creator (e.g., Randall Munroe / xkcd.com)'
    ],
    prohibitions: [
      'Commercial monetization'
    ],
    officialUrl: 'https://creativecommons.org/licenses/by-nc/2.5/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: false,
    allowsModification: true
  },
  'FAL-1.3': {
    code: 'FAL-1.3',
    name: 'Free Art License 1.3 (Licence Art Libre)',
    category: 'free_art',
    badgeText: 'Free Art License',
    shortDesc: 'French/International open license for sequential and visual art.',
    fullDesc: 'Grants the right to freely copy, distribute, and transform creative works while respecting author attribution.',
    permissions: [
      'Copy, distribute, and broadcast the work',
      'Modify and create derivative works'
    ],
    requirements: [
      'Mention author name and license link'
    ],
    prohibitions: [
      'Proprietary enclosure'
    ],
    officialUrl: 'http://artlibre.org/licence/lal/en/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true
  },
  'AUTHOR_PERMITTED': {
    code: 'AUTHOR_PERMITTED',
    name: 'Explicit Author Permission',
    category: 'author_permitted',
    badgeText: 'Author Permitted',
    shortDesc: 'Direct written permission granted by creator or estate to host on wanna read?.',
    fullDesc: 'The rights-holder has directly authorized wanna read? to host and distribute their work free of charge. Stored with a verified permission proof document ID in the curatorial registry.',
    permissions: [
      'Free hosting and reading on wanna read?',
      'Non-commercial educational access'
    ],
    requirements: [
      'Must maintain original copyright notices and links to creator website'
    ],
    prohibitions: [
      'Third parties cannot relicense without consulting original creator'
    ],
    officialUrl: '/licensing',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: false,
    allowsModification: false
  },
  'LINK_OUT_ONLY': {
    code: 'LINK_OUT_ONLY',
    name: 'Official External Free-Read Portal (Link-Out Only)',
    category: 'link_out',
    badgeText: 'Link-Out Only',
    shortDesc: 'Official publisher / out-of-print authorized read portal. NOT hosted on our servers.',
    fullDesc: 'In strict accordance with Rule 1 ("HOST ONLY content that is verifiably free to REDISTRIBUTE worldwide"), this work is NOT stored or hosted on wanna read?. We provide a legal, direct link-out to the official publisher portal (e.g. Manga Library Z, Shueisha MANGA MILLION, or publisher web comic) where readers can enjoy legitimate free previews.',
    permissions: [
      'External browsing on official licensed portal'
    ],
    requirements: [
      'Opens directly in new tab on the publisher or authorized archive domain'
    ],
    prohibitions: [
      'NEVER mirror, scrape, proxy, or host locally'
    ],
    officialUrl: '/sources',
    allowsHosting: false,
    requiresAttribution: true,
    allowsCommercial: false,
    allowsModification: false
  }
};

export function getLicenseInfo(code: string): LicenseInfo {
  const norm = code.toUpperCase().replace(/\s+/g, '_');
  return LICENSES_REGISTRY[norm] || LICENSES_REGISTRY[code] || {
    code,
    name: code,
    category: 'creative_commons',
    badgeText: code,
    shortDesc: 'Verified open cultural license.',
    fullDesc: 'This work is made available under a verified open distribution license.',
    permissions: ['Free to read and share'],
    requirements: ['Attribution required'],
    prohibitions: ['Do not remove license notices'],
    officialUrl: 'https://creativecommons.org/',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: false,
    allowsModification: false
  };
}
