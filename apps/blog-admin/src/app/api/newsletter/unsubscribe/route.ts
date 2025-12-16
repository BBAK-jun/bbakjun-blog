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

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// CORS preflight request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

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
        { status: 404, headers: corsHeaders }
      );
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { error: "이미 구독 취소된 이메일입니다" },
        { status: 400, headers: corsHeaders }
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

    return NextResponse.json(
      {
        message: "구독이 취소되었습니다",
        email: subscriber.email,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "구독 취소 중 오류가 발생했습니다" },
      { status: 500, headers: corsHeaders }
    );
  }
}
