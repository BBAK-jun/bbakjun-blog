require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function markMigrationApplied() {
  try {
    await client.connect();

    // Check if _prisma_migrations table exists, if not create it
    await client.query(`
      CREATE TABLE IF NOT EXISTS _prisma_migrations (
        id TEXT NOT NULL,
        checksum TEXT NOT NULL,
        finished_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        migration_name TEXT NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMP(3),
        started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        applied_steps_count INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY (id)
      );
    `);

    // Mark the migration as applied
    const migrationId = '20250102000000_add_upload_history';
    const migrationName = '20250102000000_add_upload_history';
    const checksum = 'a1b2c3d4e5f6'; // placeholder checksum

    await client.query(`
      INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
      ON CONFLICT (id) DO NOTHING;
    `, [migrationId, checksum, migrationName]);

    console.log('✅ Migration marked as applied');
  } catch (error) {
    console.error('❌ Error marking migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

markMigrationApplied();
