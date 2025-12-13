import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { uploadBlob } from "@/entities/file";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    const path = formData.get("path") as string | null;
    const tags = formData.get("tags") as string | null;
    const status = formData.get("status") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided", code: "NO_FILE" },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { success: false, error: "No path provided", code: "NO_PATH" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".md") && !file.name.endsWith(".mdx")) {
      return NextResponse.json(
        {
          success: false,
          error: "Only .md and .mdx files are allowed",
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = uuidv4();
    const timestamp = new Date().toISOString();

    // Upload main file
    const blobPath = `${path}/${file.name}`;
    const uploadResult = await uploadBlob(blobPath, buffer, "text/markdown");

    // Create metadata
    const metadata = {
      id: fileId,
      filename: file.name,
      path,
      size: file.size,
      contentType: "text/markdown",
      uploadedAt: timestamp,
      hash: uploadResult.hash,
      version: 1,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      status: status || "draft",
      url: uploadResult.url,
    };

    // Upload metadata
    await uploadBlob(
      `${path}/.metadata.json`,
      JSON.stringify(metadata, null, 2),
      "application/json"
    );

    return NextResponse.json({
      success: true,
      fileId,
      version: 1,
      message: "파일이 업로드되었습니다",
      metadata,
    });
  } catch (error) {
    console.error("Upload error:", error);
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
