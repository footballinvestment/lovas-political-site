// src/app/api/test-db/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { testDatabaseOperations, generateTestReport } from "@/lib/test-db-operations";
import { logAPIError } from "@/lib/error-logger";

export async function GET(request: Request) {
  try {
    // Check if user is admin (only admins can run database tests)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    // Run database tests
    const testResults = await testDatabaseOperations();
    
    if (format === "report") {
      // Generate markdown report
      const report = await generateTestReport();
      
      return new NextResponse(report, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="db-test-report-${new Date().toISOString().split('T')[0]}.md"`,
        },
      });
    }

    // Return JSON results
    const successCount = testResults.filter(r => r.success).length;
    const totalTests = testResults.length;
    
    return NextResponse.json({
      summary: {
        totalTests,
        successCount,
        failureCount: totalTests - successCount,
        successRate: ((successCount / totalTests) * 100).toFixed(1) + "%",
        allPassed: successCount === totalTests,
      },
      results: testResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await logAPIError(error, { endpoint: "/api/test-db", method: "GET" });
    return NextResponse.json(
      { error: "Failed to run database tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { testType = "all" } = data;

    // For now, we only support running all tests
    // In the future, we could add specific test types
    if (testType !== "all") {
      return NextResponse.json(
        { error: "Only 'all' test type is currently supported" },
        { status: 400 }
      );
    }

    const testResults = await testDatabaseOperations();
    const successCount = testResults.filter(r => r.success).length;
    const totalTests = testResults.length;
    
    return NextResponse.json({
      message: "Database tests completed",
      summary: {
        totalTests,
        successCount,
        failureCount: totalTests - successCount,
        successRate: ((successCount / totalTests) * 100).toFixed(1) + "%",
        allPassed: successCount === totalTests,
      },
      results: testResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await logAPIError(error, { endpoint: "/api/test-db", method: "POST" });
    return NextResponse.json(
      { error: "Failed to run database tests" },
      { status: 500 }
    );
  }
}