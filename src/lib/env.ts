// src/lib/env.ts
import { z } from "zod";

// Environment validation schema
const envSchema = z.object({
  // Basic Next.js configuration
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("3000"),

  // Database configuration
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  DIRECT_URL: z.string().optional(),

  // Authentication (NextAuth.js)
  NEXTAUTH_URL: z.string().url("Invalid NextAuth URL"),
  NEXTAUTH_SECRET: z.string().min(32, "NextAuth secret must be at least 32 characters"),

  // Admin configuration
  ADMIN_EMAIL: z.string().email("Invalid admin email"),
  ADMIN_PASSWORD: z.string().min(12, "Admin password must be at least 12 characters"),

  // Email service (Resend)
  RESEND_API_KEY: z.string().regex(/^re_[a-zA-Z0-9_-]+$/, "Invalid Resend API key format"),
  EMAIL_FROM_DOMAIN: z.string().email("Invalid from email domain"),

  // Security configuration
  CSRF_SECRET: z.string().min(32, "CSRF secret must be at least 32 characters"),
  ENCRYPTION_KEY: z.string().min(32, "Encryption key must be at least 32 characters"),

  // Rate limiting
  RATE_LIMIT_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default("100"),
  RATE_LIMIT_INTERVAL: z.string().regex(/^\d+$/).transform(Number).default("900000"), // 15 minutes
  RATE_LIMIT_REDIS_URL: z.string().url().optional(),
  RATE_LIMIT_MEMORY: z.enum(["true", "false"]).default("true"),

  // File upload
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default("5242880"), // 5MB
  ALLOWED_FILE_TYPES: z.string().default("image/jpeg,image/png,image/webp,application/pdf"),

  // SEO and Analytics
  GOOGLE_VERIFICATION: z.string().optional(),
  YANDEX_VERIFICATION: z.string().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),

  // Social media
  FACEBOOK_PAGE_ID: z.string().optional(),
  TWITTER_HANDLE: z.string().optional(),

  // Feature flags
  ENABLE_NEWSLETTER: z.enum(["true", "false"]).default("true"),
  ENABLE_COMMENTS: z.enum(["true", "false"]).default("false"),
  ENABLE_MAINTENANCE_MODE: z.enum(["true", "false"]).default("false"),

  // Development/Build configuration
  BUILD_ID: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),

  // Monitoring and logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  ENABLE_ERROR_EMAILS: z.enum(["true", "false"]).default("false"),
});

// Derived environment types
export type Env = z.infer<typeof envSchema>;

// Environment validation function
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === "invalid_type" && err.received === "undefined")
        .map(err => err.path.join("."));

      const invalidVars = error.errors
        .filter(err => err.code !== "invalid_type" || err.received !== "undefined")
        .map(err => `${err.path.join(".")}: ${err.message}`);

      console.error("❌ Environment validation failed!");
      
      if (missingVars.length > 0) {
        console.error("\n🚫 Missing required environment variables:");
        missingVars.forEach(varName => console.error(`  • ${varName}`));
      }

      if (invalidVars.length > 0) {
        console.error("\n⚠️  Invalid environment variables:");
        invalidVars.forEach(error => console.error(`  • ${error}`));
      }

      console.error("\n📝 Please check your .env file and ensure all required variables are set correctly.");
      console.error("💡 See .env.production.example for reference.");

      process.exit(1);
    }
    
    throw error;
  }
}

// Get validated environment variables
export const env = validateEnv();

// Environment helpers
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Feature flag helpers
export const features = {
  newsletter: env.ENABLE_NEWSLETTER === "true",
  comments: env.ENABLE_COMMENTS === "true",
  maintenanceMode: env.ENABLE_MAINTENANCE_MODE === "true",
  errorEmails: env.ENABLE_ERROR_EMAILS === "true",
  analytics: !!env.GOOGLE_ANALYTICS_ID,
};

// Database configuration helper
export const dbConfig = {
  url: env.DATABASE_URL,
  directUrl: env.DIRECT_URL,
  // Connection pool settings for production
  ...(isProduction && {
    connectionLimit: 10,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 600000,
  }),
};

// Email configuration helper
export const emailConfig = {
  apiKey: env.RESEND_API_KEY,
  fromDomain: env.EMAIL_FROM_DOMAIN,
  adminEmail: env.ADMIN_EMAIL,
  enabled: isProduction || isDevelopment,
};

// Security configuration helper
export const securityConfig = {
  csrfSecret: env.CSRF_SECRET,
  encryptionKey: env.ENCRYPTION_KEY,
  nextAuthSecret: env.NEXTAUTH_SECRET,
  nextAuthUrl: env.NEXTAUTH_URL,
};

// Rate limiting configuration
export const rateLimitConfig = {
  requests: env.RATE_LIMIT_REQUESTS,
  interval: env.RATE_LIMIT_INTERVAL,
  redisUrl: env.RATE_LIMIT_REDIS_URL,
  useMemory: env.RATE_LIMIT_MEMORY === "true",
  // Default limits by type
  contactForm: { requests: 5, window: "1h" },
  api: { requests: 100, window: "15m" },
  admin: { requests: 1000, window: "15m" },
};

// Upload configuration
export const uploadConfig = {
  maxSize: env.MAX_FILE_SIZE,
  allowedTypes: env.ALLOWED_FILE_TYPES.split(","),
  destination: isProduction ? "/tmp/uploads" : "./public/uploads",
};

// Logging configuration
export const loggingConfig = {
  level: env.LOG_LEVEL,
  enableErrorEmails: env.ENABLE_ERROR_EMAILS === "true",
  errorEmailThreshold: "high" as const,
};

// SEO configuration
export const seoConfig = {
  baseUrl: env.NEXT_PUBLIC_BASE_URL,
  googleVerification: env.GOOGLE_VERIFICATION,
  yandexVerification: env.YANDEX_VERIFICATION,
  analyticsId: env.GOOGLE_ANALYTICS_ID,
  social: {
    facebook: env.FACEBOOK_PAGE_ID,
    twitter: env.TWITTER_HANDLE,
  },
};

// Runtime environment info
export const runtimeInfo = {
  buildId: env.BUILD_ID || "unknown",
  commitSha: env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "unknown",
  vercelUrl: env.VERCEL_URL,
  timestamp: new Date().toISOString(),
};

// Validate environment on module load (only in production)
if (isProduction) {
  console.log("✅ Environment variables validated successfully");
  console.log(`🚀 Starting in ${env.NODE_ENV} mode`);
  console.log(`🌐 Base URL: ${env.NEXT_PUBLIC_BASE_URL}`);
  console.log(`📧 Email: ${features.errorEmails ? "enabled" : "disabled"}`);
  console.log(`📊 Analytics: ${features.analytics ? "enabled" : "disabled"}`);
}
