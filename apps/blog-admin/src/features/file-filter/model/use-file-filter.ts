/**
 * File Filter Feature - Business Logic Hook
 */

import { useMemo } from "react";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import type { BlobFile } from "@/entities/file";
import type { SortOption } from "./types";

const sortOptions: SortOption[] = [
  "name-asc",
  "name-desc",
  "date-asc",
  "date-desc",
  "size-asc",
  "size-desc",
];

export function useFileFilter(files: BlobFile[]) {
  const [{ category, sort }, setFilters] = useQueryStates(
    {
      category: parseAsString.withDefault("all"),
      sort: parseAsStringEnum<SortOption>(sortOptions).withDefault("date-desc"),
    },
    { history: "push" }
  );

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    files.forEach((file) => {
      const cat = file.pathname.split("/")[0];
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [files]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    // Apply category filter
    if (category !== "all") {
      result = result.filter((file) => file.pathname.startsWith(category + "/"));
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.filename.localeCompare(b.filename);
        case "name-desc":
          return b.filename.localeCompare(a.filename);
        case "date-asc": {
          const dateA = a.date
            ? new Date(a.date).getTime()
            : new Date(a.uploadedAt).getTime();
          const dateB = b.date
            ? new Date(b.date).getTime()
            : new Date(b.uploadedAt).getTime();
          return dateA - dateB;
        }
        case "date-desc": {
          const dateA = a.date
            ? new Date(a.date).getTime()
            : new Date(a.uploadedAt).getTime();
          const dateB = b.date
            ? new Date(b.date).getTime()
            : new Date(b.uploadedAt).getTime();
          return dateB - dateA;
        }
        case "size-asc":
          return a.size - b.size;
        case "size-desc":
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return result;
  }, [files, category, sort]);

  const clearFilters = () => {
    setFilters({
      category: "all",
      sort: "date-desc",
    });
  };

  const hasActiveFilters = category !== "all" || sort !== "date-desc";

  return {
    category,
    sort,
    categories,
    setCategory: (value: string) => setFilters({ category: value }),
    setSort: (value: SortOption) => setFilters({ sort: value }),
    clearFilters,
    filteredAndSortedFiles,
    hasActiveFilters,
  };
}
