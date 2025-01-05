import type { NextApiResponse } from "next";
import { headers } from "next/headers";

interface RateLimitContext {
  limit: number;
  windowMs: number;
  currentTimestamp: number;
}

const ipRequests = new Map<string, { count: number; timestamp: number }>();

export function getRateLimitInfo(
  ip: string
): { remaining: number; reset: Date } | null {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 perc
  const limit = 5; // Maximum 5 kérés / perc

  const requestInfo = ipRequests.get(ip);

  if (!requestInfo) {
    return {
      remaining: limit - 1,
      reset: new Date(now + windowMs),
    };
  }

  const timeSinceLastRequest = now - requestInfo.timestamp;

  if (timeSinceLastRequest > windowMs) {
    return {
      remaining: limit - 1,
      reset: new Date(now + windowMs),
    };
  }

  return {
    remaining: Math.max(0, limit - requestInfo.count),
    reset: new Date(requestInfo.timestamp + windowMs),
  };
}

export async function checkRateLimit(context: RateLimitContext) {
  const headersList = headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  const now = Date.now();
  const requestInfo = ipRequests.get(ip);

  if (!requestInfo) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (now - requestInfo.timestamp > context.windowMs) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (requestInfo.count >= context.limit) {
    return false;
  }

  ipRequests.set(ip, {
    count: requestInfo.count + 1,
    timestamp: requestInfo.timestamp,
  });

  return true;
}
