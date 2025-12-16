/**
 * Newsletter Unsubscribe API
 * POST /api/newsletter/unsubscribe
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/db";

const unsubscribeSchema = z.object({
  token: z.string().min(1, "유효하지 않은 토큰입니다"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = unsubscribeSchema.parse(body);

    // Find subscriber by token
    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "구독 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { error: "이미 구독 취소된 이메일입니다" },
        { status: 400 }
      );
    }

    // Unsubscribe
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "구독이 취소되었습니다",
      email: subscriber.email,
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "구독 취소 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
