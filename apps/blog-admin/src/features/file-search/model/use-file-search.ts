/**
 * File Search Feature - Business Logic Hook
 */

import { useMemo } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import type { BlobFile } from '@/entities/file';

export function useFileSearch(files: BlobFile[]) {
  const [searchQuery, setSearchQuery] = useQueryState('q', parseAsString.withDefault(''));

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }

    const query = searchQuery.toLowerCase();
    return files.filter(
      file =>
        file.filename.toLowerCase().includes(query) ||
        file.pathname.toLowerCase().includes(query) ||
        file.title?.toLowerCase().includes(query) ||
        file.description?.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  const clearSearch = () => setSearchQuery('');

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredFiles,
    hasSearchQuery: searchQuery !== '',
  };
}
