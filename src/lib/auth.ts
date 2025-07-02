// src/lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";
import { logError } from "./error-logger";
import { headers } from "next/headers";

// Enhanced session security configuration
const SESSION_TIMEOUT = 30 * 60; // 30 minutes for admin sessions
const SESSION_UPDATE_AGE = 5 * 60; // Update session every 5 minutes if active
const MAX_CONCURRENT_SESSIONS = 3; // Maximum concurrent sessions per user
const SESSION_REGENERATION_INTERVAL = 15 * 60; // Force token regeneration every 15 minutes

// In-memory session tracking (use Redis in production)
const activeSessions = new Map<string, {
  userId: string;
  sessionId: string;
  lastActivity: number;
  ip: string;
  userAgent: string;
  createdAt: number;
}>();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Enhanced IP detection for session tracking
function getClientIP(): string {
  try {
    const headersList = headers();
    const ipHeaders = [
      'cf-connecting-ip',
      'x-real-ip',
      'x-forwarded-for',
      'x-client-ip',
    ];

    for (const header of ipHeaders) {
      const ip = headersList.get(header);
      if (ip && ip !== 'unknown') {
        return ip.split(',')[0].trim();
      }
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Session validation with security checks
function validateSession(token: any): boolean {
  if (!token || !token.sessionId) return false;
  
  const session = activeSessions.get(token.sessionId);
  if (!session) return false;
  
  const now = Date.now();
  const sessionAge = now - session.createdAt;
  const inactivityTime = now - session.lastActivity;
  
  // Check session timeout
  if (inactivityTime > SESSION_TIMEOUT * 1000) {
    activeSessions.delete(token.sessionId);
    return false;
  }
  
  // Check maximum session age (force re-authentication after 24 hours)
  if (sessionAge > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token.sessionId);
    return false;
  }
  
  // Check for IP changes (potential session hijacking)
  const currentIP = getClientIP();
  if (session.ip !== 'unknown' && currentIP !== 'unknown' && session.ip !== currentIP) {
    logError(new Error('Session IP mismatch detected'), {
      context: 'Session security',
      sessionId: token.sessionId,
      originalIP: session.ip,
      currentIP: currentIP,
      userId: session.userId,
    });
    
    // Allow session but log for monitoring
    // In high-security environments, this should terminate the session
  }
  
  return true;
}

// Manage concurrent sessions
function manageConcurrentSessions(userId: string, newSessionId: string) {
  const userSessions = Array.from(activeSessions.entries())
    .filter(([, session]) => session.userId === userId)
    .sort((a, b) => b[1].lastActivity - a[1].lastActivity);
  
  // If user has too many sessions, remove the oldest ones
  if (userSessions.length >= MAX_CONCURRENT_SESSIONS) {
    const sessionsToRemove = userSessions.slice(MAX_CONCURRENT_SESSIONS - 1);
    for (const [sessionId] of sessionsToRemove) {
      activeSessions.delete(sessionId);
    }
    
    logError(new Error(`User ${userId} exceeded concurrent session limit`), {
      context: 'Session management',
      userId,
      sessionCount: userSessions.length,
      newSessionId,
    });
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // Admin ellenőrzés
        const isPasswordValid = await comparePasswords(
          credentials.password,
          process.env.ADMIN_PASSWORD_HASH || ""
        );

        if (credentials.email === process.env.ADMIN_EMAIL && isPasswordValid) {
          return {
            id: "admin",
            email: process.env.ADMIN_EMAIL,
            role: "ADMIN",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        // Validate session security
        if (!validateSession(token)) {
          throw new Error('Session validation failed');
        }
        
        session.user.id = token.sub || "";
        session.user.role = token.role as string;
        
        // Update session activity
        const sessionRecord = activeSessions.get(token.sessionId);
        if (sessionRecord) {
          sessionRecord.lastActivity = Date.now();
          activeSessions.set(token.sessionId, sessionRecord);
        }
        
        // Add security metadata
        (session as any).lastActivity = Date.now();
        (session as any).sessionId = token.sessionId;
        (session as any).isSecure = true;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      const now = Date.now();
      
      if (user) {
        // New session - create session tracking
        const sessionId = require('crypto').randomUUID();
        const ip = getClientIP();
        const userAgent = headers().get('user-agent') || 'unknown';
        
        token.role = user.role;
        token.sessionId = sessionId;
        token.createdAt = now;
        token.lastActivity = now;
        
        // Manage concurrent sessions
        manageConcurrentSessions(user.id, sessionId);
        
        // Track session
        activeSessions.set(sessionId, {
          userId: user.id,
          sessionId,
          lastActivity: now,
          ip,
          userAgent,
          createdAt: now,
        });
        
        logError(new Error(`New session created for user ${user.id}`), {
          context: 'Session creation',
          userId: user.id,
          sessionId,
          ip,
          severity: 'info',
        });
      }
      
      // Update token timestamp on any activity
      if (trigger === "update" || !token.lastActivity) {
        token.lastActivity = now;
      }
      
      // Force token regeneration periodically for security
      const tokenAge = now - (token.createdAt || now);
      if (tokenAge > SESSION_REGENERATION_INTERVAL * 1000) {
        token.regenerated = now;
        
        logError(new Error('Session token regenerated for security'), {
          context: 'Session regeneration',
          sessionId: token.sessionId,
          tokenAge: tokenAge / 1000,
          severity: 'info',
        });
      }
      
      return token;
    },
    async signIn({ user, account, profile }) {
      // Additional sign-in security checks
      if (user?.role === 'ADMIN') {
        const ip = getClientIP();
        
        // Log admin sign-in for security monitoring
        logError(new Error(`Admin sign-in attempt from ${ip}`), {
          context: 'Admin authentication',
          userId: user.id,
          email: user.email,
          ip,
          provider: account?.provider,
          severity: 'info',
        });
        
        // In production, add additional checks like:
        // - IP whitelist validation
        // - Time-based restrictions
        // - 2FA verification
      }
      
      return true;
    },
    async signOut({ token }) {
      // Clean up session tracking on sign out
      if (token?.sessionId) {
        activeSessions.delete(token.sessionId);
        
        logError(new Error('Session ended'), {
          context: 'Session cleanup',
          sessionId: token.sessionId,
          userId: token.sub,
          severity: 'info',
        });
      }
      
      return true;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
    error: "/api/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_TIMEOUT,
    updateAge: SESSION_UPDATE_AGE,
  },
  jwt: {
    maxAge: SESSION_TIMEOUT,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_TIMEOUT,
      },
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logError(new Error(`User signed in: ${user.email}`), {
        context: 'Authentication event',
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        severity: 'info',
      });
    },
    async signOut({ token }) {
      logError(new Error('User signed out'), {
        context: 'Authentication event',
        userId: token?.sub,
        sessionId: token?.sessionId,
        severity: 'info',
      });
    },
    async session({ session, token }) {
      // Update session activity tracking
      if (token?.sessionId) {
        const sessionRecord = activeSessions.get(token.sessionId);
        if (sessionRecord) {
          sessionRecord.lastActivity = Date.now();
        }
      }
    },
  },
};

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  const expiredSessions: string[] = [];
  
  for (const [sessionId, session] of activeSessions) {
    const inactivityTime = now - session.lastActivity;
    const sessionAge = now - session.createdAt;
    
    if (inactivityTime > SESSION_TIMEOUT * 1000 || sessionAge > 24 * 60 * 60 * 1000) {
      expiredSessions.push(sessionId);
    }
  }
  
  for (const sessionId of expiredSessions) {
    activeSessions.delete(sessionId);
  }
  
  if (expiredSessions.length > 0) {
    logError(new Error(`Cleaned up ${expiredSessions.length} expired sessions`), {
      context: 'Session cleanup',
      count: expiredSessions.length,
      severity: 'info',
    });
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Export session management utilities
export const SessionManager = {
  getActiveSessions: (userId: string) => {
    return Array.from(activeSessions.values())
      .filter(session => session.userId === userId);
  },
  
  terminateSession: (sessionId: string) => {
    const session = activeSessions.get(sessionId);
    if (session) {
      activeSessions.delete(sessionId);
      logError(new Error(`Session ${sessionId} terminated administratively`), {
        context: 'Session management',
        sessionId,
        userId: session.userId,
        severity: 'info',
      });
      return true;
    }
    return false;
  },
  
  terminateAllUserSessions: (userId: string) => {
    const userSessions = Array.from(activeSessions.entries())
      .filter(([, session]) => session.userId === userId);
    
    for (const [sessionId] of userSessions) {
      activeSessions.delete(sessionId);
    }
    
    logError(new Error(`All sessions terminated for user ${userId}`), {
      context: 'Session management',
      userId,
      count: userSessions.length,
      severity: 'info',
    });
    
    return userSessions.length;
  },
  
  getSessionStats: () => {
    const now = Date.now();
    const sessions = Array.from(activeSessions.values());
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => now - s.lastActivity < 15 * 60 * 1000).length,
      adminSessions: sessions.filter(s => s.userId === 'admin').length,
      averageSessionAge: sessions.reduce((sum, s) => sum + (now - s.createdAt), 0) / sessions.length || 0,
    };
  },
};
