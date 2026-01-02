'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { useEffect, useRef } from 'react';

interface SearchBarClientProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBarClient({
  placeholder = '포스트 검색...',
  className = '',
}: SearchBarClientProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // nuqs로 타입세이프한 URL 상태 관리
  const [query, setQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      scroll: false,
      shallow: true,
    })
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value || null); // 빈 문자열이면 URL에서 파라미터 제거
  };

  const clearSearch = () => {
    setQuery(null); // URL에서 q 파라미터 제거
  };

  // 키보드 단축키 (Cmd+K / Ctrl+K)로 검색창 포커스
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) 또는 Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // ESC로 검색창 닫기 및 검색어 지우기
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (query) {
          clearSearch();
        } else {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          className="block w-full pl-10 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder={placeholder}
        />
        {/* 키보드 단축키 힌트 */}
        {!query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-500 rounded">
              ⌘K
            </kbd>
          </div>
        )}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="검색 지우기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
