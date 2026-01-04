/**
 * Ingestion Pipeline Manager
 *
 * Manages the singleton IngestionPipeline instance and provides
 * access to job status across requests.
 */

import { IngestionPipeline, IngestionJob, IngestionOptions } from './pipeline';
import { getQdrantService } from '@/services/qdrant';
import { getEmbeddingService } from '@/services/embedding';

let pipelineInstance: IngestionPipeline | null = null;

/**
 * Get or create the singleton IngestionPipeline instance
 */
export function getIngestionPipeline(): IngestionPipeline {
  if (!pipelineInstance) {
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();
    pipelineInstance = new IngestionPipeline(qdrantService, embeddingService);

    // Clean up old jobs periodically (every hour)
    setInterval(() => {
      pipelineInstance?.cleanupJobs(24);
    }, 60 * 60 * 1000);
  }

  return pipelineInstance;
}

/**
 * Get job status by ID
 */
export function getJobStatus(jobId: string): IngestionJob | null {
  const pipeline = getIngestionPipeline();
  return pipeline.getJobStatus(jobId);
}

/**
 * Get all jobs
 */
export function getAllJobs(): IngestionJob[] {
  const pipeline = getIngestionPipeline();
  return pipeline.getAllJobs();
}

/**
 * Get running jobs
 */
export function getRunningJobs(): IngestionJob[] {
  const jobs = getAllJobs();
  return jobs.filter(job => job.status === 'running');
}

/**
 * Get recent completed jobs (last 24 hours)
 */
export function getRecentCompletedJobs(limit: number = 10): IngestionJob[] {
  const jobs = getAllJobs();
  const completed = jobs
    .filter(job => job.status === 'completed' || job.status === 'failed')
    .sort((a, b) => {
      const timeA = new Date(a.completedAt || a.startedAt).getTime();
      const timeB = new Date(b.completedAt || b.startedAt).getTime();
      return timeB - timeA; // Most recent first
    });

  return completed.slice(0, limit);
}

/**
 * Get ingestion statistics
 */
export interface IngestionStats {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  currentJob: IngestionJob | null;
  recentJobs: IngestionJob[];
}

export function getIngestionStats(): IngestionStats {
  const jobs = getAllJobs();

  const runningJobs = jobs.filter(job => job.status === 'running');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  return {
    totalJobs: jobs.length,
    runningJobs: runningJobs.length,
    completedJobs: completedJobs.length,
    failedJobs: failedJobs.length,
    currentJob: runningJobs[0] || null,
    recentJobs: getRecentCompletedJobs(5),
  };
}

/**
 * Start ingestion with options
 */
export async function startIngestion(options: IngestionOptions = {}): Promise<string> {
  const pipeline = getIngestionPipeline();
  return pipeline.startIngestion(options);
}
