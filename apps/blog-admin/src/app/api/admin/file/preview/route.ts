import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { processMarkdown } from "@repo/content";

/**
 * POST /api/admin/file/preview
 * 마크다운 미리보기 생성
 */
export async function POST(request: NextRequest) {
  try {
    // API 키 검증
    const isAuthorized = await verifyApiKey();
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 요청 본문에서 content 가져오기
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "content is required", code: "MISSING_CONTENT" },
        { status: 400 }
      );
    }

    // 마크다운을 HTML로 변환
    const htmlContent = await processMarkdown(content);

    return NextResponse.json({
      success: true,
      htmlContent,
    });
  } catch (error) {
    console.error("Preview generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "PREVIEW_ERROR",
      },
      { status: 500 }
    );
  }
}
