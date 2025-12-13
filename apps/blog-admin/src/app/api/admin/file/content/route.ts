import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { downloadBlob, getBlobMetadata } from "@/lib/blob";
import { processMarkdown } from "@repo/content";

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
    const rawContent = buffer.toString("utf-8");

    // 프론트매터와 마크다운 분리
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = rawContent.match(frontMatterRegex);

    let frontMatter: Record<string, any> = {};
    let markdownContent = rawContent;

    if (match) {
      const frontMatterText = match[1];
      markdownContent = match[2];

      // Simple YAML parser
      frontMatterText.split("\n").forEach((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value: any = line.substring(colonIndex + 1).trim();

          // Remove quotes
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          // Parse arrays
          if (value.startsWith("[") && value.endsWith("]")) {
            value = value
              .slice(1, -1)
              .split(",")
              .map((v: string) => v.trim().replace(/['"]/g, ""));
          }

          // Parse booleans
          if (value === "true") value = true;
          if (value === "false") value = false;

          frontMatter[key] = value;
        }
      });
    }

    // 마크다운을 HTML로 변환
    const htmlContent = await processMarkdown(markdownContent);

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
      rawContent,
      htmlContent,
      frontMatter: Object.keys(frontMatter).length > 0 ? frontMatter : null,
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
