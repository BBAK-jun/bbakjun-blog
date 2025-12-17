import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

/**
 * On-demand ISR revalidation API
 * Called by blog-admin when content is updated
 *
 * Usage:
 * POST /api/revalidate?secret=<token>&path=/blog/my-post
 * POST /api/revalidate?secret=<token>&all=true (revalidates all blog pages)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const path = searchParams.get("path");
    const all = searchParams.get("all") === "true";

    // Security: Verify secret token
    if (secret !== env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Validate parameters
    if (!path && !all) {
      return NextResponse.json(
        { error: "Either 'path' or 'all=true' parameter is required" },
        { status: 400 }
      );
    }

    const revalidatedPaths: string[] = [];

    // Revalidate specific path
    if (path) {
      revalidatePath(path);
      revalidatedPaths.push(path);

      // Also revalidate the home page and blog list
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatedPaths.push("/", "/blog");
    }

    // Revalidate all blog-related pages
    if (all) {
      // Revalidate with layout option to clear all nested pages
      revalidatePath("/", "layout");
      revalidatePath("/blog", "layout");
      revalidatedPaths.push("/ (layout)", "/blog (layout)");
    }

    return NextResponse.json({
      revalidated: true,
      paths: revalidatedPaths,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to revalidate",
      },
      { status: 500 }
    );
  }
}
