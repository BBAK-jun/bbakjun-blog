// Export main ingestion components
export { IngestionPipeline } from './pipeline';
export { MarkdownCollector } from './collectors/markdown';
export { BlobCollector } from './collectors/blob';
export { SemanticChunker } from './chunkers/semantic';
export { FixedSizeChunker } from './chunkers/fixed-size';
export { TextPreprocessor } from './preprocessors/text';

// Export manager for pipeline instance management
export {
  getIngestionPipeline,
  getJobStatus,
  getAllJobs,
  getRunningJobs,
  getRecentCompletedJobs,
  getIngestionStats,
  startIngestion,
  type IngestionStats,
} from './manager';

// Export types
export type {
  BlobFileInfo,
  PostWithFileInfo,
  IngestionOptions,
  IngestionProgress,
  IngestionJob,
} from './pipeline';
