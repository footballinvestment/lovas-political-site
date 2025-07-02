// src/lib/sql-security.ts
import { logError } from "./error-logger";

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  // Basic SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|REPLACE)\b)/gi,
  
  // SQL comments
  /(--|\/\*|\*\/|#)/gi,
  
  // SQL string manipulation
  /('|";|")|(\%27)|(\%22)/gi,
  
  // UNION-based injection
  /(\bUNION\b.*\bSELECT\b)/gi,
  
  // Boolean-based blind injection
  /(\bAND\b|\bOR\b).*(\b1\b.*=.*\b1\b|\b0\b.*=.*\b0\b)/gi,
  
  // Time-based injection
  /(\bWAITFOR\b|\bDELAY\b|\bSLEEP\b|\bBENCHMARK\b)/gi,
  
  // Information schema attacks
  /(\binformation_schema\b|\bmysql\b|\bsysobjects\b|\bsyscolumns\b)/gi,
  
  // Database functions that might be exploited
  /(\bCONCAT\b|\bCHAR\b|\bASCII\b|\bHEX\b|\bUNHEX\b|\bMD5\b|\bSHA1\b)/gi,
  
  // Error-based injection
  /(\bEXTRACTVALUE\b|\bUPDATEXML\b|\bXMLTYPE\b)/gi,
  
  // Stacked queries
  /;.*(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/gi,
];

// Additional patterns for NoSQL injection (if using MongoDB)
const NOSQL_INJECTION_PATTERNS = [
  /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$or|\$and|\$not|\$nor|\$exists|\$type|\$regex)/gi,
  /(javascript:|function\s*\()/gi,
];

// Suspicious query patterns
const SUSPICIOUS_PATTERNS = [
  // Multiple queries
  /;.*;/gi,
  
  // Hexadecimal patterns
  /0x[0-9a-fA-F]+/gi,
  
  // Encoded characters
  /(%[0-9a-fA-F]{2}){3,}/gi,
  
  // Unusual spacing patterns (potential evasion)
  /\s+(union|select|insert|update|delete|drop)\s+/gi,
];

export interface SQLSecurityResult {
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  recommendations: string[];
}

// Validate input for SQL injection patterns
export function validateSQLSecurity(
  input: string | null | undefined,
  context: string = 'unknown'
): SQLSecurityResult {
  if (!input || typeof input !== 'string') {
    return {
      isSafe: true,
      riskLevel: 'low',
      detectedPatterns: [],
      recommendations: [],
    };
  }
  
  const detectedPatterns: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(`SQL pattern: ${pattern.source}`);
      riskLevel = 'critical';
      recommendations.push('Use parameterized queries or ORM methods');
    }
  }
  
  // Check for NoSQL injection patterns
  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(`NoSQL pattern: ${pattern.source}`);
      riskLevel = riskLevel === 'low' ? 'high' : 'critical';
      recommendations.push('Validate and sanitize NoSQL query operators');
    }
  }
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(`Suspicious pattern: ${pattern.source}`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      recommendations.push('Review input for unusual patterns');
    }
  }
  
  const isSafe = detectedPatterns.length === 0;
  
  // Log security events
  if (!isSafe) {
    logError(new Error(`SQL injection attempt detected in ${context}`), {
      context: 'SQL Security Violation',
      inputContext: context,
      riskLevel,
      detectedPatterns,
      inputSample: input.substring(0, 200),
      severity: riskLevel === 'critical' ? 'critical' : 'high',
    });
  }
  
  return {
    isSafe,
    riskLevel,
    detectedPatterns,
    recommendations,
  };
}

