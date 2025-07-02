// src/lib/rate-limit.ts
import { headers } from "next/headers";
import { logError } from "./error-logger";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipWhitelist?: boolean;
  banThreshold?: number; // After this many violations, temporarily ban
  banDurationMs?: number; // How long to ban for
}

// Enhanced rate limiting with role-based limits and security features
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    banThreshold: 5,
    banDurationMs: 60 * 60 * 1000, // 1 hour ban
  },
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // Max 5 contact form submissions per hour
    banThreshold: 3,
    banDurationMs: 24 * 60 * 60 * 1000, // 24 hour ban for contact spam
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // Max 10 auth attempts per 15 minutes
    banThreshold: 3,
    banDurationMs: 60 * 60 * 1000, // 1 hour ban for auth brute force
  },
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // Higher limit for authenticated admin users
    skipWhitelist: true,
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // Max 20 file uploads per hour
    banThreshold: 5,
    banDurationMs: 2 * 60 * 60 * 1000, // 2 hour ban
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // General API limit
    banThreshold: 10,
    banDurationMs: 30 * 60 * 1000, // 30 minute ban
  },
};

// Enhanced tracking with violation counts and bans
interface RateLimitRecord {
  count: number;
  resetTime: number;
  violations: number; // Track repeated violations
  bannedUntil?: number; // Temporary ban timestamp
  firstViolation?: number; // Track when violations started
}

// In-memory stores (use Redis in production)
const requestStore = new Map<string, RateLimitRecord>();
const whitelistedIPs = new Set<string>(); // Whitelisted IPs (admin, trusted sources)

// IP whitelist from environment (comma-separated)
if (process.env.RATE_LIMIT_WHITELIST) {
  process.env.RATE_LIMIT_WHITELIST.split(',').forEach(ip => 
    whitelistedIPs.add(ip.trim())
  );
}

export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
  "X-RateLimit-Policy"?: string;
}

export interface RateLimitResult {
  success: boolean;
  headers: RateLimitHeaders;
  banned?: boolean;
  banReason?: string;
}

// Enhanced IP detection with multiple headers and validation
function getClientIP(): string {
  if (typeof window !== 'undefined') return 'client-side';
  
  try {
    const headersList = headers();
    
    // Try multiple IP headers in order of preference
    const ipHeaders = [
      'cf-connecting-ip', // Cloudflare
      'x-real-ip',
      'x-forwarded-for',
      'x-client-ip',
      'x-forwarded',
      'x-cluster-client-ip',
      'forwarded-for',
      'forwarded',
    ];

    for (const header of ipHeaders) {
      const ip = headersList.get(header);
      if (ip && ip !== 'unknown') {
        // For comma-separated IPs (e.g., x-forwarded-for), take the first one
        const firstIP = ip.split(',')[0].trim();
        
        // Basic IP validation
        if (isValidIP(firstIP)) {
          return firstIP;
        }
      }
    }
    
    return "unknown";
  } catch (error) {
    logError(error, { context: 'Rate limit IP detection' });
    return "unknown";
  }
}

// Basic IP validation
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Check if IP is whitelisted
function isWhitelisted(ip: string): boolean {
  return whitelistedIPs.has(ip) || 
         ip === '127.0.0.1' || 
         ip === 'localhost' ||
         ip.startsWith('192.168.') || // Local network
         ip.startsWith('10.') || // Private network
         ip.startsWith('172.'); // Private network
}

// Enhanced rate limit checking with ban support
function checkRateLimit(routeName: string, ip: string, userRole?: string): {
  allowed: boolean;
  banned: boolean;
  banReason?: string;
} {
  const config = RATE_LIMITS[routeName] || RATE_LIMITS.default;
  
  // Skip rate limiting for whitelisted IPs if configured
  if (config.skipWhitelist && isWhitelisted(ip)) {
    return { allowed: true, banned: false };
  }

  // Apply role-based exemptions
  if (userRole === 'ADMIN' && routeName === 'admin') {
    return { allowed: true, banned: false };
  }

  const key = `${routeName}:${ip}`;
  const now = Date.now();
  
  let record = requestStore.get(key);
  
  // Check if currently banned
  if (record?.bannedUntil && now < record.bannedUntil) {
    return { 
      allowed: false, 
      banned: true, 
      banReason: `Temporarily banned until ${new Date(record.bannedUntil).toISOString()}` 
    };
  }

  // Initialize or reset record
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + config.windowMs,
      violations: record?.violations || 0,
      firstViolation: record?.firstViolation,
    };
    requestStore.set(key, record);
    return { allowed: true, banned: false };
  }
  
  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    record.violations++;
    
    // Track first violation time
    if (!record.firstViolation) {
      record.firstViolation = now;
    }
    
    // Check if should be banned
    if (config.banThreshold && record.violations >= config.banThreshold && config.banDurationMs) {
      record.bannedUntil = now + config.banDurationMs;
      
      // Log security incident
      logError(new Error(`IP ${ip} banned for repeated rate limit violations`), {
        context: 'Rate limiting security',
        ip,
        route: routeName,
        violations: record.violations,
        banDuration: config.banDurationMs,
      });
      
      requestStore.set(key, record);
      return { 
        allowed: false, 
        banned: true, 
        banReason: `Banned for ${config.banDurationMs / 60000} minutes due to repeated violations` 
      };
    }
    
    requestStore.set(key, record);
    return { allowed: false, banned: false };
  }
  
  // Increment counter
  record.count++;
  requestStore.set(key, record);
  return { allowed: true, banned: false };
}

