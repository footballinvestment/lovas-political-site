// src/lib/input-sanitizer.ts
import DOMPurify from "isomorphic-dompurify";

interface SanitizationOptions {
  allowHTML?: boolean;
  allowLinks?: boolean;
  allowImages?: boolean;
  maxLength?: number;
  stripWhitespace?: boolean;
}

// HTML tags allowed in content
const SAFE_HTML_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre'
];

const SAFE_HTML_ATTRIBUTES = ['href', 'title', 'alt', 'src'];

// Dangerous patterns to detect and block
const DANGEROUS_PATTERNS = [
  // JavaScript injection attempts
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload=/gi,
  /onclick=/gi,
  /onerror=/gi,
  /onmouseover=/gi,
  
  // SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
  /((\%27)|(\')|(--)|(\%23)|(#))/gi,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(--)|(\%23)|(#))/gi,
  
  // Path traversal attempts
  /\.\.\//gi,
  /\.\.\\/gi,
  
  // Command injection
  /(\||&|;|\$\(|\`)/gi,
  
  // LDAP injection
  /(\(|\)|&|\||\*)/gi,
];

// Known malicious strings
const MALICIOUS_STRINGS = [
  'eval(',
  'Function(',
  'setInterval(',
  'setTimeout(',
  'alert(',
  'confirm(',
  'prompt(',
  'document.cookie',
  'document.write',
  'window.location',
  'fetch(',
  'XMLHttpRequest',
];

export function sanitizeInput(input: string | null | undefined, options: SanitizationOptions = {}): string {
  if (input === null || input === undefined) {
    return '';
  }

  let sanitized = String(input);

  // Basic input validation
  if (sanitized.length === 0) {
    return '';
  }

  // Apply length limits
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Strip unnecessary whitespace if requested
  if (options.stripWhitespace) {
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new Error(`Input contains potentially dangerous content: ${pattern.source}`);
    }
  }

  // Check for malicious strings
  const lowerInput = sanitized.toLowerCase();
  for (const malicious of MALICIOUS_STRINGS) {
    if (lowerInput.includes(malicious.toLowerCase())) {
      throw new Error(`Input contains potentially malicious content: ${malicious}`);
    }
  }

  // HTML sanitization
  if (options.allowHTML) {
    const purifyConfig: any = {
      ALLOWED_TAGS: [...SAFE_HTML_TAGS],
      ALLOWED_ATTR: [...SAFE_HTML_ATTRIBUTES],
      KEEP_CONTENT: true,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      WHOLE_DOCUMENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    };

    // Add link support if requested
    if (options.allowLinks) {
      purifyConfig.ALLOWED_TAGS.push('a');
      purifyConfig.ALLOWED_ATTR.push('href', 'target', 'rel');
    }

    // Add image support if requested
    if (options.allowImages) {
      purifyConfig.ALLOWED_TAGS.push('img');
      purifyConfig.ALLOWED_ATTR.push('src', 'alt', 'width', 'height');
    }

    sanitized = DOMPurify.sanitize(sanitized, purifyConfig);
  } else {
    // Strip all HTML tags for plain text
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  // Final cleanup
  sanitized = sanitized.trim();

  return sanitized;
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeInput(email, { stripWhitespace: true });
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized.toLowerCase();
}

export function sanitizeUrl(url: string): string {
  const sanitized = sanitizeInput(url, { stripWhitespace: true });
  
  // Only allow HTTP(S) URLs
  if (!sanitized.match(/^https?:\/\//i)) {
    throw new Error('Only HTTP(S) URLs are allowed');
  }

  try {
    const parsedUrl = new URL(sanitized);
    
    // Block suspicious protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    // Block localhost and private IP ranges in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        throw new Error('Private IP addresses are not allowed');
      }
    }

    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

export function sanitizeFilename(filename: string): string {
  const sanitized = sanitizeInput(filename, { stripWhitespace: true });
  
  // Remove path traversal attempts and dangerous characters
  return sanitized
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .substring(0, 255); // Limit filename length
}

export function sanitizeSlug(input: string): string {
  const sanitized = sanitizeInput(input, { stripWhitespace: true });
  
  return sanitized
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit slug length
}

// Validate and sanitize JSON input
export function sanitizeJsonInput(input: any, allowedKeys: string[]): Record<string, any> {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Input must be a valid object');
  }

  const sanitized: Record<string, any> = {};

  for (const key of allowedKeys) {
    if (key in input) {
      const value = input[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value === null) {
        sanitized[key] = null;
      } else {
        // Skip complex objects or arrays unless specifically handled
        continue;
      }
    }
  }

  return sanitized;
}

// Detect and report suspicious input patterns
export function detectSuspiciousActivity(input: string, context: string = 'unknown'): {
  isSuspicious: boolean;
  patterns: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  const detectedPatterns: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
      riskLevel = 'high';
    }
  }

  // Check for malicious strings
  const lowerInput = input.toLowerCase();
  for (const malicious of MALICIOUS_STRINGS) {
    if (lowerInput.includes(malicious.toLowerCase())) {
      detectedPatterns.push(`Malicious string: ${malicious}`);
      riskLevel = 'critical';
    }
  }

  // Additional heuristics
  const suspiciousCount = (input.match(/[<>(){}[\]]/g) || []).length;
  if (suspiciousCount > 5) {
    detectedPatterns.push('High count of special characters');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  const isSuspicious = detectedPatterns.length > 0;

  return {
    isSuspicious,
    patterns: detectedPatterns,
    riskLevel,
  };
}

// Rate limiting for input validation (prevent DoS through complex regex)
const inputValidationCache = new Map<string, boolean>();
const MAX_CACHE_SIZE = 1000;

export function validateInputSafely(input: string, options: SanitizationOptions = {}): string {
  // Check cache first for performance
  const cacheKey = `${input.substring(0, 100)}-${JSON.stringify(options)}`;
  
  if (inputValidationCache.has(cacheKey)) {
    // Return cached validation result
    const isSafe = inputValidationCache.get(cacheKey);
    if (!isSafe) {
      throw new Error('Input failed validation (cached)');
    }
  }

  try {
    const result = sanitizeInput(input, options);
    
    // Cache successful validation
    if (inputValidationCache.size >= MAX_CACHE_SIZE) {
      // Clear cache when it gets too large
      inputValidationCache.clear();
    }
    inputValidationCache.set(cacheKey, true);
    
    return result;
  } catch (error) {
    // Cache failed validation
    inputValidationCache.set(cacheKey, false);
    throw error;
  }
}