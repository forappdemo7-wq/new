#!/usr/bin/env tsx
/**
 * CLI Ingestion Runner for get-now Open Library
 * Usage:
 *   npx tsx scripts/ingest.ts --source=gutenberg --limit=50
 *   npx tsx scripts/ingest.ts --source=all --concurrency=5
 */

import { runIngestionJob, IngestionJobConfig } from '../server/services/ingestionPipeline';

async function main() {
  const args = process.argv.slice(2);
  const config: IngestionJobConfig = {
    source: 'all',
    limit: 20,
    concurrency: 4,
    dryRun: false
  };

  args.forEach((arg) => {
    if (arg.startsWith('--source=')) {
      config.source = arg.split('=')[1] as any;
    }
    if (arg.startsWith('--limit=')) {
      config.limit = parseInt(arg.split('=')[1], 10);
    }
    if (arg.startsWith('--dry-run')) {
      config.dryRun = true;
    }
  });

  console.log('================================================================');
  console.log('🏛️  GET-NOW OPEN LIBRARY — BULK INGESTION PIPELINE');
  console.log('================================================================');
  console.log(`Source Target: ${config.source.toUpperCase()}`);
  console.log(`Batch Limit:   ${config.limit} items per connector`);
  console.log(`Dry Run Mode:  ${config.dryRun ? 'ENABLED' : 'DISABLED'}`);
  console.log('----------------------------------------------------------------');

  try {
    const summary = await runIngestionJob(config);

    console.log('\n✅ INGESTION COMPLETED SUCCESSFULLY');
    console.log(`Job ID:            ${summary.jobId}`);
    console.log(`Total Processed:   ${summary.totalProcessed}`);
    console.log(`Published (Safe):  ${summary.publishedCount}`);
    console.log(`Needs Legal Rev:   ${summary.needsReviewCount}`);
    console.log(`Rejected:          ${summary.rejectedCount}`);
    console.log('================================================================\n');

    summary.items.forEach((item, index) => {
      const icon = item.status === 'published' ? '🟢' : item.status === 'needs_review' ? '🟡' : '🔴';
      console.log(`${icon} [${index + 1}/${summary.totalProcessed}] [${item.type.toUpperCase()}] ${item.title}`);
      console.log(`   Source: ${item.source} (${item.sourceId}) | License: ${item.licenseCode} | Jurisdiction: ${item.jurisdiction}`);
      if (item.reason) {
        console.log(`   Notes:  ${item.reason}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ingestion pipeline failed:', error);
    process.exit(1);
  }
}

main();
