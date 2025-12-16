/**
 * Newsletter Subscribers List API
 * GET /api/newsletter/subscribers
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all subscribers
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      select: {
        id: true,
        email: true,
        subscribedAt: true,
        unsubscribedAt: true,
        isActive: true,
        source: true,
      },
    });

    // Calculate stats
    const stats = {
      total: subscribers.length,
      active: subscribers.filter((s) => s.isActive).length,
      inactive: subscribers.filter((s) => !s.isActive).length,
    };

    return NextResponse.json({
      subscribers,
      stats,
    });
  } catch (error) {
    console.error("Subscribers list error:", error);
    return NextResponse.json(
      { error: "구독자 목록을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
