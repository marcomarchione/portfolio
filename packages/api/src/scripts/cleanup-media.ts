/**
 * Media Cleanup CLI Script
 *
 * Cleans up soft-deleted media files that are older than the specified threshold.
 * Deletes physical files and database records.
 *
 * Usage:
 *   bun run media:cleanup [--days=30] [--dry-run]
 *
 * Options:
 *   --days=N    Days threshold for cleanup (default: 30)
 *   --dry-run   Show what would be cleaned without deleting
 */
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '../db/schema';
import { cleanupExpiredMedia, getCleanupCount } from '../services/media/cleanup';

// Parse command line arguments
const args = process.argv.slice(2);

let daysOld = 30;
let dryRun = false;

for (const arg of args) {
  if (arg.startsWith('--days=')) {
    const value = parseInt(arg.split('=')[1], 10);
    if (!isNaN(value) && value > 0) {
      daysOld = value;
    }
  }
  if (arg === '--dry-run') {
    dryRun = true;
  }
}

// Load configuration
const dbPath = process.env.DATABASE_PATH ?? './data.db';
const uploadsPath = process.env.UPLOADS_PATH ?? './uploads';

console.log('Media Cleanup');
console.log('=============');
console.log(`Database: ${dbPath}`);
console.log(`Uploads: ${uploadsPath}`);
console.log(`Threshold: ${daysOld} days`);
console.log(`Mode: ${dryRun ? 'Dry run' : 'Live'}`);
console.log('');

// Initialize database
let sqlite: Database;
try {
  sqlite = new Database(dbPath);
} catch (error) {
  console.error(`Failed to open database: ${error}`);
  process.exit(1);
}

const db = drizzle(sqlite);

// Run cleanup or dry-run
try {
  if (dryRun) {
    const count = getCleanupCount(db, daysOld);
    console.log(`Would clean up ${count} media records`);
  } else {
    const result = await cleanupExpiredMedia(db, uploadsPath, daysOld);

    console.log('Cleanup complete:');
    console.log(`  Cleaned: ${result.cleaned}`);
    console.log(`  Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      for (const err of result.errors) {
        console.log(`  - Media ID ${err.mediaId} (${err.storageKey}): ${err.error}`);
      }
    }

    // Exit with error code if there were failures
    if (result.failed > 0) {
      process.exit(1);
    }
  }
} catch (error) {
  console.error('Cleanup failed:', error);
  process.exit(1);
} finally {
  sqlite.close();
}

console.log('\nDone.');
