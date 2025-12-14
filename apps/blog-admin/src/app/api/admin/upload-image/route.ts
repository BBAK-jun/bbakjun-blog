import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await verifyApiKey();
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided", code: "NO_FILE" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `images/${timestamp}-${originalName}`;

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error("Upload image error:", error);
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
