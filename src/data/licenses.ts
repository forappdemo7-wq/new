import { LicenseInfo } from '../types';

export const LICENSE_REGISTRY: Record<string, LicenseInfo> = {
  'COMMUNITY_OPEN': {
    code: 'COMMUNITY_OPEN',
    name: 'Community Open Creation',
    category: 'creative_commons',
    shortDesc: 'Unrestricted reading and sharing for all community members.',
    fullDesc: 'Freely readable and shareable across the platform.',
    permissions: ['Read', 'Share', 'Comment'],
    requirements: ['Attribution'],
    prohibitions: [],
    officialUrl: 'https://creativecommons.org/licenses/by/4.0/',
    badgeText: 'Community Open',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
  },
  'CC-BY': {
    code: 'CC-BY',
    name: 'Creative Commons Attribution 4.0',
    category: 'creative_commons',
    shortDesc: 'Allows re-distribution and re-use with attribution.',
    fullDesc: 'Creative Commons Attribution 4.0 International.',
    permissions: ['Read', 'Adapt', 'Commercial Use'],
    requirements: ['Attribution'],
    prohibitions: [],
    officialUrl: 'https://creativecommons.org/licenses/by/4.0/',
    badgeText: 'CC-BY',
    allowsHosting: true,
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
  },
};

export const LICENSES_REGISTRY = LICENSE_REGISTRY;

export function getLicenseInfo(code: string): LicenseInfo {
  return LICENSE_REGISTRY[code] || LICENSE_REGISTRY['COMMUNITY_OPEN'];
}
