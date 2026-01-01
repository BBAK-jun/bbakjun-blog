'use client';

import { useState, useRef, useCallback } from 'react';
import { put } from '@vercel/blob/client';
import { Upload, X, Loader2 } from 'lucide-react';
import { getUploadCredentials, syncUploadedFile } from '@/app/actions/files';

interface ImageUploaderProps {
  onImageUploaded: (url: string, filename: string) => void;
}

const MAX_SIZE = 25 * 1024 * 1024; // 25MB (client-side upload has no serverless limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
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

      // Step 1: Get upload credentials from server
      const credentialsResult = await getUploadCredentials(file.name);

      if (!credentialsResult.success || !credentialsResult.token || !credentialsResult.pathname) {
        throw new Error(credentialsResult.error || 'Failed to get upload credentials');
      }

      // Step 2: Upload directly to Vercel Blob from client (bypasses 4.5MB serverless limit)
      const blob = await put(credentialsResult.pathname, file, {
        access: 'public',
        token: credentialsResult.token,
        addRandomSuffix: false,
      });

      // Step 3: Sync to CDC database (non-blocking)
      syncUploadedFile({
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        contentType: file.type,
      }).catch(err => {
        console.error('[CDC Sync] Failed to sync uploaded file:', err);
        // Non-critical: Blob Storage is the source of truth
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImage(file);
    } else {
      setError('Please drop an image file');
    }
  }, []);

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
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              PNG, JPG, GIF, WebP up to 25MB
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