// Sanitize database search queries
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  // Remove dangerous characters and patterns
  let sanitized = query
    // Remove SQL comments
    .replace(/(--|\/\*|\*\/|#)/g, '')
    // Remove quotes that might be used for injection
    .replace(/['"`;]/g, '')
    // Remove SQL keywords (case insensitive)
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|REPLACE)\b/gi, '')
    // Remove operators that might be exploited
    .replace(/[<>=!]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit length to prevent DoS
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized;
}

// Validate Prisma query parameters
export function validatePrismaQuery(
  queryParams: Record<string, any>,
  allowedFields: string[] = []
): {
  isValid: boolean;
  sanitizedParams: Record<string, any>;
  errors: string[];
} {
  const sanitizedParams: Record<string, any> = {};
  const errors: string[] = [];
  
  for (const [key, value] of Object.entries(queryParams)) {
    // Check if field is allowed
    if (allowedFields.length > 0 && !allowedFields.includes(key)) {
      errors.push(`Field '${key}' is not allowed`);
      continue;
    }
    
    // Validate key name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      errors.push(`Invalid field name: '${key}'`);
      continue;
    }
    
    // Validate value based on type
    if (typeof value === 'string') {
      const securityResult = validateSQLSecurity(value, `prisma-query-${key}`);
      if (!securityResult.isSafe) {
        errors.push(`Security violation in field '${key}': ${securityResult.detectedPatterns.join(', ')}`);
        continue;
      }
      sanitizedParams[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitizedParams[key] = value;
    } else if (value === null || value === undefined) {
      sanitizedParams[key] = value;
    } else if (Array.isArray(value)) {
      // Validate array elements
      const sanitizedArray: any[] = [];
      for (const item of value) {
        if (typeof item === 'string') {
          const securityResult = validateSQLSecurity(item, `prisma-query-${key}-array`);
          if (securityResult.isSafe) {
            sanitizedArray.push(item);
          } else {
            errors.push(`Security violation in array field '${key}': ${securityResult.detectedPatterns.join(', ')}`);
          }
        } else if (typeof item === 'number' || typeof item === 'boolean') {
          sanitizedArray.push(item);
        }
      }
      sanitizedParams[key] = sanitizedArray;
    } else if (typeof value === 'object') {
      // Recursively validate nested objects
      const nestedResult = validatePrismaQuery(value, allowedFields);
      if (nestedResult.isValid) {
        sanitizedParams[key] = nestedResult.sanitizedParams;
      } else {
        errors.push(...nestedResult.errors.map(e => `${key}.${e}`));
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedParams,
    errors,
  };
}

// Create safe sorting parameters for Prisma
export function createSafeSortParams(
  sortBy?: string,
  sortOrder?: string,
  allowedSortFields: string[] = []
): Record<string, 'asc' | 'desc'> | undefined {
  if (!sortBy) return undefined;
  
  // Validate sort field
  if (!allowedSortFields.includes(sortBy)) {
    throw new Error(`Invalid sort field: ${sortBy}`);
  }
  
  // Validate sort order
  const order = sortOrder?.toLowerCase();
  if (order && !['asc', 'desc'].includes(order)) {
    throw new Error(`Invalid sort order: ${sortOrder}`);
  }
  
  return { [sortBy]: (order as 'asc' | 'desc') || 'asc' };
}

// Create safe pagination parameters
export function createSafePaginationParams(
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
): { skip: number; take: number } {
  let pageNum = 1;
  let limitNum = 20;
  
  // Validate and sanitize page
  if (page !== undefined) {
    const parsed = typeof page === 'string' ? parseInt(page, 10) : page;
    if (isNaN(parsed) || parsed < 1) {
      pageNum = 1;
    } else if (parsed > 1000) { // Prevent DoS with huge page numbers
      pageNum = 1000;
    } else {
      pageNum = parsed;
    }
  }
  
  // Validate and sanitize limit
  if (limit !== undefined) {
    const parsed = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    if (isNaN(parsed) || parsed < 1) {
      limitNum = 20;
    } else if (parsed > maxLimit) {
      limitNum = maxLimit;
    } else {
      limitNum = parsed;
    }
  }
  
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
  };
}

// Monitor database query performance (potential DoS detection)
export class QueryPerformanceMonitor {
  private static queries: Map<string, number[]> = new Map();
  private static readonly MAX_QUERY_TIME = 5000; // 5 seconds
  private static readonly MAX_QUERIES_PER_MINUTE = 100;
  
  static startQuery(queryId: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > this.MAX_QUERY_TIME) {
        logError(new Error(`Slow query detected: ${queryId}`), {
          context: 'Database Performance',
          queryId,
          duration,
          severity: 'high',
        });
      }
      
      // Track query frequency
      const now = Date.now();
      const queries = this.queries.get(queryId) || [];
      queries.push(now);
      
      // Remove queries older than 1 minute
      const cutoff = now - 60000;
      const recentQueries = queries.filter(time => time > cutoff);
      
      if (recentQueries.length > this.MAX_QUERIES_PER_MINUTE) {
        logError(new Error(`High query frequency detected: ${queryId}`), {
          context: 'Database Security',
          queryId,
          frequency: recentQueries.length,
          severity: 'high',
        });
      }
      
      this.queries.set(queryId, recentQueries);
    };
  }
  
  static getStats(): { totalQueries: number; slowQueries: number } {
    const totalQueries = Array.from(this.queries.values())
      .reduce((sum, queries) => sum + queries.length, 0);
    
    // This is a simplified implementation
    return {
      totalQueries,
      slowQueries: 0, // Would track this in a real implementation
    };
  }
}

// Export utility functions
export const SQLSecurity = {
  validate: validateSQLSecurity,
  sanitizeSearch: sanitizeSearchQuery,
  validatePrismaQuery,
  createSafeSortParams,
  createSafePaginationParams,
  QueryPerformanceMonitor,
};