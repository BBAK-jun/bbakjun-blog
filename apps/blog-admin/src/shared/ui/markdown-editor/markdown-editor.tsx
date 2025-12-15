/**
 * Markdown Editor Component
 *
 * CodeMirror-based markdown editor with toolbar and dark mode support
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Code,
  List,
  ListOrdered,
  Quote,
  Upload,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  onImageClick?: () => void;
  onImageDrop?: (file: File) => Promise<string | void>;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "마크다운 내용을 입력하세요...",
  height = "400px",
  onImageClick,
  onImageDrop,
}: MarkdownEditorProps) {
  const [isDark, setIsDark] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const insertText = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = document.querySelector(".cm-content") as HTMLElement;
      if (!textarea) return;

      const selection = window.getSelection();
      const selectedText = selection?.toString() || placeholder;

      const newText = `${before}${selectedText}${after}`;
      const cursorPos = value.length;

      onChange(
        value.substring(0, cursorPos) + newText + value.substring(cursorPos)
      );
    },
    [value, onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!onImageDrop) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of imageFiles) {
          const url = await onImageDrop(file);
          if (url) {
            const imageMarkdown = `![${file.name}](${url})`;
            onChange(value + "\n" + imageMarkdown + "\n");
          }
        }
      } catch (error) {
        console.error("Image upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [onImageDrop, onChange, value]
  );

  const toolbarButtons = [
    {
      icon: Heading1,
      label: "제목 1",
      action: () => insertText("# ", "", "제목 1"),
    },
    {
      icon: Heading2,
      label: "제목 2",
      action: () => insertText("## ", "", "제목 2"),
    },
    {
      icon: Heading3,
      label: "제목 3",
      action: () => insertText("### ", "", "제목 3"),
    },
    { icon: Bold, label: "굵게", action: () => insertText("**", "**", "텍스트") },
    {
      icon: Italic,
      label: "기울임",
      action: () => insertText("*", "*", "텍스트"),
    },
    {
      icon: Link,
      label: "링크",
      action: () => insertText("[", "](https://)", "링크 텍스트"),
    },
    {
      icon: Image,
      label: "이미지",
      action: onImageClick || (() => insertText("![", "](https://)", "이미지")),
    },
    {
      icon: Code,
      label: "코드블록",
      action: () => insertText("```\n", "\n```", "코드"),
    },
    { icon: Quote, label: "인용", action: () => insertText("> ", "", "인용문") },
    {
      icon: List,
      label: "목록",
      action: () => insertText("- ", "", "항목"),
    },
    {
      icon: ListOrdered,
      label: "번호 목록",
      action: () => insertText("1. ", "", "항목"),
    },
  ];

  return (
    <div
      className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600 flex-wrap">
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              onClick={button.action}
              type="button"
              title={button.label}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <CodeMirror
        value={value}
        height={height}
        extensions={[markdown()]}
        theme={isDark ? oneDark : "light"}
        onChange={onChange}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          syntaxHighlighting: true,
        }}
        className="text-sm"
      />

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-4 border-dashed border-blue-500 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-slate-900 dark:text-white font-semibold">
              이미지를 여기에 드롭하세요
            </p>
          </div>
        </div>
      )}

      {/* Upload Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-slate-900 dark:text-white font-semibold">
              이미지 업로드 중...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
