// src/lib/security-headers.ts
import { NextResponse } from "next/server";

export interface SecurityHeadersConfig {
  csp?: string;
  hsts?: boolean;
  noSniff?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  xssProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
}

// Default security configuration
const DEFAULT_CONFIG: Required<SecurityHeadersConfig> = {
  csp: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' https://accounts.google.com https://www.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  hsts: true,
  noSniff: true,
  frameOptions: 'DENY',
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'bluetooth=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: 'same-origin',
};

// Environment-specific CSP adjustments
function getCSPForEnvironment(): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // More permissive CSP for development
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://accounts.google.com https://www.googleapis.com ws: wss:",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }
  
  return DEFAULT_CONFIG.csp;
}

// Generate nonce for inline scripts/styles
export function generateNonce(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(16);
    array.set(buffer);
  }
  return Buffer.from(array).toString('base64');
}

// Apply security headers to a response
export function applySecurityHeaders(
  response: NextResponse, 
  config: SecurityHeadersConfig = {},
  nonce?: string
): NextResponse {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Content Security Policy with nonce support
  let csp = finalConfig.csp || getCSPForEnvironment();
  if (nonce) {
    csp = csp.replace(
      "script-src 'self' 'unsafe-inline'",
      `script-src 'self' 'nonce-${nonce}'`
    ).replace(
      "style-src 'self' 'unsafe-inline'",
      `style-src 'self' 'nonce-${nonce}'`
    );
  }
  
  // Set Content Security Policy
  response.headers.set('Content-Security-Policy', csp);
  
  // HTTP Strict Transport Security (HSTS)
  if (finalConfig.hsts && process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // X-Content-Type-Options
  if (finalConfig.noSniff) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', finalConfig.frameOptions);
  
  // X-XSS-Protection (legacy, but still useful)
  if (finalConfig.xssProtection) {
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', finalConfig.referrerPolicy);
  
  // Permissions Policy (formerly Feature Policy)
  response.headers.set('Permissions-Policy', finalConfig.permissionsPolicy);
  
  // Cross-Origin Embedder Policy
  if (finalConfig.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }
  
  // Cross-Origin Opener Policy
  if (finalConfig.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }
  
  // Cross-Origin Resource Policy
  response.headers.set('Cross-Origin-Resource-Policy', finalConfig.crossOriginResourcePolicy);
  
  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Expect-CT', 'max-age=86400, enforce');
  
  // Remove sensitive headers that might leak information
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  return response;
}

// Middleware helper for API routes
export function withSecurityHeaders(
  handler: () => Promise<Response>,
  config?: SecurityHeadersConfig,
  nonce?: string
): Promise<Response> {
  return handler().then(response => {
    const nextResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    
    return applySecurityHeaders(nextResponse, config, nonce);
  });
}

// Generate CSP report URI for monitoring
export function getCSPReportConfig(): { reportUri: string; csp: string } {
  const reportUri = '/api/security/csp-report';
  
  const csp = [
    getCSPForEnvironment(),
    `report-uri ${reportUri}`,
    'report-to csp-endpoint',
  ].join('; ');
  
  return { reportUri, csp };
}

// Validate CSP configuration
export function validateCSPConfig(csp: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for unsafe directives
  if (csp.includes("'unsafe-eval'")) {
    warnings.push("Using 'unsafe-eval' reduces security");
  }
  
  if (csp.includes("'unsafe-inline'") && !csp.includes("'nonce-")) {
    warnings.push("Using 'unsafe-inline' without nonce reduces security");
  }
  
  // Check for missing essential directives
  if (!csp.includes('default-src')) {
    errors.push("Missing 'default-src' directive");
  }
  
  if (!csp.includes('script-src')) {
    warnings.push("Missing 'script-src' directive");
  }
  
  if (!csp.includes('object-src')) {
    warnings.push("Missing 'object-src' directive");
  }
  
  // Check for insecure configurations
  if (csp.includes('*') && !csp.includes('*.')) {
    warnings.push("Using wildcard (*) source can be insecure");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Security headers for different page types
export const SECURITY_CONFIGS = {
  api: {
    frameOptions: 'DENY' as const,
    crossOriginResourcePolicy: 'same-origin' as const,
  },
  
  admin: {
    csp: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    frameOptions: 'DENY' as const,
  },
  
  public: {
    frameOptions: 'SAMEORIGIN' as const,
    crossOriginResourcePolicy: 'cross-origin' as const,
  },
  
  upload: {
    csp: [
      "default-src 'self'",
      "script-src 'none'",
      "style-src 'none'",
      "img-src 'none'",
      "connect-src 'none'",
      "frame-src 'none'",
      "object-src 'none'",
      "media-src 'none'",
    ].join('; '),
    frameOptions: 'DENY' as const,
  },
} as const;

// Create security headers for specific contexts
export function createSecurityHeaders(context: keyof typeof SECURITY_CONFIGS = 'api') {
  return SECURITY_CONFIGS[context];
}