# get-now Open Library

> An ad-free, privacy-first, non-profit digital archive for public domain and Creative Commons books, comics, and manga.

---

## 🏛️ System Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │              Cloudflare Edge CDN (Global)               │
               └───────────┬────────────────────────────────┬───────────┘
                           │                                │
            ┌──────────────▼──────────────┐   ┌─────────────▼────────────┐
            │   Next.js 14+ Web App       │   │  OPDS 1.2 / 2.0 Feeds    │
            │   (Reader, Catalog, Admin)  │   │  (Kobo, Moon+ Reader)    │
            └──────────────┬──────────────┘   └─────────────┬────────────┘
                           │                                │
        ┌──────────────────┼────────────────────────────────┼──────────────────┐
        │                  │                                │                  │
┌───────▼────────┐ ┌───────▼────────┐             ┌─────────▼────────┐ ┌───────▼────────┐
│  PostgreSQL    │ │  Meilisearch   │             │   Redis / BullMQ │ │ Cloudflare R2  │
│  (Prisma ORM)  │ │  (Faceted API) │             │   (Job Queues)   │ │ (EPUB, CBZ)    │
└────────────────┘ └────────────────┘             └─────────▲────────┘ └────────────────┘
                                                            │
                                                  ┌─────────┴────────┐
                                                  │ Bulk Ingestion   │
                                                  │ Pipeline Engine  │
                                                  └─────────▲────────┘
                                                            │
                     ┌──────────────────────────────────────┴──────────────────────────────────────┐
                     │                                                                             │
          ┌──────────┴──────────┐   ┌──────────────────────┴──────────────────────┐   ┌────────────┴────────────┐
          │   Books Pipeline    │   │             Comics Pipeline                 │   │     Manga Pipeline      │
          │ Project Gutenberg   │   │ Digital Comic Museum (Golden Age)           │   │ Smithsonian Hokusai CC0 │
          │ Standard Ebooks     │   │ Comic Book Plus (Silver Age)                │   │ Wikimedia Commons (PD)  │
          │ Internet Archive    │   │ xkcd / Pepper&Carrot / Diesel Sweeties      │   │ Ubunchu! (CC-BY-NC)     │
          └─────────────────────┘   └─────────────────────────────────────────────┘   └─────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 20+
- Docker & Docker Compose (for local Postgres, Redis, Meilisearch)

### 2. Local Environment Setup
```bash
# Clone the repository
git clone https://github.com/get-now/open-library.git
cd open-library

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start local backing services (PostgreSQL, Redis, Meilisearch)
docker-compose up -d postgres redis meilisearch

# Start dev server
npm run dev
```

### 3. Running Bulk Ingestion via CLI
```bash
# Ingest all sources (Gutenberg, Internet Archive, DCM, Smithsonian)
npm run ingest -- --source=all --limit=50

# Ingest only Golden Age Comics from Digital Comic Museum
npm run ingest -- --source=dcm --limit=100

# Test run without persisting changes
npm run ingest -- --source=gutenberg --dry-run
```

---

## 📚 OPDS 1.2 & 2.0 Feeds

Connect standard e-readers (Kobo, Moon+ Reader, Panels, Tachiyomi/Mihon, BookFusion):

- **OPDS 1.2 Catalog Root**: `/api/opds/catalog.xml`
- **OPDS 2.0 JSON-LD Feed**: `/api/opds/v2/catalog.json`
- **Comics Section Feed**: `/api/opds/comics.xml`
- **Manga Section Feed**: `/api/opds/manga.xml`

---

## 🛡️ License & Legal Framework

Please review [LICENSING.md](./LICENSING.md) for our strict legal checks and [CONTRIBUTING.md](./CONTRIBUTING.md) for our anti-piracy policies.
