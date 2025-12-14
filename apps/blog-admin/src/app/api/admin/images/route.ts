import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { list } from "@vercel/blob";

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
    const limit = parseInt(searchParams.get("limit") || "50");

    // List all images from Blob Storage
    const { blobs } = await list({
      prefix: "images/",
    });

    // Filter and format image files
    const images = blobs
      .filter((blob) => {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(blob.pathname);
        return isImage;
      })
      .map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        filename: blob.pathname.split("/").pop() || blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      images,
      total: images.length,
    });
  } catch (error) {
    console.error("List images error:", error);
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
