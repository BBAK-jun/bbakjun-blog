import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { listBlobs } from "@/entities/file";

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await verifyApiKey();
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    const prefix = category ? `${category}/` : undefined;
    const blobs = await listBlobs(prefix);

    // Filter out metadata files and hidden files
    const files = blobs
      .filter(
        (blob) =>
          !blob.pathname.endsWith(".metadata.json") &&
          !blob.pathname.includes("/.versions/") &&
          (blob.pathname.endsWith(".md") || blob.pathname.endsWith(".mdx"))
      )
      .map((blob) => ({
        filename: blob.filename,
        pathname: blob.pathname,
        path: blob.pathname.replace(/\.(md|mdx)$/, ""),
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        version: 1,
        status: "published",
        url: blob.url,
      }))
      .slice(0, limit);

    return NextResponse.json({
      files,
      total: files.length,
    });
  } catch (error) {
    console.error("Files list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
