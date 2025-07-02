// src/app/api/security/csp-report/route.ts
import { NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";
import { withRateLimit } from "@/lib/rate-limit";

interface CSPReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

export async function POST(request: Request) {
  return withRateLimit("api", async () => {
    try {
      const report: CSPReport = await request.json();
      const cspReport = report['csp-report'];
      
      if (!cspReport) {
        return NextResponse.json(
          { error: "Invalid CSP report format" },
          { status: 400 }
        );
      }
      
      // Extract relevant information
      const violationDetails = {
        documentUri: cspReport['document-uri'],
        violatedDirective: cspReport['violated-directive'],
        blockedUri: cspReport['blocked-uri'],
        sourceFile: cspReport['source-file'],
        lineNumber: cspReport['line-number'],
        columnNumber: cspReport['column-number'],
        referrer: cspReport.referrer,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      };
      
      // Determine severity based on violation type
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      
      // High severity violations
      if (
        cspReport['violated-directive'].includes('script-src') ||
        cspReport['violated-directive'].includes('object-src') ||
        cspReport['blocked-uri'].includes('javascript:') ||
        cspReport['blocked-uri'].includes('data:')
      ) {
        severity = 'high';
      }
      
      // Critical severity violations (potential XSS attempts)
      if (
        cspReport['blocked-uri'].includes('eval') ||
        cspReport['blocked-uri'].includes('inline') ||
        cspReport['script-sample']?.includes('<script') ||
        cspReport['script-sample']?.includes('javascript:')
      ) {
        severity = 'critical';
      }
      
      // Log the CSP violation
      await logError(
        new Error(`CSP Violation: ${cspReport['violated-directive']}`),
        {
          context: 'CSP Violation Report',
          severity,
          cspReport: violationDetails,
          fullReport: cspReport,
        }
      );
      
      // In production, you might want to:
      // 1. Send alerts for critical violations
      // 2. Store violations in a database for analysis
      // 3. Block IPs with repeated critical violations
      
      if (severity === 'critical') {
        // Log critical violations with additional context
        await logError(
          new Error(`CRITICAL CSP Violation detected - potential XSS attempt`),
          {
            context: 'Security Alert',
            severity: 'critical',
            documentUri: cspReport['document-uri'],
            blockedUri: cspReport['blocked-uri'],
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || 'unknown',
          }
        );
      }
      
      return NextResponse.json({ received: true }, { status: 204 });
      
    } catch (error) {
      await logError(error, {
        context: 'CSP report processing error',
        endpoint: '/api/security/csp-report',
      });
      
      return NextResponse.json(
        { error: "Failed to process CSP report" },
        { status: 500 }
      );
    }
  });
}

// Handle other methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}