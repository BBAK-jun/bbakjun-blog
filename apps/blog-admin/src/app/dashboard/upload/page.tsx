"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { uploadMarkdown } from "@/app/actions/files";

export default function UploadPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [path, setPath] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, path, tags, status }: { file: File; path: string; tags: string; status: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path.trim());
      formData.append("tags", tags.trim());
      formData.append("status", status);

      const result = await uploadMarkdown(formData);
      if (!result.success) {
        throw new Error(result.error || "업로드 중 오류가 발생했습니다.");
      }
      return result;
    },
    onSuccess: () => {
      // 파일 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["files"] });

      // 성공 시 폼 초기화
      setFile(null);
      setPath("");
      setTags("");

      // input file 초기화
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      uploadMutation.reset(); // 이전 결과 초기화
    }
  };

  const handleUpload = () => {
    if (!file || !path.trim()) {
      return;
    }

    uploadMutation.mutate({ file, path, tags, status });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          마크다운 파일 업로드
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          .md 또는 .mdx 파일을 Vercel Blob Storage에 업로드합니다
        </p>
      </div>

      <div className="space-y-6">
        {/* Upload Result - Success */}
        {uploadMutation.isSuccess && uploadMutation.data && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">
              파일이 성공적으로 업로드되었습니다: {uploadMutation.data.path}
            </p>
          </div>
        )}

        {/* Upload Result - Error */}
        {uploadMutation.isError && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {uploadMutation.error.message}
            </p>
          </div>
        )}

        {/* Validation Error */}
        {!file && uploadMutation.isIdle && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800" style={{ display: 'none' }}>
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              파일과 경로를 모두 입력해주세요.
            </p>
          </div>
        )}

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            파일 선택 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="file-upload"
              type="file"
              accept=".md,.mdx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="text-center">
                <UploadIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {file ? file.name : "클릭하여 파일 선택"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  .md 또는 .mdx 파일만 가능 (최대 10MB)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Path Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            저장 경로 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="예: DEV/my-post 또는 REACT/hooks-guide"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            카테고리/파일명 형식으로 입력하세요
          </p>
        </div>

        {/* Tags Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            태그 (선택사항)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="예: react, typescript, nextjs"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            쉼표로 구분하여 여러 태그 입력 가능
          </p>
        </div>

        {/* Status Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            상태
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PUBLISHED">게시됨</option>
            <option value="DRAFT">임시저장</option>
          </select>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploadMutation.isPending || !file || !path.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {uploadMutation.isPending ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>업로드 중...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span>업로드</span>
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 벌크 업로드
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          여러 파일을 한 번에 업로드하려면 터미널에서 <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">pnpm upload-posts</code> 명령어를 사용하세요.
        </p>
      </div>
    </div>
  );
}
