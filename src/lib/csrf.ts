// src/lib/csrf.ts
import { headers } from "next/headers";
import CryptoJS from "crypto-js";
import { logError } from "./error-logger";

// Enhanced CSRF protection with multiple security layers
const CSRF_SECRET = process.env.CSRF_SECRET;
const CSRF_TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes (reduced from 1 hour)
const MAX_TOKEN_USAGE = 5; // Maximum times a token can be used

// Validate CSRF secret exists and is strong
if (!CSRF_SECRET || CSRF_SECRET.length < 32) {
  throw new Error("CSRF_SECRET must be set and at least 32 characters long");
}

export interface CSRFTokenData {
  timestamp: number;
  nonce: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  usage: number;
  origin?: string;
}

// In-memory token tracking (use Redis in production)
const tokenUsageTracker = new Map<string, number>();
const TOKEN_TRACKER_MAX_SIZE = 10000;

// Generate cryptographically secure nonce
function generateNonce(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(16);
    array.set(buffer);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Get real client IP with better detection
function getClientIP(): string {
  const headersList = headers();
  
  // Try multiple headers in order of preference
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
    if (ip) {
      // For x-forwarded-for, take the first IP
      const firstIP = ip.split(',')[0].trim();
      if (firstIP && firstIP !== 'unknown') {
        return firstIP;
      }
    }
  }

  return 'unknown';
}

export function generateCSRFToken(sessionId?: string): string {
  try {
    const headersList = headers();
    const ip = getClientIP();
    const userAgent = headersList.get("user-agent")?.substring(0, 200) || "unknown"; // Limit UA length
    const origin = headersList.get("origin") || headersList.get("referer") || "unknown";
    
    const tokenData: CSRFTokenData = {
      timestamp: Date.now(),
      nonce: generateNonce(),
      sessionId,
      ip,
      userAgent,
      usage: 0,
      origin,
    };
    
    const payload = JSON.stringify(tokenData);
    const encrypted = CryptoJS.AES.encrypt(payload, CSRF_SECRET).toString();
    
    // Add HMAC for integrity verification
    const hmac = CryptoJS.HmacSHA256(encrypted, CSRF_SECRET).toString();
    
    return `${encrypted}.${hmac}`;
  } catch (error) {
    logError(error, { context: 'CSRF token generation' });
    throw new Error('Failed to generate CSRF token');
  }
}

