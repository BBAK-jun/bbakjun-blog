import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyApiKey } from "@/shared/lib/auth";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

if (!BLOB_TOKEN) {
  throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
}

/**
 * API endpoint for uploading markdown files
 * Used by migration scripts to upload MDX files to Blob Storage
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
    const path = formData.get("path") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!path?.trim()) {
      return NextResponse.json(
        { success: false, error: "Path is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_EXTENSIONS = [".md", ".mdx"];

    const fileExtension = file.name.substring(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
        },
        { status: 400 }
      );
    }

    // Sanitize path
    const sanitizedPath = path.trim().replace(/^\/+|\/+$/g, "");
    const pathname = `${sanitizedPath}${fileExtension}`;

    // Upload to Blob Storage
    const blob = await put(pathname, file, {
      access: "public",
      token: BLOB_TOKEN,
    });

    return NextResponse.json({
      success: true,
      path: blob.pathname,
      url: blob.url,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload markdown error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
