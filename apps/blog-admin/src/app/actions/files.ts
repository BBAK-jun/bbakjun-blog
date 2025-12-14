"use server";

import { put, del, list } from "@vercel/blob";
import { processMarkdown } from "@repo/content";
import { revalidatePath } from "next/cache";
import matter from "gray-matter";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

if (!BLOB_TOKEN) {
  throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
}

/**
 * Get file content and metadata from Blob Storage
 */
export async function getFileContent(pathname: string) {
  try {
    // Note: Vercel Blob doesn't support prefix search reliably because files have random suffixes in URLs
    // We need to list all blobs and find the exact pathname match
    const { blobs } = await list({
      token: BLOB_TOKEN,
    });

    const blob = blobs.find((b) => b.pathname === pathname);

    if (!blob) {
      throw new Error(`File not found in Blob Storage: ${pathname}`);
    }

    // Fetch content using the blob's URL
    const response = await fetch(blob.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const rawContent = await response.text();

    // Parse front matter
    const { data: frontMatter, content } = matter(rawContent);

    // Process markdown to HTML
    const htmlContent = await processMarkdown(content);

    return {
      success: true,
      rawContent,
      htmlContent,
      frontMatter: Object.keys(frontMatter).length > 0 ? frontMatter : null,
      metadata: {
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
        url: blob.url,
      },
    };
  } catch (error) {
    console.error("Get file content error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get file",
    };
  }
}

/**
 * Update file content in Blob Storage
 */
export async function updateFile(pathname: string, content: string) {
  try {
    await put(pathname, content, {
      access: "public",
      token: BLOB_TOKEN,
    });

    revalidatePath("/dashboard/files");

    return {
      success: true,
      message: "File updated successfully",
    };
  } catch (error) {
    console.error("Update file error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update file",
    };
  }
}

/**
 * Delete file from Blob Storage
 */
export async function deleteFile(pathname: string) {
  try {
    await del(pathname, { token: BLOB_TOKEN });

    revalidatePath("/dashboard/files");

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("Delete file error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

/**
 * List all markdown files from Blob Storage
 */
export async function listFiles(limit = 100) {
  try {
    const { blobs } = await list({
      token: BLOB_TOKEN,
    });

    const files = blobs
      .filter(
        (blob) =>
          (blob.pathname.endsWith(".md") || blob.pathname.endsWith(".mdx")) &&
          !blob.pathname.includes("/.")
      )
      .slice(0, limit)
      .map((blob) => ({
        filename: blob.pathname.split("/").pop() || blob.pathname,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
        url: blob.url,
      }));

    return {
      success: true,
      files,
      total: files.length,
    };
  } catch (error) {
    console.error("List files error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list files",
      files: [],
      total: 0,
    };
  }
}

/**
 * Preview markdown content as HTML
 */
export async function previewMarkdown(content: string) {
  try {
    const htmlContent = await processMarkdown(content);

    return {
      success: true,
      htmlContent,
    };
  } catch (error) {
    console.error("Preview markdown error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to preview",
      htmlContent: "",
    };
  }
}

/**
 * Upload image to Blob Storage
 */
export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      };
    }

    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
      };
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `images/${timestamp}-${originalName}`;

    const blob = await put(pathname, file, {
      access: "public",
      token: BLOB_TOKEN,
      addRandomSuffix: false,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    };
  } catch (error) {
    console.error("Upload image error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

/**
 * List all images from Blob Storage
 */
export async function listImages(limit = 50) {
  try {
    const { blobs } = await list({
      token: BLOB_TOKEN,
      prefix: "images/",
    });

    const images = blobs
      .filter((blob) => /\.(jpg|jpeg|png|gif|webp)$/i.test(blob.pathname))
      .slice(0, limit)
      .map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        filename: blob.pathname.split("/").pop() || blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
      }));

    return {
      success: true,
      images,
      total: images.length,
    };
  } catch (error) {
    console.error("List images error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list images",
      images: [],
      total: 0,
    };
  }
}
