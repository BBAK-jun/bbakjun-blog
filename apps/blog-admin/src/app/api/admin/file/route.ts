import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { deleteBlob } from "@/lib/blob";

/**
 * DELETE /api/admin/file
 * 파일 삭제
 */
export async function DELETE(request: NextRequest) {
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

    // Blob에서 파일 삭제
    await deleteBlob(pathname);

    // 메타데이터 파일도 삭제 시도 (있을 경우)
    try {
      await deleteBlob(`${pathname}/.metadata.json`);
    } catch (error) {
      // 메타데이터 파일이 없을 수도 있으므로 에러 무시
      console.log("Metadata file not found, skipping:", pathname);
    }

    return NextResponse.json({
      success: true,
      message: "파일이 삭제되었습니다",
      pathname,
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "DELETE_ERROR",
      },
      { status: 500 }
    );
  }
}
