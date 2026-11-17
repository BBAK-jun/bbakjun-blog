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
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 min-h-[48px] px-4 sm:px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'markdown'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>마크다운 업로드</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 min-h-[48px] px-4 sm:px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'images'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>이미지 업로드</span>
          </button>
        </nav>
      </div>

      <div className="p-4 md:p-8">
        {activeTab === 'markdown' ? (
          // Markdown Upload Tab
          <>
            <div className="mb-5 md:mb-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">
                마크다운 파일 업로드
              </h2>
              <p className="text-sm text-muted-foreground">
                .md 또는 .mdx 파일을 Vercel Blob Storage에 업로드합니다
              </p>
            </div>

            <div className="space-y-5 md:space-y-6">
              {/* Upload Result - Success */}
              {uploadMutation.isSuccess && uploadMutation.data && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-success-50 border border-success-500/30">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-success-700">
                    파일이 성공적으로 업로드되었습니다: {uploadMutation.data.path}
                  </p>
                </div>
              )}

              {/* Upload Result - Error */}
              {uploadMutation.isError && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-error-50 border border-error-500/30">
                  <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{uploadMutation.error.message}</p>
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  파일 선택 <span className="text-error-600">*</span>
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
                    className="flex items-center justify-center w-full min-h-[160px] px-4 py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-center">
                      <UploadIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-foreground font-medium">
                        {file ? file.name : '클릭하여 파일 선택'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        .md 또는 .mdx 파일만 가능 (최대 10MB)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Path Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  저장 경로 <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  placeholder="예: DEV/my-post 또는 REACT/hooks-guide"
                  className="w-full min-h-[44px] px-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  카테고리/파일명 형식으로 입력하세요
                </p>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  태그 (선택사항)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="예: react, typescript, nextjs"
                  className="w-full min-h-[44px] px-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  쉼표로 구분하여 여러 태그 입력 가능
                </p>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  상태
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                  className="w-full min-h-[44px] px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="PUBLISHED">게시됨</option>
                  <option value="DRAFT">임시저장</option>
                </select>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleMarkdownUpload}
                disabled={uploadMutation.isPending || !file || !path.trim()}
                className="w-full flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground font-medium rounded-lg transition-colors"
              >
                {uploadMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
            <div className="mb-5 md:mb-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">
                이미지 파일 업로드
              </h2>
              <p className="text-sm text-muted-foreground">
                여러 이미지를 한 번에 Vercel Blob Storage에 업로드합니다 (최대 20개)
              </p>
            </div>

            <div className="space-y-5 md:space-y-6">
              {/* Upload Results Summary */}
              {uploadResults.length > 0 && (
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                    <span className="font-medium text-foreground">
                      업로드 완료: {uploadResults.filter(r => r.success).length} / {uploadResults.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded ${
                          result.success ? 'bg-success-50' : 'bg-error-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate text-foreground">{result.filename}</span>
                        </div>
                        {result.success && result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline ml-2 flex-shrink-0"
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
                <div className="flex items-start gap-3 p-4 rounded-lg bg-error-50 border border-error-500/30">
                  <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{uploadImagesMutation.error.message}</p>
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  파일 선택 <span className="text-error-600">*</span>
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
                    className="flex items-center justify-center w-full min-h-[160px] px-4 py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-foreground font-medium">
                        {imageFiles.length > 0
                          ? `${imageFiles.length}개 파일 선택됨`
                          : '클릭하여 이미지 선택 (여러 파일 가능)'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, GIF, WEBP (각 파일 최대 10MB, 최대 20개)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Selected Files List */}
              {imageFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    선택된 파일 ({imageFiles.length})
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {imageFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ImageIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveImageFile(idx)}
                          className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-muted-foreground hover:text-error-600 transition-colors"
                          type="button"
                          aria-label="파일 제거"
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  저장 경로 (선택사항)
                </label>
                <input
                  type="text"
                  value={imagePath}
                  onChange={e => setImagePath(e.target.value)}
                  placeholder="예: posts/2024 또는 images/blog"
                  className="w-full min-h-[44px] px-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  비워두면 기본 경로(images/)에 저장됩니다
                </p>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleImagesUpload}
                disabled={uploadImagesMutation.isPending || imageFiles.length === 0}
                className="w-full flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground font-medium rounded-lg transition-colors"
              >
                {uploadImagesMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
