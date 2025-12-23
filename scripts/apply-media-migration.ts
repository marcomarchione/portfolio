/**
 * Apply media table migration manually
 *
 * Creates media table if it doesn't exist with all new columns
 * Adds new columns to existing table: deletedAt, variants, width, height
 * Creates index on deletedAt for cleanup queries
 */
import { Database } from 'bun:sqlite';

const dbPath = process.env.DATABASE_PATH ?? './data.db';

console.log(`Opening database at: ${dbPath}`);
const db = new Database(dbPath);

// Check if media table exists
const tableExists = db.query(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='media'"
).all();

if (tableExists.length === 0) {
  // Create the full media table with new columns
  console.log('Creating media table with all columns...');
  db.exec(`
    CREATE TABLE media (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_key TEXT NOT NULL UNIQUE,
      alt_text TEXT,
      created_at INTEGER NOT NULL,
      deleted_at INTEGER,
      variants TEXT,
      width INTEGER,
      height INTEGER
    );
    CREATE INDEX idx_media_created_at ON media(created_at);
    CREATE INDEX idx_media_storage_key ON media(storage_key);
    CREATE INDEX idx_media_deleted_at ON media(deleted_at);
  `);
  console.log('Created media table with all columns and indexes');
} else {
  // Add columns to existing table
  const tableInfo = db.query('PRAGMA table_info(media)').all();
  const columns = tableInfo.map((col: { name: string }) => col.name);

  console.log('Current columns:', columns);

  try {
    // Add deleted_at column if it doesn't exist
    if (!columns.includes('deleted_at')) {
      console.log('Adding deleted_at column...');
      db.exec('ALTER TABLE media ADD COLUMN deleted_at INTEGER;');
      console.log('Added deleted_at column');
    }

    // Add variants column if it doesn't exist
    if (!columns.includes('variants')) {
      console.log('Adding variants column...');
      db.exec('ALTER TABLE media ADD COLUMN variants TEXT;');
      console.log('Added variants column');
    }

    // Add width column if it doesn't exist
    if (!columns.includes('width')) {
      console.log('Adding width column...');
      db.exec('ALTER TABLE media ADD COLUMN width INTEGER;');
      console.log('Added width column');
    }

    // Add height column if it doesn't exist
    if (!columns.includes('height')) {
      console.log('Adding height column...');
      db.exec('ALTER TABLE media ADD COLUMN height INTEGER;');
      console.log('Added height column');
    }

    // Create index on deleted_at if it doesn't exist
    const indexes = db.query(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='media' AND name='idx_media_deleted_at'"
    ).all();

    if (indexes.length === 0) {
      console.log('Creating idx_media_deleted_at index...');
      db.exec('CREATE INDEX idx_media_deleted_at ON media(deleted_at);');
      console.log('Created idx_media_deleted_at index');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

// Verify migration
const newTableInfo = db.query('PRAGMA table_info(media)').all();
const newColumns = newTableInfo.map((col: { name: string }) => col.name);
console.log('\nMigration complete. Columns:', newColumns);

const newIndexes = db.query(
  "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='media'"
).all();
console.log('Indexes:', newIndexes.map((idx: { name: string }) => idx.name));

db.close();
console.log('\nMedia table migration completed successfully!');
