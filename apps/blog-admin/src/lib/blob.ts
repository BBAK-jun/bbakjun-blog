import { put, list, del, head } from "@vercel/blob";
import { createHash } from "crypto";

export async function uploadBlob(
  path: string,
  content: Buffer | string,
  contentType: string = "text/markdown"
): Promise<{
  url: string;
  pathname: string;
  hash: string;
}> {
  try {
    // Create hash
    const buffer = typeof content === "string" ? Buffer.from(content) : content;
    const hash = createHash("sha256").update(buffer).digest("hex");

    // Upload to Vercel Blob
    const blob = await put(path, buffer, {
      contentType,
      access: "public",
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      hash: `sha256:${hash}`,
    };
  } catch (error) {
    console.error("Upload blob error:", error);
    throw error;
  }
}

export async function downloadBlob(path: string): Promise<Buffer> {
  try {
    // First, get the blob metadata to retrieve the URL
    const metadata = await getBlobMetadata(path);
    if (!metadata) {
      throw new Error(`Blob not found: ${path}`);
    }

    // Download the blob content using the URL
    const response = await fetch(metadata.url);
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("Download blob error:", error);
    throw error;
  }
}

export async function deleteBlob(path: string): Promise<void> {
  try {
    await del(path);
  } catch (error) {
    console.error("Delete blob error:", error);
    throw error;
  }
}

export async function listBlobs(prefix?: string) {
  try {
    const { blobs } = await list({
      prefix,
    });

    return blobs.map((blob) => ({
      filename: blob.pathname.split("/").pop() || blob.pathname,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt?.toISOString() || new Date().toISOString(),
      url: blob.url,
    }));
  } catch (error) {
    console.error("List blobs error:", error);
    throw error;
  }
}

export async function getBlobMetadata(path: string) {
  try {
    // Use list() with the exact pathname as prefix to find the blob
    const { blobs } = await list({
      prefix: path,
      limit: 1,
    });

    // Find exact match (list returns blobs with prefix, we need exact match)
    const blob = blobs.find((b) => b.pathname === path);

    if (!blob) {
      return null;
    }

    return {
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt?.toISOString(),
      url: blob.url,
    };
  } catch (error) {
    console.error("Get blob metadata error:", error);
    return null;
  }
}
