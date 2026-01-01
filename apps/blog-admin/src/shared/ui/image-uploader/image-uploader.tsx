'use client';

import { useState, useRef, useCallback } from 'react';
import { upload } from '@vercel/blob/client';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded: (url: string, filename: string) => void;
  multiple?: boolean;
}

const MAX_SIZE = 25 * 1024 * 1024; // 25MB (client-side upload has no serverless limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function ImageUploader({ onImageUploaded, multiple = false }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`;
    }
    if (file.size > MAX_SIZE) {
      return `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`;
    }
    return null;
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Client-side validation
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Upload directly to Vercel Blob from client using Hono RPC endpoint
      // Pass file size and type via clientPayload to server callback
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/rpc/upload/client-token',
        clientPayload: JSON.stringify({
          size: file.size,
          contentType: file.type,
        }),
      });

      onImageUploaded(blob.url, file.name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('[Image Upload] Error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImages = async (files: FileList | File[]) => {
    setIsUploading(true);
    setError(null);

    const fileArray = Array.from(files);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of fileArray) {
        // Client-side validation
        const validationError = validateFile(file);
        if (validationError) {
          setError(`${file.name}: ${validationError}`);
          failCount++;
          continue;
        }

        try {
          // Step 1: Get upload credentials from server
          const credentialsResult = await getUploadCredentials(file.name);

          if (!credentialsResult.success || !credentialsResult.token || !credentialsResult.pathname) {
            throw new Error(credentialsResult.error || 'Failed to get upload credentials');
          }

          // Step 2: Upload directly to Vercel Blob from client
          const blob = await put(credentialsResult.pathname, file, {
            access: 'public',
            token: credentialsResult.token,
          });

          // Step 3: Sync to CDC database (non-blocking)
          syncUploadedFile({
            url: blob.url,
            pathname: blob.pathname,
            size: file.size,
            contentType: file.type,
          }).catch((err: unknown) => {
            console.error('[CDC Sync] Failed to sync uploaded file:', err);
          });

          onImageUploaded(blob.url, file.name);
          successCount++;
        } catch (err) {
          console.error(`[Image Upload] Error uploading ${file.name}:`, err);
          failCount++;
        }
      }

      if (failCount > 0) {
        setError(`${successCount}개 성공, ${failCount}개 실패`);
      }
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple || files.length > 1) {
        uploadImages(files);
      } else {
        uploadImage(files[0]);
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (multiple || files.length > 1) {
        uploadImages(files);
      } else {
        uploadImage(files[0]);
      }
    } else {
      setError('Please drop an image file');
    }
  }, [multiple]);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="py-4">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Uploading...</p>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full">
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              {multiple ? 'Click to upload or drag and drop (multiple files)' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              PNG, JPG, GIF, WebP up to 25MB{multiple ? ' each' : ''}
            </p>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
