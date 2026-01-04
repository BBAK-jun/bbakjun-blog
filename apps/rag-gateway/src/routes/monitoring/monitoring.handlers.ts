import { AppRouteHandler } from '@/libs';
import { InternalServerErrorSchema } from '@/libs/error';
import { getAllJobs, getIngestionStats, getJobStatus } from '@/lib/rag/ingestion';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import * as routes from './monitoring.routes';
import { z } from '@hono/zod-openapi';

export const getAllJobsHandler: AppRouteHandler<typeof routes.getAllJobs> = async c => {
  try {
    const jobs = getAllJobs();

    return c.json(
      {
        jobs,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to get all jobs:', error);
    return c.json(
      {
        error: 'Failed to get jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      } satisfies z.infer<typeof InternalServerErrorSchema>,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getStatsHandler: AppRouteHandler<typeof routes.getStats> = async c => {
  try {
    const stats = getIngestionStats();

    return c.json(stats, HttpStatusCodes.OK);
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    return c.json(
      {
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      } satisfies z.infer<typeof InternalServerErrorSchema>,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getCurrentJobHandler: AppRouteHandler<typeof routes.getCurrentJob> = async c => {
  try {
    const stats = getIngestionStats();
    const currentJob = stats.currentJob;

    return c.json(
      {
        job: currentJob,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to get current job:', error);
    return c.json(
      {
        error: 'Failed to get current job',
        message: error instanceof Error ? error.message : 'Unknown error',
      } satisfies z.infer<typeof InternalServerErrorSchema>,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getJobByIdHandler: AppRouteHandler<typeof routes.getJobById> = async c => {
  const { id } = c.req.valid('param');

  try {
    const job = getJobStatus(id);

    if (!job) {
      return c.json(
        {
          job: null,
        },
        HttpStatusCodes.OK
      );
    }

    return c.json(
      {
        job,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to get job by ID:', error);
    return c.json(
      {
        error: 'Failed to get job',
        message: error instanceof Error ? error.message : 'Unknown error',
      } satisfies z.infer<typeof InternalServerErrorSchema>,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
