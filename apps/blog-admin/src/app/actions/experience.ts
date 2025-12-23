"use server";

import { auth } from "../../../auth";
import { prisma } from "../../shared/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 경력 생성/수정을 위한 스키마
const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "회사명을 입력해주세요"),
  position: z.string().min(1, "직책을 입력해주세요"),
  team: z.string().optional(),
  period: z.string().min(1, "근무 기간을 입력해주세요"),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
});

// 성과 생성/수정을 위한 스키마
const achievementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "성과 제목을 입력해주세요"),
  description: z.string().min(1, "성과 설명을 입력해주세요"),
  tags: z.string().optional(),
  sortOrder: z.number().default(0),
});

export async function getExperiences() {
  try {
    const experiences = await prisma.experience.findMany({
      include: {
        achievements: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [
        { isCurrent: 'desc' },  // 재직중인 것을 먼저
        { sortOrder: 'desc' },  // sortOrder가 높을수록 최신
        { createdAt: 'desc' },  // 생성일순 (내림차순)
      ],
    });

    return { success: true, data: experiences };
  } catch (error) {
    console.error("Failed to fetch experiences:", error);
    return { success: false, error: "경력 정보를 불러오는데 실패했습니다" };
  }
}

export async function createExperience(data: z.infer<typeof experienceSchema>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const validatedData = experienceSchema.parse(data);

    const experience = await prisma.experience.create({
      data: {
        company: validatedData.company,
        position: validatedData.position,
        team: validatedData.team,
        period: validatedData.period,
        isCurrent: validatedData.isCurrent,
        description: validatedData.description,
        sortOrder: validatedData.sortOrder,
      },
    });

    revalidatePath("/dashboard/experience");
    return { success: true, data: experience };
  } catch (error) {
    console.error("Failed to create experience:", error);
    return { success: false, error: "경력 생성에 실패했습니다" };
  }
}

export async function updateExperience(id: string, data: z.infer<typeof experienceSchema>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const validatedData = experienceSchema.parse(data);

    const experience = await prisma.experience.update({
      where: { id },
      data: {
        company: validatedData.company,
        position: validatedData.position,
        team: validatedData.team,
        period: validatedData.period,
        isCurrent: validatedData.isCurrent,
        description: validatedData.description,
        sortOrder: validatedData.sortOrder,
      },
      include: {
        achievements: true,
      },
    });

    revalidatePath("/dashboard/experience");
    return { success: true, data: experience };
  } catch (error) {
    console.error("Failed to update experience:", error);
    return { success: false, error: "경력 수정에 실패했습니다" };
  }
}

export async function deleteExperience(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "인증이 필요합니다" };
    }

    await prisma.experience.delete({
      where: { id },
    });

    revalidatePath("/dashboard/experience");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete experience:", error);
    return { success: false, error: "경력 삭제에 실패했습니다" };
  }
}

export async function createAchievement(
  experienceId: string,
  data: z.infer<typeof achievementSchema>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const validatedData = achievementSchema.parse(data);

    const achievement = await prisma.achievement.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        sortOrder: validatedData.sortOrder,
        experienceId,
      },
    });

    revalidatePath("/dashboard/experience");
    return { success: true, data: achievement };
  } catch (error) {
    console.error("Failed to create achievement:", error);
    return { success: false, error: "성과 생성에 실패했습니다" };
  }
}

export async function updateAchievement(
  id: string,
  data: z.infer<typeof achievementSchema>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const validatedData = achievementSchema.parse(data);

    const achievement = await prisma.achievement.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        sortOrder: validatedData.sortOrder,
      },
    });

    revalidatePath("/dashboard/experience");
    return { success: true, data: achievement };
  } catch (error) {
    console.error("Failed to update achievement:", error);
    return { success: false, error: "성과 수정에 실패했습니다" };
  }
}

export async function deleteAchievement(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "인증이 필요합니다" };
    }

    await prisma.achievement.delete({
      where: { id },
    });

    revalidatePath("/dashboard/experience");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete achievement:", error);
    return { success: false, error: "성과 삭제에 실패했습니다" };
  }
}

// 초기 데이터 시드 (기존 경력 데이터 import용)
export async function seedExperiences() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "인증이 필요합니다" };
    }

    // 기존 데이터가 있는지 확인
    const existingCount = await prisma.experience.count();
    if (existingCount > 0) {
      return { success: false, error: "이미 경력 데이터가 있습니다" };
    }

    // 초기 데이터 (ExperienceTimeline.tsx에서 가져옴)
    const initialData = [
      {
        company: "비바리퍼블리카 (토스)",
        position: "Frontend Developer",
        team: "토스 플레이스",
        period: "2026.01 ~ 재직중",
        isCurrent: true,
        description: "TBD..",
        sortOrder: 100,
      },
      {
        company: "데이원컴퍼니",
        position: "Frontend Developer",
        team: "포도 사업부문 테크팀",
        period: "2024.10 ~ 2025.12",
        isCurrent: false,
        description: "글로벌 외국어 레슨 플랫폼 BEP 달성 기여",
        sortOrder: 90,
      },
      {
        company: "휴톰",
        position: "Software Engineer",
        team: "플랫폼팀",
        period: "2023.06 ~ 2024.10",
        isCurrent: false,
        description: "의료 데이터 라벨링 및 예측 플랫폼 개발",
        sortOrder: 80,
      },
      {
        company: "세진마인드",
        position: "Frontend Engineer",
        team: "개발팀",
        period: "2022.03 ~ 2023.05",
        isCurrent: false,
        description: "특허관리 백오피스 및 온라인 상표 출원 서비스 개발",
        sortOrder: 70,
      },
      {
        company: "무른모",
        position: "Web Developer Intern",
        team: null,
        period: "2021.08 ~ 2021.12",
        isCurrent: false,
        description: "사내 백오피스 시스템 개발",
        sortOrder: 60,
      },
    ];

    const createdExperiences = await prisma.$transaction(
      initialData.map((exp) =>
        prisma.experience.create({
          data: exp,
        })
      )
    );

    revalidatePath("/dashboard/experience");
    return { success: true, data: createdExperiences };
  } catch (error) {
    console.error("Failed to seed experiences:", error);
    return { success: false, error: "초기 데이터 생성에 실패했습니다" };
  }
}