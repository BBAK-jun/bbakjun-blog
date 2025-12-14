import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to revalidate specific paths
 * Called by blog-admin when content is updated
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    // Revalidate the specific path
    revalidatePath(path);

    // Also revalidate the home page to update the post list
    revalidatePath("/");

    return NextResponse.json({
      revalidated: true,
      path,
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
