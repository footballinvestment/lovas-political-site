// src/app/api/admin/error-logs/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getErrorStats, getRecentErrors, markErrorAsResolved, clearOldErrors } from "@/lib/error-logger";

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
    const action = searchParams.get("action");

    // Handle different actions
    if (action === "stats") {
      const stats = getErrorStats();
      return NextResponse.json(stats);
    }

    if (action === "clear") {
      const daysOld = parseInt(searchParams.get("days") || "7");
      const cleared = clearOldErrors(daysOld);
      return NextResponse.json({ 
        message: `Cleared ${cleared} old error logs`,
        cleared 
      });
    }

    // Default: return recent errors with stats
    const [stats, recentErrors] = [getErrorStats(), getRecentErrors(limit)];

    return NextResponse.json({
      stats,
      errors: recentErrors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { errorId, action } = await request.json();

    if (action === "resolve" && errorId) {
      const resolved = markErrorAsResolved(errorId);
      
      if (resolved) {
        return NextResponse.json({ 
          message: "Error marked as resolved",
          errorId 
        });
      } else {
        return NextResponse.json(
          { error: "Error not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid action or missing errorId" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error logs PATCH API error:", error);
    return NextResponse.json(
      { error: "Failed to update error log" },
      { status: 500 }
    );
  }
}