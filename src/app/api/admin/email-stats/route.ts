// src/app/api/admin/email-stats/route.ts
import { NextResponse } from "next/server";
import { getEmailStats, getRecentEmailLog, validateEmailConfig } from "@/lib/email";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get email statistics and recent log
    const stats = getEmailStats();
    const recentEmails = getRecentEmailLog(limit);
    const config = validateEmailConfig();

    return NextResponse.json({
      stats,
      recentEmails,
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email statistics" },
      { status: 500 }
    );
  }
}