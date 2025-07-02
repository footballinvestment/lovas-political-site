// src/lib/error-logger.ts

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorType {
  CLIENT_ERROR = "client_error",
  SERVER_ERROR = "server_error",
  API_ERROR = "api_error",
  NETWORK_ERROR = "network_error",
  AUTHENTICATION_ERROR = "auth_error",
  AUTHORIZATION_ERROR = "authz_error",
  VALIDATION_ERROR = "validation_error",
  DATABASE_ERROR = "database_error",
  EMAIL_ERROR = "email_error",
  UNKNOWN_ERROR = "unknown_error",
}

export interface ErrorContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  timestamp?: Date;
  buildId?: string;
  environment?: string;
  [key: string]: any;
}

export interface ErrorLog {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: Date;
  digest?: string;
  resolved: boolean;
  notifications: {
    email: boolean;
    console: boolean;
  };
}

// In-memory storage for errors (in production, use a proper database)
const errorLogs: ErrorLog[] = [];
const MAX_ERROR_LOGS = 1000;

// Configuration
const ERROR_CONFIG = {
  enableEmailNotifications: process.env.NODE_ENV === "production",
  enableConsoleLogging: true,
  adminEmail: process.env.ADMIN_EMAIL || "admin@lovaszoltan.hu",
  maxStackTraceLength: 2000,
  emailNotificationThreshold: ErrorSeverity.HIGH,
} as const;

// Error classification helpers
export function classifyError(error: Error | unknown): {
  type: ErrorType;
  severity: ErrorSeverity;
} {
  if (!error) {
    return { type: ErrorType.UNKNOWN_ERROR, severity: ErrorSeverity.LOW };
  }

  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorStack = error instanceof Error ? error.stack?.toLowerCase() : "";

  // Network errors
  if (errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("connection")) {
    return { type: ErrorType.NETWORK_ERROR, severity: ErrorSeverity.MEDIUM };
  }

  // Authentication errors
  if (errorMessage.includes("unauthorized") || errorMessage.includes("authentication") || errorMessage.includes("token")) {
    return { type: ErrorType.AUTHENTICATION_ERROR, severity: ErrorSeverity.HIGH };
  }

  // Authorization errors
  if (errorMessage.includes("forbidden") || errorMessage.includes("permission") || errorMessage.includes("access denied")) {
    return { type: ErrorType.AUTHORIZATION_ERROR, severity: ErrorSeverity.HIGH };
  }

  // Database errors
  if (errorMessage.includes("prisma") || errorMessage.includes("database") || errorMessage.includes("sql")) {
    return { type: ErrorType.DATABASE_ERROR, severity: ErrorSeverity.CRITICAL };
  }

  // Email errors
  if (errorMessage.includes("resend") || errorMessage.includes("email") || errorMessage.includes("smtp")) {
    return { type: ErrorType.EMAIL_ERROR, severity: ErrorSeverity.MEDIUM };
  }

  // API errors
  if (errorMessage.includes("api") || errorMessage.includes("endpoint")) {
    return { type: ErrorType.API_ERROR, severity: ErrorSeverity.MEDIUM };
  }

  // Validation errors
  if (errorMessage.includes("validation") || errorMessage.includes("invalid") || errorMessage.includes("required")) {
    return { type: ErrorType.VALIDATION_ERROR, severity: ErrorSeverity.LOW };
  }

  // Server-side errors (check stack trace)
  if (errorStack && (errorStack.includes("server") || errorStack.includes("node_modules"))) {
    return { type: ErrorType.SERVER_ERROR, severity: ErrorSeverity.HIGH };
  }

  // Default to client error
  return { type: ErrorType.CLIENT_ERROR, severity: ErrorSeverity.MEDIUM };
}

