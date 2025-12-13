import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { deleteBlob, uploadBlob } from "@/lib/blob";

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

/**
 * PUT /api/admin/file
 * 파일 수정
 */
export async function PUT(request: NextRequest) {
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

    // 요청 본문에서 content 가져오기
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "content is required", code: "MISSING_CONTENT" },
        { status: 400 }
      );
    }

    // 파일을 Blob Storage에 업로드 (덮어쓰기)
    const blob = await uploadBlob(pathname, content);

    return NextResponse.json({
      success: true,
      message: "파일이 수정되었습니다",
      pathname: blob.pathname,
      url: blob.url,
    });
  } catch (error) {
    console.error("Update file error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "UPDATE_ERROR",
      },
      { status: 500 }
    );
  }
}
