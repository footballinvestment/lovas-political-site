// src/app/api/csrf-token/route.ts
import { NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/csrf";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET() {
  return withRateLimit("default", async () => {
    try {
      const token = generateCSRFToken();
      
      return NextResponse.json({
        token,
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });
    } catch (error) {
      console.error("CSRF token generation error:", error);
      return NextResponse.json(
        { error: "Failed to generate CSRF token" },
        { status: 500 }
      );
    }
  });
}