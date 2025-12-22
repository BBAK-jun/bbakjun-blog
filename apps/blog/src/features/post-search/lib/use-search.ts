// Search functionality hooks
import { useState, useMemo } from 'react';
import { Post } from '@repo/content';

interface SearchOptions {
  searchIn?: ('title' | 'content' | 'tags')[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export const useSearch = (posts: Post[], options: SearchOptions = {}) => {
  const {
    searchIn: defaultSearchIn = ['title', 'content'],
    caseSensitive: defaultCaseSensitive = false,
    exactMatch: defaultExactMatch = false,
  } = options;

  const [query, setQuery] = useState('');
  const [searchIn, setSearchIn] = useState<('title' | 'content' | 'tags')[]>(defaultSearchIn);
  const [caseSensitive, setCaseSensitive] = useState(defaultCaseSensitive);
  const [exactMatch, setExactMatch] = useState(defaultExactMatch);

  const searchResults = useMemo(() => {
    if (!query.trim()) return posts;

    const searchTerm = caseSensitive ? query : query.toLowerCase();

    return posts.filter(post => {
      const { frontMatter, content } = post;
      const { title, tags } = frontMatter;

      let matches = false;

      // Search in title
      if (searchIn.includes('title')) {
        const titleText = caseSensitive ? title : title.toLowerCase();
        matches = exactMatch ? titleText === searchTerm : titleText.includes(searchTerm);
      }

      // Search in content
      if (!matches && searchIn.includes('content')) {
        const contentText = caseSensitive ? content : content.toLowerCase();
        matches = exactMatch ? contentText === searchTerm : contentText.includes(searchTerm);
      }

      // Search in tags
      if (!matches && searchIn.includes('tags') && tags) {
        matches = tags.some(tag => {
          const tagText = caseSensitive ? tag : tag.toLowerCase();
          return exactMatch ? tagText === searchTerm : tagText.includes(searchTerm);
        });
      }

      return matches;
    });
  }, [posts, query, searchIn, caseSensitive, exactMatch]);

  const clearSearch = () => setQuery('');

  return {
    query,
    setQuery,
    searchResults,
    searchIn,
    setSearchIn,
    caseSensitive,
    setCaseSensitive,
    exactMatch,
    setExactMatch,
    clearSearch,
    hasResults: searchResults.length > 0,
    resultCount: searchResults.length,
  };
};
