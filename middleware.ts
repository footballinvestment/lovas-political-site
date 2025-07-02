import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute, isAdminRoute, getRequiredRolesForRoute } from "@/lib/rbac";
import { applySecurityHeaders, SECURITY_CONFIGS, generateNonce } from "@/lib/security-headers";

// Enhanced security middleware with comprehensive headers
function applySecurityMiddleware(request: NextRequest, response: NextResponse): NextResponse {
  const pathname = request.nextUrl.pathname;
  
  // Determine security context based on route
  let securityContext: keyof typeof SECURITY_CONFIGS = 'public';
  
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/upload')) {
      securityContext = 'upload';
    } else if (pathname.startsWith('/api/admin') || pathname.includes('messages') || pathname.includes('posts')) {
      securityContext = 'admin';
    } else {
      securityContext = 'api';
    }
  } else if (pathname.startsWith('/admin')) {
    securityContext = 'admin';
  }
  
  // Generate nonce for CSP
  const nonce = generateNonce();
  
  // Apply context-specific security headers
  const securityConfig = SECURITY_CONFIGS[securityContext];
  const securedResponse = applySecurityHeaders(response, securityConfig, nonce);
  
  // Additional security headers based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production-only security headers
    securedResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    
    // Remove debug headers in production
    securedResponse.headers.delete('X-User-Role');
  } else {
    // Development-specific headers for debugging
    securedResponse.headers.set('X-Security-Context', securityContext);
    securedResponse.headers.set('X-CSP-Nonce', nonce);
  }
  
  // Set CSRF token header for forms
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    securedResponse.headers.set('X-CSRF-Required', 'true');
  }
  
  // Cache control for sensitive pages
  if (securityContext === 'admin' || securityContext === 'upload') {
    securedResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    securedResponse.headers.set('Pragma', 'no-cache');
    securedResponse.headers.set('Expires', '0');
  }
  
  return securedResponse;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const userRole = token?.role as string;
    const pathname = req.nextUrl.pathname;

    // Enhanced logging for debugging (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] ${pathname} - Role: ${userRole}`);
    }

    // Check if user has permission to access the route
    if (isAdminRoute(pathname)) {
      if (!userRole) {
        console.log(`[Middleware] No role found, redirecting to login`);
        const response = NextResponse.redirect(new URL("/admin/login", req.url));
        return applySecurityMiddleware(req, response);
      }

      if (!canAccessRoute(userRole, pathname)) {
        const requiredRoles = getRequiredRolesForRoute(pathname);
        console.log(`[Middleware] Access denied. Required roles: ${requiredRoles.join(", ")}, User role: ${userRole}`);
        
        // Redirect to unauthorized page or admin login
        const response = NextResponse.redirect(new URL("/admin/unauthorized", req.url));
        
        // Add headers for better error handling
        response.headers.set("X-Access-Denied", "true");
        response.headers.set("X-Required-Roles", requiredRoles.join(","));
        response.headers.set("X-User-Role", userRole);
        
        return applySecurityMiddleware(req, response);
      }
    }

    // Create response and apply security headers
    const response = NextResponse.next();
    
    // Apply comprehensive security headers
    const securedResponse = applySecurityMiddleware(req, response);
    
    // Additional context-specific headers
    if (isAdminRoute(pathname)) {
      // Set session info headers for admin routes
      securedResponse.headers.set("X-User-Role", userRole || "");
      securedResponse.headers.set("X-Session-Timeout", "1800"); // 30 minutes in seconds
      securedResponse.headers.set("X-Admin-Context", "true");
    }
    
    // API route specific headers
    if (pathname.startsWith('/api/')) {
      securedResponse.headers.set("X-API-Version", "1.0");
      securedResponse.headers.set("X-Rate-Limit-Enabled", "true");
    }

    return securedResponse;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow access to login page without token
        if (pathname === "/admin/login") {
          return true;
        }
        
        // Require token for all other admin routes
        if (isAdminRoute(pathname)) {
          return !!token;
        }
        
        // Allow access to non-admin routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",
    "/profile/:path*",
    
    // API routes that need protection
    "/api/admin/:path*",
    "/api/messages/:path*",
    "/api/posts/:path*",
    "/api/events/:path*",
    "/api/upload/:path*",
    "/api/slides/:path*",
    "/api/themes/:path*",
    
    // Public API routes that still need security headers
    "/api/contact/:path*",
    "/api/auth/:path*",
    
    // Apply security headers to all routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
