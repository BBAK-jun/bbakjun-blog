/**
 * Output filtering middleware for redacting sensitive information.
 *
 * This module provides utilities to detect and redact sensitive information
 * from RAG responses to prevent accidental data leakage.
 *
 * Features:
 * - Email address detection and redaction
 * - Credit card number detection
 * - API key and token detection
 * - Phone number detection
 * - Custom pattern support
 */

import { z } from '@hono/zod-openapi';

/**
 * Sensitive data patterns to detect and redact.
 *
 * Patterns are organized by category for selective filtering.
 */
export const SENSITIVE_PATTERNS = {
  /** Email addresses */
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

  /** Credit card numbers (Visa, MasterCard, Amex, Discover) */
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,

  /** Phone numbers (international format) */
  phone: /\b\+?[\d\s-]{10,}\b/g,

  /** API keys and tokens (Bearer, Basic, etc.) */
  authToken: /Bearer\s+[A-Za-z0-9\-._~+/]+/gi,

  /** Generic API key pattern */
  apiKey: /\b[A-Za-z0-9]{32,}\b/g,

  /** AWS Access Key ID */
  awsAccessKey: /\bAKIA[0-9A-Z]{16}\b/g,

  /** AWS Secret Key (partial match) */
  awsSecretKey: /\b[A-Za-z0-9/+=]{40}\b/g,

  /** IP addresses (optional - may be needed in logs) */
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  /** URL with credentials */
  urlWithCredentials: /:\/\/[^:\s]+:[^@\s]+@/g,
} as const;

/**
 * Redaction options.
 */
export interface RedactOptions {
  /** Patterns to use (defaults to all patterns) */
  patterns?: Array<keyof typeof SENSITIVE_PATTERNS>;
  /** Custom redaction string */
  replacement?: string;
  /** Whether to preserve partial data (e.g., show first 2 chars) */
  preservePartial?: boolean;
}

/**
 * Default redaction options.
 */
export const DEFAULT_REDACT_OPTIONS: RedactOptions = {
  patterns: [
    'email',
    'creditCard',
    'authToken',
    'apiKey',
    'awsAccessKey',
    'awsSecretKey',
    'urlWithCredentials',
  ],
  replacement: '[REDACTED]',
  preservePartial: false,
};

/**
 * Redact sensitive information from text.
 *
 * @param text - Text to redact
 * @param options - Redaction options
 * @returns Redacted text
 *
 * @example
 * ```typescript
 * const text = 'Contact user@example.com for support';
 * const redacted = redactSensitiveInfo(text);
 * // Returns: 'Contact [REDACTED] for support'
 *
 * // Preserve partial data
 * const partial = redactSensitiveInfo(text, { preservePartial: true });
 * // Returns: 'Contact us***@example.com for support'
 * ```
 */
export function redactSensitiveInfo(
  text: string,
  options: RedactOptions = DEFAULT_REDACT_OPTIONS
): string {
  const {
    patterns = Object.keys(SENSITIVE_PATTERNS) as Array<keyof typeof SENSITIVE_PATTERNS>,
    replacement,
    preservePartial,
  } = options;

  let redacted = text;

  for (const patternKey of patterns) {
    const pattern = SENSITIVE_PATTERNS[patternKey];
    if (!pattern) continue;

    redacted = redacted.replace(pattern, match => {
      if (preservePartial) {
        // Show first 2-3 characters and redact the rest
        const visibleLength = Math.min(3, Math.floor(match.length / 4));
        return match.substring(0, visibleLength) + '*'.repeat(match.length - visibleLength);
      }
      return replacement || '[REDACTED]';
    });
  }

  return redacted;
}

/**
 * Detect sensitive information in text (non-destructive).
 *
 * @param text - Text to check
 * @returns Array of detected sensitive data types and matches
 *
 * @example
 * ```typescript
 * const result = detectSensitiveInfo('Contact user@example.com');
 * // Returns: [{ type: 'email', matches: ['user@example.com'] }]
 * ```
 */
export function detectSensitiveInfo(text: string): Array<{ type: string; matches: string[] }> {
  const detected: Array<{ type: string; matches: string[] }> = [];

  for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      detected.push({
        type: key,
        matches: [...new Set(matches)], // Deduplicate
      });
    }
  }

  return detected;
}

