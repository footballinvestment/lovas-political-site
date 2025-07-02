// src/middleware/environment.ts
import { NextRequest, NextResponse } from 'next/server';
import { features } from '@/lib/env';

// Maintenance mode middleware
export function maintenanceMiddleware(request: NextRequest) {
  // Skip maintenance mode for admin and API routes
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isMaintenancePage = request.nextUrl.pathname === '/maintenance';

  if (features.maintenanceMode && !isAdminRoute && !isApiRoute && !isMaintenancePage) {
    // Redirect to maintenance page
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}

// Environment info API endpoint
export function createEnvironmentAPI() {
  return function GET() {
    // Only expose safe environment info
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      buildId: process.env.BUILD_ID || 'unknown',
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown',
      timestamp: new Date().toISOString(),
      features: {
        newsletter: features.newsletter,
        comments: features.comments,
        analytics: features.analytics,
        maintenanceMode: features.maintenanceMode,
      },
      // Version info
      version: process.env.npm_package_version || '1.0.0',
      nextVersion: process.env.npm_package_dependencies_next || 'unknown',
    };

    return NextResponse.json(envInfo);
  };
}

// Health check endpoint
export function createHealthCheckAPI() {
  return async function GET() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      memory: process.memoryUsage(),
      checks: {
        database: 'pending',
        email: 'pending',
        filesystem: 'pending',
      },
    };

    try {
      // Database check
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        health.checks.database = 'ok';
      } catch (error) {
        health.checks.database = 'error';
        health.status = 'degraded';
      }

      // Email service check (optional)
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          // Just check if API key is valid (doesn't send email)
          health.checks.email = 'ok';
        } catch (error) {
          health.checks.email = 'error';
          health.status = 'degraded';
        }
      } else {
        health.checks.email = 'disabled';
      }

      // Filesystem check
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const testPath = path.join(process.cwd(), 'package.json');
        await fs.access(testPath);
        health.checks.filesystem = 'ok';
      } catch (error) {
        health.checks.filesystem = 'error';
        health.status = 'error';
      }

    } catch (error) {
      health.status = 'error';
      health.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const statusCode = health.status === 'ok' ? 200 : 
                      health.status === 'degraded' ? 200 : 500;

    return NextResponse.json(health, { status: statusCode });
  };
}

// Production readiness check
export function createReadinessAPI() {
  return async function GET() {
    const readiness = {
      ready: true,
      timestamp: new Date().toISOString(),
      checks: {
        environment: 'pending',
        database: 'pending',
        authentication: 'pending',
        email: 'pending',
      },
      warnings: [] as string[],
      errors: [] as string[],
    };

    try {
      // Environment check
      const requiredEnvVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_BASE_URL',
        'DATABASE_URL',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
        'ADMIN_EMAIL',
        'RESEND_API_KEY',
        'EMAIL_FROM_DOMAIN',
        'CSRF_SECRET',
        'ENCRYPTION_KEY',
      ];

      const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingEnvVars.length === 0) {
        readiness.checks.environment = 'ok';
      } else {
        readiness.checks.environment = 'error';
        readiness.errors.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
        readiness.ready = false;
      }

      // Database check
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        // Check connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Check if tables exist
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE()
        `;
        
        if (Array.isArray(tables) && tables.length > 0) {
          readiness.checks.database = 'ok';
        } else {
          readiness.checks.database = 'warning';
          readiness.warnings.push('Database tables not found. Run migrations.');
        }
        
        await prisma.$disconnect();
      } catch (error) {
        readiness.checks.database = 'error';
        readiness.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        readiness.ready = false;
      }

      // Authentication check
      try {
        const { getServerSession } = await import('next-auth/next');
        readiness.checks.authentication = 'ok';
      } catch (error) {
        readiness.checks.authentication = 'error';
        readiness.errors.push('NextAuth configuration error');
        readiness.ready = false;
      }

      // Email service check
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          readiness.checks.email = 'ok';
        } catch (error) {
          readiness.checks.email = 'error';
          readiness.errors.push('Email service configuration error');
          readiness.ready = false;
        }
      } else {
        readiness.checks.email = 'disabled';
        readiness.warnings.push('Email service not configured');
      }

    } catch (error) {
      readiness.ready = false;
      readiness.errors.push(`Readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const statusCode = readiness.ready ? 200 : 503;
    return NextResponse.json(readiness, { status: statusCode });
  };
}