// Generate error context
export function generateErrorContext(
  additionalContext: Partial<ErrorContext> = {}
): ErrorContext {
  const context: ErrorContext = {
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
    buildId: process.env.BUILD_ID || "unknown",
    ...additionalContext,
  };

  // Add browser context if available
  if (typeof window !== "undefined") {
    context.userAgent = navigator.userAgent;
    context.url = window.location.href;
    context.path = window.location.pathname;
  }

  return context;
}

// Create error ID
function createErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Truncate stack trace
function truncateStackTrace(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  if (stack.length <= ERROR_CONFIG.maxStackTraceLength) return stack;
  return stack.substring(0, ERROR_CONFIG.maxStackTraceLength) + "\n... (truncated)";
}

// Generate error report email
function generateErrorEmailReport(errorLog: ErrorLog): string {
  const severityColor = {
    [ErrorSeverity.LOW]: "#10B981",
    [ErrorSeverity.MEDIUM]: "#F59E0B", 
    [ErrorSeverity.HIGH]: "#EF4444",
    [ErrorSeverity.CRITICAL]: "#DC2626",
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Error Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; }
        .content { padding: 20px; }
        .severity { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: white; background-color: ${severityColor[errorLog.severity]}; }
        .info-item { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
        .info-label { font-weight: 600; color: #374151; margin-bottom: 4px; }
        .info-value { color: #6b7280; font-family: monospace; font-size: 14px; }
        .stack-trace { background: #f3f4f6; padding: 16px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Error Report</h1>
            <p>Automatic error notification from Lovas Zoltán György website</p>
        </div>
        <div class="content">
            <div class="info-item">
                <div class="info-label">Error ID</div>
                <div class="info-value">${errorLog.id}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Severity</div>
                <span class="severity">${errorLog.severity}</span>
            </div>
            
            <div class="info-item">
                <div class="info-label">Type</div>
                <div class="info-value">${errorLog.type}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Message</div>
                <div class="info-value">${errorLog.message}</div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Timestamp</div>
                <div class="info-value">${errorLog.timestamp.toISOString()}</div>
            </div>
            
            ${errorLog.context.url ? `
            <div class="info-item">
                <div class="info-label">URL</div>
                <div class="info-value">${errorLog.context.url}</div>
            </div>
            ` : ''}
            
            ${errorLog.context.userId ? `
            <div class="info-item">
                <div class="info-label">User ID</div>
                <div class="info-value">${errorLog.context.userId}</div>
            </div>
            ` : ''}
            
            ${errorLog.context.userAgent ? `
            <div class="info-item">
                <div class="info-label">User Agent</div>
                <div class="info-value">${errorLog.context.userAgent}</div>
            </div>
            ` : ''}
            
            ${errorLog.stack ? `
            <div class="info-item">
                <div class="info-label">Stack Trace</div>
                <div class="stack-trace">${errorLog.stack}</div>
            </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding: 16px; background: #f0f9ff; border-radius: 6px;">
                <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                    This is an automatic error notification. Please investigate and resolve if necessary.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Main logging function
export async function logError(
  error: Error | unknown,
  context: Partial<ErrorContext> = {},
  customSeverity?: ErrorSeverity
): Promise<ErrorLog> {
  const { type, severity } = classifyError(error);
  const errorLog: ErrorLog = {
    id: createErrorId(),
    type,
    severity: customSeverity || severity,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? truncateStackTrace(error.stack) : undefined,
    context: generateErrorContext(context),
    timestamp: new Date(),
    digest: (error as any)?.digest,
    resolved: false,
    notifications: {
      email: false,
      console: false,
    },
  };

  // Add to error log
  errorLogs.push(errorLog);
  
  // Keep only the most recent errors
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.splice(0, errorLogs.length - MAX_ERROR_LOGS);
  }

  // Console logging
  if (ERROR_CONFIG.enableConsoleLogging) {
    console.error(`[ErrorLogger] ${errorLog.severity.toUpperCase()} - ${errorLog.type}:`, {
      id: errorLog.id,
      message: errorLog.message,
      context: errorLog.context,
      stack: errorLog.stack,
    });
    errorLog.notifications.console = true;
  }

  // Email notifications for high severity errors
  if (
    ERROR_CONFIG.enableEmailNotifications &&
    shouldSendEmailNotification(errorLog.severity)
  ) {
    try {
      const emailContent = generateErrorEmailReport(errorLog);
      
      // Use the existing email system (if available)
      try {
        const { Resend } = await import("resend");
        
        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          await resend.emails.send({
            from: `Error Logger <${process.env.EMAIL_FROM_DOMAIN || "onboarding@resend.dev"}>`,
            to: ERROR_CONFIG.adminEmail,
            subject: `🚨 ${errorLog.severity.toUpperCase()} Error: ${errorLog.type}`,
            html: emailContent,
            headers: {
              'X-Priority': errorLog.severity === ErrorSeverity.CRITICAL ? '1' : '3',
            },
          });
          
          errorLog.notifications.email = true;
        }
      } catch (resendError) {
        console.error("Failed to send error notification via Resend:", resendError);
      }
    } catch (emailError) {
      console.error("Failed to send error notification email:", emailError);
    }
  }

  return errorLog;
}

// Helper function to determine if email notification should be sent
function shouldSendEmailNotification(severity: ErrorSeverity): boolean {
  const severityLevels = {
    [ErrorSeverity.LOW]: 0,
    [ErrorSeverity.MEDIUM]: 1,
    [ErrorSeverity.HIGH]: 2,
    [ErrorSeverity.CRITICAL]: 3,
  };

  const threshold = severityLevels[ERROR_CONFIG.emailNotificationThreshold];
  const currentLevel = severityLevels[severity];

  return currentLevel >= threshold;
}

// Convenience functions for different error types
export const logClientError = (error: Error | unknown, context?: Partial<ErrorContext>) =>
  logError(error, { ...context, type: ErrorType.CLIENT_ERROR });

export const logServerError = (error: Error | unknown, context?: Partial<ErrorContext>) =>
  logError(error, { ...context, type: ErrorType.SERVER_ERROR }, ErrorSeverity.HIGH);

export const logAPIError = (error: Error | unknown, context?: Partial<ErrorContext>) =>
  logError(error, { ...context, type: ErrorType.API_ERROR });

export const logDatabaseError = (error: Error | unknown, context?: Partial<ErrorContext>) =>
  logError(error, { ...context, type: ErrorType.DATABASE_ERROR }, ErrorSeverity.CRITICAL);

// Analytics and monitoring functions
export function getErrorStats(): {
  total: number;
  byType: Record<ErrorType, number>;
  bySeverity: Record<ErrorSeverity, number>;
  recent: number;
  resolved: number;
} {
  const stats = {
    total: errorLogs.length,
    byType: {} as Record<ErrorType, number>,
    bySeverity: {} as Record<ErrorSeverity, number>,
    recent: 0,
    resolved: 0,
  };

  // Initialize counters
  Object.values(ErrorType).forEach(type => stats.byType[type] = 0);
  Object.values(ErrorSeverity).forEach(severity => stats.bySeverity[severity] = 0);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  errorLogs.forEach(log => {
    stats.byType[log.type]++;
    stats.bySeverity[log.severity]++;
    
    if (log.timestamp > oneHourAgo) stats.recent++;
    if (log.resolved) stats.resolved++;
  });

  return stats;
}

export function getRecentErrors(limit: number = 50): ErrorLog[] {
  return errorLogs
    .slice(-limit)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function markErrorAsResolved(errorId: string): boolean {
  const error = errorLogs.find(log => log.id === errorId);
  if (error) {
    error.resolved = true;
    return true;
  }
  return false;
}

export function clearOldErrors(daysOld: number = 7): number {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const initialLength = errorLogs.length;
  
  // Remove old errors
  for (let i = errorLogs.length - 1; i >= 0; i--) {
    if (errorLogs[i].timestamp < cutoffDate) {
      errorLogs.splice(i, 1);
    }
  }
  
  return initialLength - errorLogs.length;
}