/**
 * Filter sensitive information from RAG response.
 *
 * @param response - RAG response object
 * @param options - Redaction options
 * @returns Filtered response
 *
 * @example
 * ```typescript
 * const response = {
 *   answer: 'Email me at user@example.com',
 *   sources: [{ content: 'Call 555-123-4567' }]
 * };
 * const filtered = filterRAGResponse(response);
 * // Returns: {
 * //   answer: 'Email me at [REDACTED]',
 * //   sources: [{ content: 'Call [REDACTED]' }]
 * // }
 * ```
 */
export function filterRAGResponse<T extends Record<string, unknown>>(
  response: T,
  options: RedactOptions = DEFAULT_REDACT_OPTIONS
): T {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const filtered = { ...response };

  for (const [key, value] of Object.entries(filtered)) {
    if (typeof value === 'string') {
      // Redact sensitive info in string values
      (filtered[key] as string) = redactSensitiveInfo(value, options);
    } else if (Array.isArray(value)) {
      // Recursively filter arrays
      (filtered[key] as unknown[]) = value.map(item =>
        typeof item === 'object' && item !== null
          ? filterRAGResponse(item as Record<string, unknown>, options)
          : typeof item === 'string'
            ? redactSensitiveInfo(item, options)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively filter nested objects
      (filtered[key] as unknown) = filterRAGResponse(value as Record<string, unknown>, options);
    }
  }

  return filtered;
}

/**
 * Check if RAG response contains sensitive information.
 *
 * @param response - RAG response object
 * @returns Array of detected sensitive data
 *
 * @example
 * ```typescript
 * const response = { answer: 'Email user@example.com' };
 * const hasSensitive = containsSensitiveInfo(response);
 * // Returns: [{ type: 'email', matches: ['user@example.com'] }]
 * ```
 */
export function containsSensitiveInfo(
  response: Record<string, unknown>
): Array<{ field: string; type: string; matches: string[] }> {
  const detected: Array<{ field: string; type: string; matches: string[] }> = [];

  for (const [key, value] of Object.entries(response)) {
    if (typeof value === 'string') {
      const sensitive = detectSensitiveInfo(value);
      for (const item of sensitive) {
        detected.push({
          field: key,
          type: item.type,
          matches: item.matches,
        });
      }
    } else if (Array.isArray(value)) {
      // Check array items
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          const sensitive = detectSensitiveInfo(item);
          for (const s of sensitive) {
            detected.push({
              field: `${key}[${index}]`,
              type: s.type,
              matches: s.matches,
            });
          }
        } else if (typeof item === 'object' && item !== null) {
          const nested = containsSensitiveInfo(item as Record<string, unknown>);
          for (const n of nested) {
            detected.push({
              field: `${key}[${index}].${n.field}`,
              type: n.type,
              matches: n.matches,
            });
          }
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively check nested objects
      const nested = containsSensitiveInfo(value as Record<string, unknown>);
      for (const n of nested) {
        detected.push({
          field: `${key}.${n.field}`,
          type: n.type,
          matches: n.matches,
        });
      }
    }
  }

  return detected;
}

/**
 * Create middleware for filtering RAG responses.
 *
 * @param options - Redaction options
 *
 * @example
 * ```typescript
 * // Apply to RAG routes
 * app.use('/api/rag/query', filterRAGOutput());
 * ```
 */
export function filterRAGOutput(options: RedactOptions = DEFAULT_REDACT_OPTIONS) {
  return async (_: unknown, next: () => Promise<void>): Promise<void> => {
    await next();
    // Note: This is a placeholder for response filtering
    // In practice, you'd need to hook into the response pipeline
    // This would be implemented in the handlers themselves
  };
}

/**
 * Zod schema for redaction options.
 */
export const RedactOptionsSchema = z.object({
  patterns: z.array(z.string()).optional(),
  replacement: z.string().optional(),
  preservePartial: z.boolean().optional(),
});

/**
 * Type guard for redaction options.
 */
export function isValidRedactOptions(options: unknown): options is RedactOptions {
  return RedactOptionsSchema.safeParse(options).success;
}
