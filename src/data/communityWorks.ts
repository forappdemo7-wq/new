import { Work } from '../types';
import { generateGhostCoverSvg, GHOST_COVER_PALETTES } from '../services/coverService';

export const INITIAL_COMMUNITY_WORKS: Work[] = [
  {
    id: 'work-community-clockwork-alchemist',
    slug: 'the-clockwork-alchemist',
    title: 'The Clockwork Alchemist',
    type: 'book',
    description: 'In Victorian New London, a rogue horologist discovers that time is a physical liquid that can be refined, distilled, and stolen.',
    synopsis: 'An original steampunk fantasy novel written and self-published by community creator Elena Rostova under Creative Commons Attribution 4.0.',
    coverImage: generateGhostCoverSvg(
      'The Clockwork Alchemist',
      'Elena Rostova',
      'Book',
      2025,
      GHOST_COVER_PALETTES[0]
    ),
    coverImageUrl: generateGhostCoverSvg(
      'The Clockwork Alchemist',
      'Elena Rostova',
      'Book',
      2025,
      GHOST_COVER_PALETTES[0]
    ),
    language: 'English',
    licenseCode: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceName: 'Community Self-Published',
    sourceUrl: '',
    attribution: 'Elena Rostova (2025). Released under CC BY 4.0.',
    originalPublicationYear: 2025,
    jurisdictionStatus: 'COMMUNITY_OPEN',
    jurisdictionNotes: 'Community creator self-published upload.',
    isHosted: true,
    readingDirection: 'ltr',
    publisherId: 'user-creator-elena',
    publisherEmail: 'elena.rostova@example.com',
    publisherName: 'Elena Rostova',
    uploaderId: 'user-creator-elena',
    likesCount: 0,
    commentsCount: 0,
    authors: [
      {
        id: 'author-elena-rostova',
        name: 'Elena Rostova',
        slug: 'elena-rostova',
        role: 'Author',
        bio: 'Independent steampunk & speculative fiction novelist and community member.',
        verifiedOpenLicense: true,
      },
    ],
    genres: ['Steampunk', 'Fantasy', 'Sci-Fi'],
    tags: ['Steampunk', 'Alchemy', 'Victorian', 'Community Upload'],
    fileFormat: 'epub',
    status: 'completed',
    popularityScore: 94,
    verificationStatus: 'verified',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    chapters: [
      {
        id: 'chap-clockwork-1',
        workId: 'work-community-clockwork-alchemist',
        chapterNumber: 1,
        number: 1,
        title: 'Chapter 1: The Liquid Pendulum',
        slug: 'chapter-1',
        content: `The clockmaker’s workshop smelled of bitter brass polish and dried lavender. 

Master Alistair held the glass vial up to the lantern flame. Inside, suspended in mineral oil, a single droplet of golden fluid pulsed like a tiny hummingbird heart. It was not mercury. It was not ether.

"Second-grade chronite," he whispered to his apprentice, Mira. "Three seconds of pure, unspent yesterday."

Mira leaned closer, her bronze goggles reflecting the warm orange glow. "Where did the guild retrieve it?"

"From the high vaults beneath the Thames," Alistair replied softly, looking toward the barred iron door. "And someone noticed it was missing five minutes ago."

Outside, heavy steam-whistle boots resonated on the cobblestones. The Enforcers had arrived.`,
      },
      {
        id: 'chap-clockwork-2',
        workId: 'work-community-clockwork-alchemist',
        chapterNumber: 2,
        number: 2,
        title: 'Chapter 2: Gears in the Mist',
        slug: 'chapter-2',
        content: `Mira slipped the brass carrying case into her leather satchel just as the latch on the heavy front oak door splintered.

"Run through the flues, Mira," Alistair commanded, picking up his heavy wrench. "Take the chronite to the Southwark docks. Find the woman with the mechanical falcon."

Mira didn't hesitate. She knew the secret escape shaft behind the grand grandfather clock by heart. As she pulled the release lever, the gears slid smoothly open, plunging her into the cool, dark ventilation labyrinth beneath New London.`,
      },
    ],
  },
  {
    id: 'work-community-cyber-samurai',
    slug: 'cyber-samurai-neon-drift',
    title: 'Cyber Samurai: Neon Drift',
    type: 'manga',
    description: 'In Neo-Kyoto 2099, an augmented ronin protects a young rogue AI code developer from cybernetic mega-corporations.',
    synopsis: 'An action-packed indie cyberpunk manga by digital illustrator Kenji Sato, released freely under Creative Commons Zero (CC0).',
    coverImage: generateGhostCoverSvg(
      'Cyber Samurai: Neon Drift',
      'Kenji Sato',
      'Manga',
      2025,
      GHOST_COVER_PALETTES[2]
    ),
    coverImageUrl: generateGhostCoverSvg(
      'Cyber Samurai: Neon Drift',
      'Kenji Sato',
      'Manga',
      2025,
      GHOST_COVER_PALETTES[2]
    ),
    language: 'English',
    licenseCode: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceName: 'Community Self-Published',
    sourceUrl: '',
    attribution: 'Kenji Sato (2025). Dedicated to Public Domain (CC0).',
    originalPublicationYear: 2025,
    jurisdictionStatus: 'COMMUNITY_OPEN',
    jurisdictionNotes: 'Community self-published manga creation.',
    isHosted: true,
    readingDirection: 'rtl',
    publisherId: 'user-creator-kenji',
    publisherEmail: 'kenji.sato@example.com',
    publisherName: 'Kenji Sato',
    uploaderId: 'user-creator-kenji',
    likesCount: 0,
    commentsCount: 0,
    authors: [
      {
        id: 'author-kenji-sato',
        name: 'Kenji Sato',
        slug: 'kenji-sato',
        role: 'Mangaka',
        bio: 'Indie digital manga creator exploring cyberpunk themes and futuristic samurai lore.',
        verifiedOpenLicense: true,
      },
    ],
    genres: ['Manga', 'Cyberpunk', 'Action', 'Sci-Fi'],
    tags: ['Manga', 'Cyberpunk', 'Samurai', 'RTL', 'Community Upload'],
    fileFormat: 'images',
    status: 'ongoing',
    popularityScore: 96,
    verificationStatus: 'verified',
    createdAt: '2026-03-02T12:00:00Z',
    updatedAt: '2026-03-02T12:00:00Z',
    chapters: [
      {
        id: 'chap-cyber-1',
        workId: 'work-community-cyber-samurai',
        chapterNumber: 1,
        number: 1,
        title: 'Episode 1: The Rain in District 9',
        slug: 'episode-1',
        content: `Rain fell like neon needles over the towering spires of Neo-Kyoto. 

Jin stood on the edge of the sky-bridge, his carbon-fiber haori fluttering in the smog-laden updraft. Through his augmented retinal display, seventy-two tracking signals flickered across the lower alleyways.

"Target acquired," the voice in his cyberware whispered. "A courier carrying the decrypted neural key."

Jin drew his monomolecular katana. The blade hummed with a quiet azure ion charge. "No collateral damage this time," he replied into the comms, and leaped downward into the mist.`,
      },
    ],
  },
  {
    id: 'work-community-astral-forest',
    slug: 'chronicles-of-the-astral-forest',
    title: 'Chronicles of the Astral Forest',
    type: 'comic',
    description: 'A botanical explorer records the bioluminescent flora and gentle spirit guardians inhabiting an uncharted world.',
    synopsis: 'A colorful indie graphic narrative illustrated and published by community creator Maya Lin under CC BY-SA 4.0.',
    coverImage: generateGhostCoverSvg(
      'Chronicles of the Astral Forest',
      'Maya Lin',
      'Comic',
      2025,
      GHOST_COVER_PALETTES[3]
    ),
    coverImageUrl: generateGhostCoverSvg(
      'Chronicles of the Astral Forest',
      'Maya Lin',
      'Comic',
      2025,
      GHOST_COVER_PALETTES[3]
    ),
    language: 'English',
    licenseCode: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceName: 'Community Self-Published',
    sourceUrl: '',
    attribution: 'Maya Lin (2025). Creative Commons Attribution 4.0.',
    originalPublicationYear: 2025,
    jurisdictionStatus: 'COMMUNITY_OPEN',
    jurisdictionNotes: 'Community self-published indie comic.',
    isHosted: true,
    readingDirection: 'ltr',
    publisherId: 'user-creator-maya',
    publisherEmail: 'maya.lin@example.com',
    publisherName: 'Maya Lin',
    uploaderId: 'user-creator-maya',
    likesCount: 0,
    commentsCount: 0,
    authors: [
      {
        id: 'author-maya-lin',
        name: 'Maya Lin',
        slug: 'maya-lin',
        role: 'Writer & Illustrator',
        bio: 'Environmental artist, illustrator, and digital comic author.',
        verifiedOpenLicense: true,
      },
    ],
    genres: ['Comic', 'Fantasy', 'Nature', 'Adventure'],
    tags: ['Webcomic', 'Bioluminescence', 'Fantasy', 'Indie Comic'],
    fileFormat: 'images',
    status: 'completed',
    popularityScore: 91,
    verificationStatus: 'verified',
    createdAt: '2026-03-03T09:00:00Z',
    updatedAt: '2026-03-03T09:00:00Z',
    chapters: [
      {
        id: 'chap-astral-1',
        workId: 'work-community-astral-forest',
        chapterNumber: 1,
        number: 1,
        title: 'Entry 1: Whispering Moss',
        slug: 'entry-1',
        content: `Field Notes — Day 14:

The canopy above glows with cyan and emerald luminescence. When the nocturnal wind passes through the giant ferns, the spores produce a chime similar to distant silver bells.

I encountered my first Astral Guardian at dusk. It was no larger than a fox, but composed entirely of crystalline light and woven vines. It watched me sketch for nearly an hour before leaving a cluster of radiant berries beside my lantern.`,
      },
    ],
  },
];
