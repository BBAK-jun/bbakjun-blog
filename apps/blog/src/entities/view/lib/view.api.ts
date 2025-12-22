// View API functions
import type { ViewApiResponse, ViewStatsApiResponse } from './view.model';

// View tracking API endpoints
export async function fetchViews(slug: string): Promise<number> {
  try {
    const response = await fetch(`/api/views/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache', // Cache for 60 seconds as defined in API route
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('Failed to fetch views:', response.statusText);
      return 0;
    }

    const data: ViewApiResponse = await response.json();
    return data.views;
  } catch (error) {
    console.error('Error fetching views:', error);
    return 0;
  }
}

export async function incrementViews(slug: string): Promise<number> {
  try {
    const response = await fetch(`/api/views/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to increment views:', response.statusText);
      return 0;
    }

    const data: ViewApiResponse = await response.json();
    return data.views;
  } catch (error) {
    console.error('Error incrementing views:', error);
    return 0;
  }
}

export async function fetchViewStats(): Promise<{
  totalViews: number;
  popularPosts: Array<{ slug: string; title: string; views: number }>;
}> {
  try {
    const response = await fetch('/api/views/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache', // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('Failed to fetch view stats:', response.statusText);
      return { totalViews: 0, popularPosts: [] };
    }

    const data: ViewStatsApiResponse = await response.json();
    return {
      totalViews: data.totalViews,
      popularPosts: data.popularPosts,
    };
  } catch (error) {
    console.error('Error fetching view stats:', error);
    return { totalViews: 0, popularPosts: [] };
  }
}

// Format views for display
export const formatViews = (views: number): string => {
  return views.toLocaleString('ko-KR');
};

// Check if user is bot (simple heuristic)
export const isBot = (userAgent?: string): boolean => {
  if (!userAgent) return false;

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /crawling/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /slackbot/i,
    /discordbot/i,
    /whatsapp/i,
    /telegram/i,
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
};
