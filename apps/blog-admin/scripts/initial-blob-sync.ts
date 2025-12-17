/**
 * Initial Blob CDC Sync Script (TypeScript)
 * Run with: npx tsx scripts/initial-blob-sync.ts
 */

import 'dotenv/config';
import { syncBlobToDatabase } from '../src/lib/blob-cdc';

async function main() {
  console.log('🔄 Starting initial Blob CDC sync...\n');

  try {
    const stats = await syncBlobToDatabase();

    console.log('\n✅ Sync completed successfully!\n');
    console.log('📊 Statistics:');
    console.log(`  Total files in Blob:  ${stats.total}`);
    console.log(`  New files added to DB: ${stats.added}`);
    console.log(`  Files marked deleted:  ${stats.deleted}`);
    console.log(`  Existing files updated: ${stats.existing}`);

    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

main();