function getRateLimitInfo(routeName: string, ip: string) {
  const config = RATE_LIMITS[routeName] || RATE_LIMITS.default;
  const key = `${routeName}:${ip}`;
  const record = requestStore.get(key);
  const now = Date.now();
  
  if (!record || now > record.resetTime) {
    return {
      remaining: config.maxRequests - 1,
      reset: new Date(now + config.windowMs),
      policy: `${config.maxRequests} requests per ${config.windowMs / 60000} minutes`,
    };
  }
  
  return {
    remaining: Math.max(0, config.maxRequests - record.count),
    reset: new Date(record.resetTime),
    policy: `${config.maxRequests} requests per ${config.windowMs / 60000} minutes`,
  };
}

// Main rate limiting function with enhanced security
export async function applyRateLimit(
  routeName: string,
  userRole?: string
): Promise<RateLimitResult> {
  const ip = getClientIP();
  const result = checkRateLimit(routeName, ip, userRole);
  const rateLimitInfo = getRateLimitInfo(routeName, ip);
  const config = RATE_LIMITS[routeName] || RATE_LIMITS.default;

  const headers: RateLimitHeaders = {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
    "X-RateLimit-Reset": rateLimitInfo.reset.toISOString(),
    "X-RateLimit-Policy": rateLimitInfo.policy,
  };

  return {
    success: result.allowed,
    headers,
    banned: result.banned,
    banReason: result.banReason,
  };
}

// Enhanced wrapper with better error handling and logging
export async function withRateLimit(
  routeName: string,
  handler: () => Promise<Response>,
  userRole?: string
): Promise<Response> {
  try {
    const rateLimit = await applyRateLimit(routeName, userRole);

    if (!rateLimit.success) {
      const errorMessage = rateLimit.banned 
        ? `Access temporarily banned: ${rateLimit.banReason}`
        : "Too Many Requests - Rate limit exceeded";
      
      const statusCode = rateLimit.banned ? 403 : 429;
      
      // Log rate limit violations for monitoring
      if (rateLimit.banned) {
        logError(new Error(`Rate limit ban triggered for route ${routeName}`), {
          context: 'Rate limiting',
          route: routeName,
          ip: getClientIP(),
          banned: true,
          banReason: rateLimit.banReason,
        });
      }

      return new Response(JSON.stringify({ 
        error: errorMessage,
        retryAfter: rateLimit.headers["X-RateLimit-Reset"],
      }), {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((new Date(rateLimit.headers["X-RateLimit-Reset"]).getTime() - Date.now()) / 1000).toString(),
          ...rateLimit.headers,
        },
      });
    }

    const response = await handler();
    const newHeaders = new Headers(response.headers);

    // Add rate limit headers to successful responses
    Object.entries(rateLimit.headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    logError(error, { context: 'Rate limiting wrapper', route: routeName });
    
    // If rate limiting fails, allow the request but log the error
    return await handler();
  }
}

// Admin function to manage rate limiting
export function manageRateLimit(action: 'whitelist' | 'unwhitelist' | 'unban' | 'ban', ip: string, duration?: number): boolean {
  try {
    switch (action) {
      case 'whitelist':
        whitelistedIPs.add(ip);
        return true;
        
      case 'unwhitelist':
        whitelistedIPs.delete(ip);
        return true;
        
      case 'unban':
        // Remove bans for all routes for this IP
        for (const [key, record] of requestStore.entries()) {
          if (key.endsWith(`:${ip}`)) {
            record.bannedUntil = undefined;
            record.violations = 0;
            requestStore.set(key, record);
          }
        }
        return true;
        
      case 'ban':
        // Manually ban IP for specified duration (default 24 hours)
        const banDuration = duration || 24 * 60 * 60 * 1000;
        const banUntil = Date.now() + banDuration;
        
        for (const routeName of Object.keys(RATE_LIMITS)) {
          const key = `${routeName}:${ip}`;
          const record = requestStore.get(key) || {
            count: 0,
            resetTime: Date.now(),
            violations: 0,
          };
          
          record.bannedUntil = banUntil;
          requestStore.set(key, record);
        }
        return true;
        
      default:
        return false;
    }
  } catch (error) {
    logError(error, { context: 'Rate limit management', action, ip });
    return false;
  }
}

// Cleanup function for expired records
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  for (const [key, record] of requestStore.entries()) {
    // Remove records that are past their reset time and not banned
    if (now > record.resetTime && (!record.bannedUntil || now > record.bannedUntil)) {
      requestStore.delete(key);
    }
  }
}

// Periodic cleanup (run every 15 minutes)
setInterval(cleanupRateLimitStore, 15 * 60 * 1000);
