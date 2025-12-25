import type { AppRouteHandler } from '@/rpc/libs';
import { prisma } from '@/shared/lib/db';
import * as routes from './experience.routes';

export const getExperiences: AppRouteHandler<typeof routes.getExperiences> = async (c) => {
  const experiences = await prisma.experience.findMany({
    include: {
      achievements: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
    orderBy: [
      { isCurrent: 'desc' },
      { sortOrder: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return c.json(
    {
      success: true as const,
      data: experiences,
    },
    200
  );
};
