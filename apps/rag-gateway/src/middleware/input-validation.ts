/**
 * Input validation middleware for preventing prompt injection attacks.
 *
 * This module provides sanitization functions to detect and block
 * common prompt injection patterns that could compromise the RAG system.
 *
 * References:
 * - OWASP LLM01: Prompt Injection
 * - https://genai.owasp.org/llmrisk/llm01-prompt-injection/
 */

/**
 * Common prompt injection patterns to detect.
 *
 * These patterns are known techniques used to manipulate LLM systems
 * into bypassing security controls or revealing sensitive information.
 */
export const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  // Instruction override attempts
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+everything\s+above/i,
  /forget\s+(everything|all)\s+(previous|above)/i,
  /override\s+your\s+(instructions|programming|constraints)/i,

  // System prompt extraction attempts
  /system\s*:\s*/i,
  /show\s+(me\s+)?your\s+(system\s+)?prompt/i,
  /tell\s+me\s+your\s+(instructions|system\s+prompt)/i,
  /reveal\s+your\s+(programming|instructions)/i,
  /print\s+your\s+(system\s+)?prompt/i,

  // Special token injection (LLaMA, Mistral, etc.)
  /\[INST\].*?\[\/INST\]/is,
  /<\|.*?\|>/g,
  /<s>\s*.*?\s*<\/s>/is,
  /<<SYS>>.*?<\/SYS>>/is,

  // Role/jailbreak attempts
  /you\s+are\s+now\s+(a|an)/i,
  /act\s+as\s+(a|an)/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /roleplay\s+as/i,
  /jailbreak/i,

  // Script/code injection
  /<script.*?>.*?<\/script>/gis,
  /javascript:/i,
  /data\s*:\s*text\/html/i,

  // Encoding bypass attempts
  /\\u[0-9a-f]{4}/gi, // Unicode escape
  /&#x?[0-9a-f]{1,4};/gi, // HTML entity encoding (numeric)
  /&(lt|gt|quot|amp|apos|nbsp);/gi, // HTML entity encoding (named)

  // Multi-step injection attempts
  /translate\s+the\s+above/i,
  /summarize\s+(this|everything)/i,
  /repeat\s+(the\s+)?above/i,
];

/**
 * Input length limits to prevent DoS via oversized inputs.
 */
export const INPUT_LIMITS = {
  MAX_QUERY_LENGTH: 2000, // Maximum characters for a query
  MAX_CONTEXT_LENGTH: 5000, // Maximum characters for context
} as const;

/**
 * Error messages for different validation failures.
 */
export const VALIDATION_ERRORS = {
  PROMPT_INJECTION: 'Invalid input detected: Possible prompt injection attempt',
  QUERY_TOO_LONG: `Query exceeds maximum length of ${INPUT_LIMITS.MAX_QUERY_LENGTH} characters`,
  CONTEXT_TOO_LONG: `Context exceeds maximum length of ${INPUT_LIMITS.MAX_CONTEXT_LENGTH} characters`,
  EMPTY_INPUT: 'Query cannot be empty',
} as const;

/**
 * Sanitize and validate user input for prompt injection attacks.
 *
 * This function checks the input against known prompt injection patterns
 * and enforces length limits.
 *
 * @param input - The user input to validate
 * @param options - Optional validation options
 * @returns The sanitized input (unchanged if valid)
 * @throws Error if input contains suspicious patterns or exceeds limits
 *
 * @example
 * ```typescript
 * try {
 *   const sanitized = sanitizeInput(userQuery);
 *   // Proceed with query
 * } catch (error) {
 *   // Handle validation error
 *   return { error: error.message };
 * }
 * ```
 */
export function sanitizeInput(
  input: string,
  options: {
    maxLength?: number;
    checkPromptInjection?: boolean;
  } = {}
): string {
  const { maxLength = INPUT_LIMITS.MAX_QUERY_LENGTH, checkPromptInjection = true } = options;

  // Trim whitespace
  const trimmed = input.trim();

  // Check for empty input
  if (!trimmed) {
    throw new Error(VALIDATION_ERRORS.EMPTY_INPUT);
  }

  // Check length limits
  if (trimmed.length > maxLength) {
    throw new Error(
      maxLength === INPUT_LIMITS.MAX_QUERY_LENGTH
        ? VALIDATION_ERRORS.QUERY_TOO_LONG
        : `Input exceeds maximum length of ${maxLength} characters`
    );
  }

  // Check for prompt injection patterns
  if (checkPromptInjection) {
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        console.warn(`[Security] Prompt injection pattern detected: ${pattern}`);
        throw new Error(VALIDATION_ERRORS.PROMPT_INJECTION);
      }
    }
  }

  return trimmed;
}

/**
 * Validate context input (for queries with additional context).
 *
 * @param context - The context to validate
 * @returns The sanitized context
 * @throws Error if context is invalid
 */
export function sanitizeContext(context: string): string {
  const trimmed = context.trim();

  // Check for empty input
  if (!trimmed) {
    throw new Error(VALIDATION_ERRORS.EMPTY_INPUT);
  }

  // Check context length limit
  if (trimmed.length > INPUT_LIMITS.MAX_CONTEXT_LENGTH) {
    throw new Error(VALIDATION_ERRORS.CONTEXT_TOO_LONG);
  }

  // Check for prompt injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[Security] Prompt injection pattern detected: ${pattern}`);
      throw new Error(VALIDATION_ERRORS.PROMPT_INJECTION);
    }
  }

  return trimmed;
}

/**
 * Check if input looks like a potential injection attempt (non-blocking).
 *
 * This is useful for logging and monitoring without blocking the request.
 *
 * @param input - The input to check
 * @returns Array of detected pattern names (empty if none detected)
 */
export function detectSuspiciousPatterns(input: string): string[] {
  const detected: string[] = [];

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      detected.push(pattern.toString());
    }
  }

  return detected;
}
