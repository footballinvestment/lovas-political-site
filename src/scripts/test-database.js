#!/usr/bin/env node

// scripts/test-database.js
// CLI script to test database operations

const { PrismaClient } = require('@prisma/client');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testBasicOperations() {
  const prisma = new PrismaClient();
  let success = true;

  log('\n🧪 Testing Database Operations', colors.bold + colors.cyan);
  log('===============================================', colors.cyan);

  try {
    // Test 1: Connection
    log('\n1. Testing database connection...', colors.bold);
    await prisma.$connect();
    log('✅ Database connection successful', colors.green);

    // Test 2: Basic Query
    log('\n2. Testing basic queries...', colors.bold);
    const postCount = await prisma.post.count();
    const eventCount = await prisma.event.count();
    const programCount = await prisma.programPoint.count();
    
    log(`✅ Found ${postCount} posts, ${eventCount} events, ${programCount} program points`, colors.green);

    // Test 3: CRUD Operations
    log('\n3. Testing CRUD operations...', colors.bold);
    
    // Create test post
    const testPost = await prisma.post.create({
      data: {
        title: 'CLI Test Post',
        slug: `cli-test-${Date.now()}`,
        content: 'This is a test post created by the CLI test script',
        status: 'DRAFT',
      },
    });
    log(`✅ Created test post: ${testPost.id}`, colors.green);

    // Update test post
    const updatedPost = await prisma.post.update({
      where: { id: testPost.id },
      data: { title: 'Updated CLI Test Post' },
    });
    log(`✅ Updated test post: ${updatedPost.title}`, colors.green);

    // Delete test post
    await prisma.post.delete({
      where: { id: testPost.id },
    });
    log('✅ Deleted test post', colors.green);

    // Test 4: Search functionality
    log('\n4. Testing search functionality...', colors.bold);
    const searchResults = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: 'test', mode: 'insensitive' } },
          { content: { contains: 'test', mode: 'insensitive' } },
        ],
      },
      take: 5,
    });
    log(`✅ Search found ${searchResults.length} results`, colors.green);

    // Test 5: Relations and complex queries
    log('\n5. Testing complex queries...', colors.bold);
    const recentPosts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        status: 'UPCOMING',
      },
      orderBy: { startDate: 'asc' },
      take: 3,
    });

    const priorityPrograms = await prisma.programPoint.findMany({
      orderBy: { priority: 'asc' },
      take: 3,
    });

    log(`✅ Found ${recentPosts.length} recent posts, ${upcomingEvents.length} upcoming events, ${priorityPrograms.length} priority programs`, colors.green);

  } catch (error) {
    success = false;
    log(`❌ Database test failed: ${error.message}`, colors.red);
    
    if (error.code) {
      log(`   Error code: ${error.code}`, colors.yellow);
    }
    
    if (error.meta) {
      log(`   Details: ${JSON.stringify(error.meta, null, 2)}`, colors.yellow);
    }
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  log('\n📊 Test Summary', colors.bold + colors.cyan);
  log('===============================================', colors.cyan);
  
  if (success) {
    log('✅ All database tests passed!', colors.green + colors.bold);
    log('   The database integration is working correctly.', colors.green);
  } else {
    log('❌ Database tests failed!', colors.red + colors.bold);
    log('   Please check the errors above and fix the issues.', colors.red);
    process.exit(1);
  }
}

// Check for specific test flags
const args = process.argv.slice(2);
const testType = args[0] || 'basic';

if (testType === 'basic' || testType === 'all') {
  testBasicOperations().catch((error) => {
    log(`❌ Fatal error: ${error.message}`, colors.red + colors.bold);
    process.exit(1);
  });
} else {
  log('❌ Unknown test type. Use: basic, all', colors.red);
  log('   Example: node scripts/test-database.js basic', colors.yellow);
  process.exit(1);
}