// View entity types and interfaces

export interface ViewData {
  views: number;
  loading: boolean;
  error: Error | null;
}

export interface ViewCounterProps {
  slug: string;
  increment?: boolean;
  className?: string;
}

export interface ViewBadgeProps {
  slug: string;
  className?: string;
}

export interface ViewStats {
  totalViews: number;
  popularPosts: Array<{
    slug: string;
    title: string;
    views: number;
  }>;
}

// API response types
export interface ViewApiResponse {
  views: number;
}

export interface ViewStatsApiResponse {
  totalViews: number;
  popularPosts: Array<{
    slug: string;
    title: string;
    views: number;
  }>;
}
