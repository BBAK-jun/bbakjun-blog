import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { prisma } from "../../shared/lib/db";

// 경력 정보 스키마
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
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    tags: z.string().nullable(),
    sortOrder: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })),
});

// 경력 목록 조회 엔드포인트
const getExperiencesRoute = createRoute({
  method: "get",
  path: "/experiences",
  tags: ["experience"],
  summary: "경력 목록 조회",
  description: "소개 페이지에 표시될 경력 목록을 조회합니다",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(experienceSchema),
          }),
        },
      },
      description: "성공",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            error: z.string(),
          }),
        },
      },
      description: "서버 에러",
    },
  },
});

export const experienceRoutes = {
  getExperiences: getExperiencesRoute,
};

export const experienceHandlers = {
  getExperiences: async (c: any) => {
    try {
      const experiences = await prisma.experience.findMany({
        include: {
          achievements: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: [
          { isCurrent: "desc" }, // 재직중인 것을 먼저
          { sortOrder: "desc" }, // sortOrder가 높을수록 최신
          { createdAt: "desc" }, // 생성일순 (내림차순)
        ],
      });

      return c.json({
        success: true,
        data: experiences,
      });
    } catch (error) {
      console.error("Failed to fetch experiences:", error);
      return c.json(
        {
          success: false,
          error: "경력 정보를 불러오는데 실패했습니다",
        },
        500
      );
    }
  },
};