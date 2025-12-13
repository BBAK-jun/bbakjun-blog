import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { downloadBlob, getBlobMetadata } from "@/lib/blob";

/**
 * GET /api/admin/file/content
 * 파일 내용 및 메타데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    // API 키 검증
    const isAuthorized = await verifyApiKey();
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // pathname을 쿼리 파라미터에서 가져오기
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("pathname");

    if (!pathname) {
      return NextResponse.json(
        { success: false, error: "pathname is required", code: "MISSING_PATHNAME" },
        { status: 400 }
      );
    }

    // 파일 내용 다운로드
    const buffer = await downloadBlob(pathname);
    const content = buffer.toString("utf-8");

    // 메타데이터 조회
    const metadata = await getBlobMetadata(pathname);

    if (!metadata) {
      return NextResponse.json(
        { success: false, error: "File not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
      metadata: {
        pathname: metadata.pathname,
        size: metadata.size,
        uploadedAt: metadata.uploadedAt,
        url: metadata.url,
      },
    });
  } catch (error) {
    console.error("Get file content error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "FETCH_ERROR",
      },
      { status: 500 }
    );
  }
}
