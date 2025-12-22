/**
 * Query keys for newsletter-related queries
 *
 * This file contains only the query keys structure, separate from query functions.
 */

// Base keys for hierarchical structure
export const newsletterKeys = {
  // Base key for all newsletter-related queries
  all: ['newsletter'] as const,

  // Sub-keys for different query types
  unsubscribe: () => [...newsletterKeys.all, 'unsubscribe'] as const,
} as const;

// Specific key constructors
export const newsletterKeyConstructors = {
  // Unsubscribe by token
  unsubscribe: (token: string) => [...newsletterKeys.unsubscribe(), token] as const,
} as const;

// Type helpers for better type safety
export type NewsletterUnsubscribeQueryKey = ReturnType<
  typeof newsletterKeyConstructors.unsubscribe
>;

// Utility to extract token from unsubscribe query key
export const extractTokenFromUnsubscribeKey = (queryKey: NewsletterUnsubscribeQueryKey): string => {
  return queryKey[2];
};
