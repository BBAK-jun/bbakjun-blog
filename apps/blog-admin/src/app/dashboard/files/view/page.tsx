/**
 * File View Page
 *
 * Displays file content and metadata using FileViewerWidget
 */

"use client";

import { useSearchParams } from "next/navigation";
import { FileViewerWidget } from "@/widgets/file-viewer";

export default function FileViewPage() {
  const searchParams = useSearchParams();
  const pathname = searchParams?.get("pathname") || null;

  return <FileViewerWidget pathname={pathname} />;
}
