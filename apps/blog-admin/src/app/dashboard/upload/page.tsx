'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import { uploadMarkdown, uploadMultipleImages } from '@/app/actions/files';

interface UploadResult {
  success: boolean;
  filename: string;
  url?: string;
  pathname?: string;
  size?: number;
  contentType?: string;
  error?: string;
}

export default function UploadPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'markdown' | 'images'>('markdown');

  // Markdown upload state
  const [file, setFile] = useState<File | null>(null);
  const [path, setPath] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePath, setImagePath] = useState('');
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  // Markdown upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      path,
      tags,
      status,
    }: {
      file: File;
      path: string;
      tags: string;
      status: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path.trim());
      formData.append('tags', tags.trim());
      formData.append('status', status);

      const result = await uploadMarkdown(formData);
      if (!result.success) {
        throw new Error(result.error || '업로드 중 오류가 발생했습니다.');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setFile(null);
      setPath('');
      setTags('');
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
  });

  // Multiple images upload mutation
  const uploadImagesMutation = useMutation({
    mutationFn: async ({ files, pathname }: { files: File[]; pathname: string }) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      if (pathname.trim()) {
        formData.append('pathname', pathname.trim());
      }

      const result = await uploadMultipleImages(formData);
      if (!result.success && !result.results) {
        throw new Error(result.error || '이미지 업로드 중 오류가 발생했습니다.');
      }
      return result;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      if (data.results) {
        setUploadResults(data.results);
      }
    },
  });

  const handleMarkdownFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      uploadMutation.reset();
    }
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setImageFiles(selectedFiles);
      uploadImagesMutation.reset();
      setUploadResults([]);
    }
  };

  const handleRemoveImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMarkdownUpload = () => {
    if (!file || !path.trim()) {
      return;
    }
    uploadMutation.mutate({ file, path, tags, status });
  };

  const handleImagesUpload = () => {
    if (imageFiles.length === 0) return;
    uploadImagesMutation.mutate({ files: imageFiles, pathname: imagePath });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === 'markdown'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            마크다운 업로드
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === 'images'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            이미지 업로드
          </button>
        </nav>
      </div>

      <div className="p-8">
        {activeTab === 'markdown' ? (
          // Markdown Upload Tab
          <>
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
                  <p className="text-sm text-red-700 dark:text-red-300">{uploadMutation.error.message}</p>
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
                    onChange={handleMarkdownFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <div className="text-center">
                      <UploadIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {file ? file.name : '클릭하여 파일 선택'}
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
                  onChange={e => setPath(e.target.value)}
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
                  onChange={e => setTags(e.target.value)}
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
                  onChange={e => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLISHED">게시됨</option>
                  <option value="DRAFT">임시저장</option>
                </select>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleMarkdownUpload}
                disabled={uploadMutation.isPending || !file || !path.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {uploadMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
          </>
        ) : (
          // Images Upload Tab
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                이미지 파일 업로드
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                여러 이미지를 한 번에 Vercel Blob Storage에 업로드합니다 (최대 20개)
              </p>
            </div>

            <div className="space-y-6">
              {/* Upload Results Summary */}
              {uploadResults.length > 0 && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      업로드 완료: {uploadResults.filter(r => r.success).length} / {uploadResults.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded ${
                          result.success
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{result.filename}</span>
                        </div>
                        {result.success && result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-2"
                          >
                            보기
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadImagesMutation.isError && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{uploadImagesMutation.error.message}</p>
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  파일 선택 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="images-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleImageFilesChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="images-upload"
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {imageFiles.length > 0
                          ? `${imageFiles.length}개 파일 선택됨`
                          : '클릭하여 이미지 선택 (여러 파일 가능)'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        JPG, PNG, GIF, WEBP (각 파일 최대 10MB, 최대 20개)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Selected Files List */}
              {imageFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    선택된 파일 ({imageFiles.length})
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {imageFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ImageIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveImageFile(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          type="button"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Path Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  저장 경로 (선택사항)
                </label>
                <input
                  type="text"
                  value={imagePath}
                  onChange={e => setImagePath(e.target.value)}
                  placeholder="예: posts/2024 또는 images/blog"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  비워두면 기본 경로(images/)에 저장됩니다
                </p>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleImagesUpload}
                disabled={uploadImagesMutation.isPending || imageFiles.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {uploadImagesMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>업로드 중...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    <span>
                      {imageFiles.length > 0 ? `${imageFiles.length}개 이미지 업로드` : '업로드'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
