// src/app/api/video/speed-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

// HEAD: Quick response time test for bandwidth estimation
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

// GET: Return test data for bandwidth measurement
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = searchParams.get('size') || 'small';
  
  // Different sizes for bandwidth testing
  const testData = {
    small: 'x'.repeat(1024), // 1KB
    medium: 'x'.repeat(10 * 1024), // 10KB
    large: 'x'.repeat(100 * 1024), // 100KB
  };

  const data = testData[size as keyof typeof testData] || testData.small;

  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}