import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyApiKey } from "@/shared/lib/auth";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

if (!BLOB_TOKEN) {
  throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
}

/**
 * API endpoint for uploading images with custom pathname
 * Used by migration script to preserve original path structure
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || !verifyApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pathname = formData.get("pathname") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit for migration)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
        },
        { status: 400 }
      );
    }

    // Use custom pathname if provided, otherwise generate one
    const finalPathname = pathname || `images/${Date.now()}-${file.name}`;

    // Upload to Blob Storage
    const blob = await put(finalPathname, file, {
      access: "public",
      token: BLOB_TOKEN,
      addRandomSuffix: false, // Keep exact pathname for migration
    });

    return NextResponse.json({
      success: true,
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
        error: error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 }
    );
  }
}
