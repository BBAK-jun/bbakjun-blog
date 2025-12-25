import { createRoute, z } from '@hono/zod-openapi';
import { InternalServerErrorSchema } from '../../libs/error';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';

const achievementSchema = z.object({
  id: z.string(),
  experienceId: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  position: z.string(),
  team: z.string().nullable(),
  period: z.string(),
  isCurrent: z.boolean(),
  description: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  achievements: z.array(achievementSchema),
});

const tags = ['Experience'];

export const getExperiences = createRoute({
  path: '/rpc/getExperiences',
  method: 'get',
  tags,
  summary: 'Get career experiences',
  description: 'Retrieve career timeline with achievements',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.literal(true),
        data: z.array(experienceSchema),
      }),
      'Experiences list'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(InternalServerErrorSchema, 'Server error'),
  },
});
