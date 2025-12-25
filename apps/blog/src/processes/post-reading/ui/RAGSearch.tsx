'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { queryBlogContent, searchBlogPosts } from '@/lib/rag';
import type { RAGQueryResponse, SearchResponse } from '@/lib/rag';
import { Button } from '@repo/ui';
import Link from 'next/link';

interface RAGSearchProps {
  mode?: 'query' | 'search';
  placeholder?: string;
  showSources?: boolean;
}

export function RAGSearch({
  mode = 'query',
  placeholder = '궁금한 것을 검색해보세요...',
  showSources = true,
}: RAGSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGQueryResponse | SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === 'query') {
        const response = await queryBlogContent({ query });
        setResult(response);
      } else {
        const response = await searchBlogPosts({ query });
        setResult(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
          disabled={loading}
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mt-6 space-y-4">
          {mode === 'query' ? (
            // Query Mode - Show answer and sources
            <QueryResult result={result as RAGQueryResponse} showSources={showSources} />
          ) : (
            // Search Mode - Show search results
            <SearchResult result={result as SearchResponse} />
          )}
        </div>
      )}
    </div>
  );
}

function QueryResult({ result, showSources }: { result: RAGQueryResponse; showSources: boolean }) {
  return (
    <>
      {/* Answer */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">답변</h3>
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{result.answer}</p>
        {result.usage && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {result.usage.model} • {result.usage.totalTokens} tokens
            {result.usage.cost && ` • $${result.usage.cost.toFixed(4)}`}
          </div>
        )}
      </div>

      {/* Sources */}
      {showSources && result.sources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">관련 문서</h3>
          <div className="space-y-3">
            {result.sources.map((source, index) => (
              <div key={source.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Link
                      href={source.slug}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {source.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {source.content}
                    </p>
                    {source.metadata?.category && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {source.metadata.category}
                        </span>
                        {source.metadata?.tags?.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {(source.score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function SearchResult({ result }: { result: SearchResponse }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        검색 결과 ({result.total}개, {result.queryTime}ms)
      </h3>
      <div className="space-y-3">
        {result.results.map(item => (
          <div
            key={item.id}
            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <Link href={item.slug} className="block group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.content}
                  </p>
                  {item.metadata?.category && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {item.metadata.category}
                      </span>
                      {item.metadata?.tags?.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {(item.score * 100).toFixed(1)}%
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
