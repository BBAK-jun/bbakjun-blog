"use client";

import { FileText, Trash2, Download } from "lucide-react";
import type { BlobFile } from "../model/types";

interface FileListItemProps {
  file: BlobFile;
  onView: (file: BlobFile) => void;
  onDelete: (file: BlobFile) => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
}

export function FileListItem({
  file,
  onView,
  onDelete,
  formatFileSize,
  formatDate,
}: FileListItemProps) {
  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors last:border-b-0">
      <td className="py-3 px-4">
        <button
          onClick={() => onView(file)}
          className="text-left hover:bg-slate-50 dark:hover:bg-slate-800 -mx-2 px-2 py-1 rounded transition-colors w-full"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate">
                {file.title || (
                  <span className="text-slate-400 dark:text-slate-500 italic">
                    제목 없음
                  </span>
                )}
              </div>
              {file.description && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {file.description}
                </div>
              )}
            </div>
          </div>
        </button>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
          {file.pathname}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatFileSize(file.size)}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {file.date ? (
            formatDate(file.date)
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">
              날짜 없음
            </span>
          )}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-2">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="다운로드"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="삭제"
            onClick={() => onDelete(file)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
