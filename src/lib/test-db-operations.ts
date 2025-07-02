// src/lib/test-db-operations.ts
// Test utility for verifying database operations work correctly

import { PrismaClient, Status, EventStatus, ProgramStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface TestResult {
  operation: string;
  success: boolean;
  error?: string;
  data?: any;
}

export async function testDatabaseOperations(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Test 1: Database Connection
    try {
      await prisma.$connect();
      results.push({
        operation: "Database Connection",
        success: true,
        data: "Connected successfully",
      });
    } catch (error) {
      results.push({
        operation: "Database Connection",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return results; // If connection fails, stop other tests
    }

    // Test 2: Posts CRUD Operations
    let testPostId = "";
    
    // Create Post
    try {
      const newPost = await prisma.post.create({
        data: {
          title: "Test Post",
          slug: "test-post",
          content: "This is a test post content",
          status: Status.DRAFT,
        },
      });
      testPostId = newPost.id;
      results.push({
        operation: "Create Post",
        success: true,
        data: `Created post with ID: ${newPost.id}`,
      });
    } catch (error) {
      results.push({
        operation: "Create Post",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Read Post
    if (testPostId) {
      try {
        const post = await prisma.post.findUnique({
          where: { id: testPostId },
        });
        results.push({
          operation: "Read Post",
          success: !!post,
          data: post ? `Found post: ${post.title}` : "Post not found",
        });
      } catch (error) {
        results.push({
          operation: "Read Post",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Update Post
      try {
        const updatedPost = await prisma.post.update({
          where: { id: testPostId },
          data: {
            title: "Updated Test Post",
            status: Status.PUBLISHED,
          },
        });
        results.push({
          operation: "Update Post",
          success: true,
          data: `Updated post title to: ${updatedPost.title}`,
        });
      } catch (error) {
        results.push({
          operation: "Update Post",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Delete Post
      try {
        await prisma.post.delete({
          where: { id: testPostId },
        });
        results.push({
          operation: "Delete Post",
          success: true,
          data: "Post deleted successfully",
        });
      } catch (error) {
        results.push({
          operation: "Delete Post",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Test 3: Events CRUD Operations
    let testEventId = "";
    
    try {
      const newEvent = await prisma.event.create({
        data: {
          title: "Test Event",
          description: "This is a test event",
          location: "Test Location",
          startDate: new Date(),
          endDate: new Date(Date.now() + 3600000), // 1 hour later
          status: EventStatus.UPCOMING,
        },
      });
      testEventId = newEvent.id;
      results.push({
        operation: "Create Event",
        success: true,
        data: `Created event with ID: ${newEvent.id}`,
      });

      // Update Event
      const updatedEvent = await prisma.event.update({
        where: { id: testEventId },
        data: {
          title: "Updated Test Event",
          status: EventStatus.ONGOING,
        },
      });
      results.push({
        operation: "Update Event",
        success: true,
        data: `Updated event title to: ${updatedEvent.title}`,
      });

      // Delete Event
      await prisma.event.delete({
        where: { id: testEventId },
      });
      results.push({
        operation: "Delete Event",
        success: true,
        data: "Event deleted successfully",
      });
    } catch (error) {
      results.push({
        operation: "Events CRUD",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 4: Program Points CRUD Operations
    let testProgramPointId = "";
    
    try {
      const newProgramPoint = await prisma.programPoint.create({
        data: {
          title: "Test Program Point",
          category: "Test Category",
          description: "This is a test program point",
          details: "Detailed information about the test program point",
          priority: 1,
          status: ProgramStatus.PLANNED,
        },
      });
      testProgramPointId = newProgramPoint.id;
      results.push({
        operation: "Create Program Point",
        success: true,
        data: `Created program point with ID: ${newProgramPoint.id}`,
      });

      // Update Program Point
      const updatedProgramPoint = await prisma.programPoint.update({
        where: { id: testProgramPointId },
        data: {
          title: "Updated Test Program Point",
          status: ProgramStatus.IN_PROGRESS,
        },
      });
      results.push({
        operation: "Update Program Point",
        success: true,
        data: `Updated program point title to: ${updatedProgramPoint.title}`,
      });

      // Delete Program Point
      await prisma.programPoint.delete({
        where: { id: testProgramPointId },
      });
      results.push({
        operation: "Delete Program Point",
        success: true,
        data: "Program point deleted successfully",
      });
    } catch (error) {
      results.push({
        operation: "Program Points CRUD",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 5: Query Performance and Pagination
    try {
      const start = Date.now();
      const [posts, events, programPoints] = await Promise.all([
        prisma.post.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
        }),
        prisma.event.findMany({
          take: 10,
          orderBy: { startDate: "asc" },
        }),
        prisma.programPoint.findMany({
          take: 10,
          orderBy: { priority: "asc" },
        }),
      ]);
      const duration = Date.now() - start;
      
      results.push({
        operation: "Parallel Queries Performance",
        success: true,
        data: `Fetched ${posts.length} posts, ${events.length} events, ${programPoints.length} program points in ${duration}ms`,
      });
    } catch (error) {
      results.push({
        operation: "Parallel Queries Performance",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 6: Database Constraints and Validation
    try {
      // Test unique slug constraint
      await prisma.post.create({
        data: {
          title: "Test Unique Slug 1",
          slug: "unique-test-slug",
          content: "Content 1",
          status: Status.DRAFT,
        },
      });

      try {
        await prisma.post.create({
          data: {
            title: "Test Unique Slug 2",
            slug: "unique-test-slug", // Same slug, should fail
            content: "Content 2",
            status: Status.DRAFT,
          },
        });
        results.push({
          operation: "Unique Slug Constraint",
          success: false,
          error: "Unique constraint was not enforced",
        });
      } catch (uniqueError) {
        results.push({
          operation: "Unique Slug Constraint",
          success: true,
          data: "Unique constraint properly enforced",
        });
      }

      // Clean up
      await prisma.post.deleteMany({
        where: { slug: "unique-test-slug" },
      });
    } catch (error) {
      results.push({
        operation: "Unique Slug Constraint",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 7: Search Functionality
    try {
      // Create test data for search
      const searchTestPost = await prisma.post.create({
        data: {
          title: "Searchable Test Post",
          slug: "searchable-test-post",
          content: "This content contains specific keywords for testing search functionality",
          status: Status.PUBLISHED,
        },
      });

      // Test search
      const searchResults = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: "Searchable", mode: "insensitive" } },
            { content: { contains: "keywords", mode: "insensitive" } },
          ],
        },
      });

      const found = searchResults.some(post => post.id === searchTestPost.id);
      
      results.push({
        operation: "Search Functionality",
        success: found,
        data: found ? `Found ${searchResults.length} search results` : "Search did not find expected results",
      });

      // Clean up
      await prisma.post.delete({
        where: { id: searchTestPost.id },
      });
    } catch (error) {
      results.push({
        operation: "Search Functionality",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

  } finally {
    await prisma.$disconnect();
  }

  return results;
}

export async function generateTestReport(): Promise<string> {
  const results = await testDatabaseOperations();
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  const successRate = ((successCount / totalTests) * 100).toFixed(1);

  let report = `# Database Operations Test Report\n\n`;
  report += `**Test Summary:** ${successCount}/${totalTests} tests passed (${successRate}%)\n\n`;
  
  if (successCount === totalTests) {
    report += `✅ **All tests passed!** The database integration is working correctly.\n\n`;
  } else {
    report += `⚠️ **Some tests failed.** Please review the issues below.\n\n`;
  }

  report += `## Test Results:\n\n`;
  
  results.forEach((result, index) => {
    const status = result.success ? "✅" : "❌";
    report += `${index + 1}. **${result.operation}** ${status}\n`;
    
    if (result.success && result.data) {
      report += `   - ${result.data}\n`;
    } else if (!result.success && result.error) {
      report += `   - **Error:** ${result.error}\n`;
    }
    report += `\n`;
  });

  report += `## Recommendations:\n\n`;
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length === 0) {
    report += `- All database operations are working correctly\n`;
    report += `- The Prisma integration is ready for production\n`;
    report += `- Consider adding additional test data for development\n`;
  } else {
    report += `- Fix the following issues before deploying:\n`;
    failedTests.forEach(test => {
      report += `  - ${test.operation}: ${test.error}\n`;
    });
  }

  report += `\n---\n`;
  report += `*Report generated on ${new Date().toISOString()}*\n`;

  return report;
}