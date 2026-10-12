# Contributing Guidelines & Archival Standards

Thank you for your interest in contributing to **get-now Open Library**. We welcome catalog contributions, bug fixes, reader performance improvements, and ingestion connectors.

---

## 🚫 ZERO TOLERANCE: Anti-Piracy & Scanlation Policy

**get-now Open Library is NOT a piracy site, scanlation aggregator, or torrent mirror.**

We will **immediately close and ban** any pull request, automated feed, or contribution that:
1. Contains unauthorized fan scanlations of active commercial manga, webtoons, or light novels.
2. Imports ripped digital comic book releases (e.g., modern Marvel, DC, Image, Shueisha, Kodansha titles under active copyright).
3. Strips DRM or republishes commercial digital editions from Kindle, Kobo, or proprietary stores.
4. Uses torrent or cyberlocker links as source URLs.

Every contribution must provide verifiable provenance from trusted preservation archives (Project Gutenberg, Internet Archive, Smithsonian, Digital Comic Museum, Comic Book Plus, or verified CC-licensed creator repositories).

---

## 🛠️ Codebase Standards

- **TypeScript**: Strict mode enabled. No `any` without explicit justification.
- **Styling**: Tailwind CSS with semantic design tokens (`--font-serif`, `--font-sans`, `--font-mono`, `#F9F8F6` canvas, `#1A1A1A` charcoal).
- **Anti-Slop Visual Guidelines**: 
  - Strict 2:3 aspect ratio on all media cards.
  - No nested card-in-a-card clutter.
  - High-contrast typography and subtle hairline dividers (`#E5E3DD`).
  - No bloated third-party trackers or ad scripts.

---

## 📦 How to Add a New Ingestion Connector

1. Create a connector under `server/services/ingestionPipeline.ts`.
2. Implement license verification utilizing `evaluateLicenseAndJurisdiction()`.
3. Add a test case verifying rate limiting and deduplication.
4. Run `npm run lint` and `npm run test` before submitting a PR.
