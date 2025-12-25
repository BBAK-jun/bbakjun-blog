#!/usr/bin/env node

/**
 * Index all blog posts into RAG system
 * Usage: node scripts/index-blog.js [--force] [--batch-size=10]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');
const batchSize = parseInt(
  args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '10'
);

console.log('🚀 Starting blog indexing for RAG system...');
console.log(`Options: force=${force}, batch-size=${batchSize}`);

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.error('❌ .env.local file not found!');
  console.error('Please create .env.local with required RAG environment variables:');
  console.error('- QDRANT_URL');
  console.error('- GLM_API_KEY');
  console.error('- OPENAI_API_KEY');
  process.exit(1);
}

// Check if Docker services are running
try {
  console.log('📋 Checking Docker services...');
  const dockerCompose = execSync('docker-compose ps', { encoding: 'utf8' });

  if (!dockerCompose.includes('qdrant')) {
    console.log('🐳 Starting Docker services...');
    execSync('docker-compose up -d qdrant redis', { stdio: 'inherit' });
    console.log('⏳ Waiting for services to be ready...');
    setTimeout(() => {}, 5000); // Wait 5 seconds
  }
} catch (error) {
  console.error('❌ Failed to check/start Docker services:', error.message);
  process.exit(1);
}

// Build RAG packages
console.log('📦 Building RAG packages...');
try {
  execSync('pnpm build:filter=rag-*', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to build RAG packages:', error.message);
  process.exit(1);
}

// Trigger ingestion
console.log('📚 Triggering document ingestion...');
try {
  const curlCommand = `curl -X POST http://localhost:3002/api/rag/ingest ${
    force ? '-d "{\"force\":true}"' : ''
  } -H "Content-Type: application/json"`;

  const response = execSync(curlCommand, { encoding: 'utf8' });
  const result = JSON.parse(response);

  console.log('✅ Ingestion started!');
  console.log(`Job ID: ${result.jobId}`);

  // Poll for completion
  console.log('⏳ Monitoring ingestion progress...');
  let completed = false;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (!completed && attempts < maxAttempts) {
    attempts++;

    try {
      const statusResponse = execSync(
        `curl http://localhost:3002/api/rag/ingest/status?jobId=${result.jobId}`,
        { encoding: 'utf8' }
      );
      const status = JSON.parse(statusResponse);

      const percentage = status.progress.percentage || 0;
      const processed = status.progress.processed || 0;
      const total = status.progress.total || 0;

      console.log(`📊 Progress: ${percentage.toFixed(1)}% (${processed}/${total})`);

      if (status.status === 'completed') {
        completed = true;
        console.log('✅ Ingestion completed successfully!');

        // Show statistics
        if (status.progress) {
          console.log(`📈 Statistics:`);
          console.log(`   - Total documents: ${status.progress.total}`);
          console.log(`   - Processed: ${status.progress.processed}`);
          console.log(`   - Failed: ${status.progress.failed}`);
          console.log(
            `   - Duration: ${Math.round(
              (new Date(status.completedAt) - new Date(status.startedAt)) / 1000
            )} seconds`
          );
        }
        break;
      } else if (status.status === 'failed') {
        console.error('❌ Ingestion failed!');
        console.error('Check the RAG gateway logs for details.');
        process.exit(1);
      }
    } catch (error) {
      console.error('⚠️ Failed to check status:', error.message);
    }

    // Wait before next check
    setTimeout(() => {}, 5000);
  }

  if (!completed) {
    console.error('⏰ Ingestion timed out after 5 minutes');
    console.error("Check the RAG gateway logs to see if it's still running");
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to trigger ingestion:', error.message);

  // Check if RAG gateway is running
  try {
    execSync('curl http://localhost:3002/health', { stdio: 'pipe' });
  } catch {
    console.log('💡 RAG gateway is not running. Start it with:');
    console.log('   pnpm dev:rag-gateway');
  }

  process.exit(1);
}

console.log('\n🎉 Blog indexing completed!');
console.log('\n📚 You can now search your blog using RAG:');
console.log('   curl -X POST http://localhost:3002/api/rag/query \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"query":"TypeScript generics explained"}\'');