export function validateCSRFToken(token: string, sessionId?: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  try {
    // Split token and HMAC
    const parts = token.split('.');
    if (parts.length !== 2) {
      return false;
    }
    
    const [encrypted, providedHmac] = parts;
    
    // Verify HMAC integrity
    const expectedHmac = CryptoJS.HmacSHA256(encrypted, CSRF_SECRET).toString();
    if (providedHmac !== expectedHmac) {
      logError(new Error('CSRF token HMAC verification failed'), { 
        context: 'CSRF validation',
        token: token.substring(0, 20) + '...'
      });
      return false;
    }
    
    // Decrypt and parse token data
    const decrypted = CryptoJS.AES.decrypt(encrypted, CSRF_SECRET).toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      return false;
    }
    
    const tokenData: CSRFTokenData = JSON.parse(decrypted);
    
    // Validate timestamp
    const tokenAge = Date.now() - tokenData.timestamp;
    if (tokenAge > CSRF_TOKEN_LIFETIME || tokenAge < 0) {
      return false;
    }
    
    // Check token usage limit
    const tokenKey = `${tokenData.nonce}-${tokenData.timestamp}`;
    const currentUsage = tokenUsageTracker.get(tokenKey) || 0;
    
    if (currentUsage >= MAX_TOKEN_USAGE) {
      logError(new Error('CSRF token usage limit exceeded'), {
        context: 'CSRF validation',
        nonce: tokenData.nonce,
        usage: currentUsage
      });
      return false;
    }
    
    // Update usage counter
    tokenUsageTracker.set(tokenKey, currentUsage + 1);
    
    // Clean up old tokens from tracker
    if (tokenUsageTracker.size > TOKEN_TRACKER_MAX_SIZE) {
      const cutoffTime = Date.now() - CSRF_TOKEN_LIFETIME;
      for (const [key] of tokenUsageTracker) {
        const [, timestamp] = key.split('-');
        if (parseInt(timestamp) < cutoffTime) {
          tokenUsageTracker.delete(key);
        }
      }
    }
    
    // Validate session consistency
    if (sessionId && tokenData.sessionId && tokenData.sessionId !== sessionId) {
      logError(new Error('CSRF token session mismatch'), {
        context: 'CSRF validation',
        expectedSession: sessionId,
        tokenSession: tokenData.sessionId
      });
      return false;
    }
    
    // Enhanced validation (can be bypassed by sophisticated attackers, but adds defense in depth)
    const headersList = headers();
    const currentIP = getClientIP();
    const currentUserAgent = headersList.get("user-agent")?.substring(0, 200) || "unknown";
    const currentOrigin = headersList.get("origin") || headersList.get("referer") || "unknown";
    
    // Allow some flexibility for users behind load balancers/CDNs
    const isIPValid = !tokenData.ip || tokenData.ip === currentIP || tokenData.ip === 'unknown' || currentIP === 'unknown';
    const isUserAgentValid = !tokenData.userAgent || tokenData.userAgent === currentUserAgent || tokenData.userAgent === 'unknown';
    const isOriginValid = !tokenData.origin || tokenData.origin === currentOrigin || 
                         currentOrigin.includes(tokenData.origin) || tokenData.origin.includes(currentOrigin);
    
    if (!isIPValid || !isUserAgentValid || !isOriginValid) {
      logError(new Error('CSRF token context validation failed'), {
        context: 'CSRF validation',
        ipMatch: isIPValid,
        userAgentMatch: isUserAgentValid,
        originMatch: isOriginValid
      });
      return false;
    }
    
    return true;
  } catch (error) {
    logError(error, { context: 'CSRF token validation' });
    return false;
  }
}

// Middleware helper for CSRF validation
export function validateCSRFMiddleware(request: Request, sessionId?: string): boolean {
  const token = request.headers.get('x-csrf-token') || 
                request.headers.get('X-CSRF-Token') ||
                request.headers.get('csrf-token');
                
  if (!token) {
    return false;
  }
  
  return validateCSRFToken(token, sessionId);
}

// Generate CSRF headers for API requests
export function getCSRFHeaders(sessionId?: string) {
  return {
    "X-CSRF-Token": generateCSRFToken(sessionId),
    "X-Requested-With": "XMLHttpRequest", // Additional CSRF protection
  };
}

// Generate CSRF token for forms
export async function generateCSRFTokenForForm(sessionId?: string): Promise<string> {
  return generateCSRFToken(sessionId);
}

// Double Submit Cookie pattern support
export function generateCSRFCookie(): { name: string; value: string; options: any } {
  const cookieValue = generateNonce();
  
  return {
    name: 'csrf-token',
    value: cookieValue,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: CSRF_TOKEN_LIFETIME / 1000,
      path: '/',
    },
  };
}

// Validate double submit cookie
export function validateCSRFCookie(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return false;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
  
  const csrfCookie = cookies['csrf-token'];
  const csrfHeader = request.headers.get('x-csrf-token') || request.headers.get('X-CSRF-Token');
  
  return csrfCookie && csrfHeader && csrfCookie === csrfHeader;
}

// Clean up expired tokens
export function cleanupExpiredTokens(): void {
  const cutoffTime = Date.now() - CSRF_TOKEN_LIFETIME;
  
  for (const [key] of tokenUsageTracker) {
    const [, timestamp] = key.split('-');
    if (parseInt(timestamp) < cutoffTime) {
      tokenUsageTracker.delete(key);
    }
  }
}