require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createUploadHistoryTable() {
  try {
    await client.connect();

    const sql = `
      -- CreateTable
      CREATE TABLE IF NOT EXISTS upload_history (
          id TEXT NOT NULL,
          actionType TEXT NOT NULL,
          pathname TEXT NOT NULL,
          fileUrl TEXT,
          fileSize BIGINT,
          contentType TEXT,
          uploadedBy TEXT NOT NULL,
          createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT upload_history_pkey PRIMARY KEY (id)
      );

      -- CreateIndex
      CREATE INDEX IF NOT EXISTS upload_history_pathname_idx ON upload_history(pathname);
      CREATE INDEX IF NOT EXISTS upload_history_createdAt_idx ON upload_history(createdAt);
      CREATE INDEX IF NOT EXISTS upload_history_actionType_idx ON upload_history(actionType);
    `;

    await client.query(sql);
    console.log('✅ upload_history table created successfully');
  } catch (error) {
    console.error('❌ Error creating upload_history table:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createUploadHistoryTable();
