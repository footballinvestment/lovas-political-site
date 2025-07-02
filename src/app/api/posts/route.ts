// src/app/api/posts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { Status } from "@prisma/client";
import { logAPIError } from "@/lib/error-logger";
import { sanitizeInput } from "@/lib/input-sanitizer";
import { 
  SQLSecurity, 
  validateSQLSecurity, 
  createSafePaginationParams,
  createSafeSortParams 
} from "@/lib/sql-security";
import { validateCSRFMiddleware } from "@/lib/csrf";

export async function GET(request: Request) {
  return withRateLimit("api", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") as Status | null;
      const search = searchParams.get("search");
      const sortBy = searchParams.get("sortBy");
      const sortOrder = searchParams.get("sortOrder");
      
      // Enhanced SQL security validation
      const queryParams = Object.fromEntries(searchParams.entries());
      const securityValidation = SQLSecurity.validatePrismaQuery(queryParams, [
        'status', 'search', 'page', 'limit', 'sortBy', 'sortOrder'
      ]);
      
      if (!securityValidation.isValid) {
        await logAPIError(new Error('SQL security validation failed'), {
          context: 'Posts API security',
          errors: securityValidation.errors,
          queryParams,
        });
        
        return NextResponse.json(
          { error: "Invalid query parameters" },
          { status: 400 }
        );
      }
      
      // Safe pagination
      const pagination = createSafePaginationParams(
        searchParams.get("page"),
        searchParams.get("limit"),
        50 // Max 50 posts per page
      );
      
      // Safe sorting with allowed fields
      const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'status'];
      const sorting = createSafeSortParams(sortBy, sortOrder, allowedSortFields);

      // Build where clause with security validation
      const where: any = {};
      
      if (status) {
        // Validate status enum
        if (!Object.values(Status).includes(status)) {
          return NextResponse.json(
            { error: "Invalid status value" },
            { status: 400 }
          );
        }
        where.status = status;
      }
      
      if (search) {
        // Enhanced search security
        const searchSecurity = validateSQLSecurity(search, 'posts-search');
        if (!searchSecurity.isSafe) {
          return NextResponse.json(
            { error: "Invalid search query" },
            { status: 400 }
          );
        }
        
        const sanitizedSearch = SQLSecurity.sanitizeSearch(search);
        if (sanitizedSearch) {
          where.OR = [
            { title: { contains: sanitizedSearch, mode: "insensitive" } },
            { content: { contains: sanitizedSearch, mode: "insensitive" } },
          ];
        }
      }

      // Performance monitoring
      const endQuery = SQLSecurity.QueryPerformanceMonitor.startQuery('posts-findMany');
      
      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: sorting || { createdAt: "desc" },
          take: pagination.take,
          skip: pagination.skip,
          select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            status: true,
            imageUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.post.count({ where }),
      ]);
      
      endQuery(); // End performance monitoring

      const totalPages = Math.ceil(totalCount / pagination.take);
      const currentPage = Math.floor(pagination.skip / pagination.take) + 1;

      return NextResponse.json({
        data: posts,
        pagination: {
          page: currentPage,
          limit: pagination.take,
          totalPages,
          totalItems: totalCount,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/posts", method: "GET" });
      return NextResponse.json(
        { error: "Hiba történt a bejegyzések lekérése közben." },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      // CSRF protection
      if (!validateCSRFMiddleware(request, session.user.id)) {
        return NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        );
      }

      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.content) {
        return NextResponse.json(
          { error: "Hiányzó kötelező mezők: title, content" },
          { status: 400 }
        );
      }

      // Enhanced SQL security validation
      const allowedFields = ['title', 'content', 'slug', 'status', 'imageUrl'];
      const securityValidation = SQLSecurity.validatePrismaQuery(data, allowedFields);
      
      if (!securityValidation.isValid) {
        await logAPIError(new Error('SQL security validation failed'), {
          context: 'Posts creation security',
          errors: securityValidation.errors,
          userId: session.user.id,
        });
        
        return NextResponse.json(
          { error: "Invalid input data" },
          { status: 400 }
        );
      }

      // Additional validation for each field
      for (const field of ['title', 'content', 'slug']) {
        if (data[field]) {
          const fieldSecurity = validateSQLSecurity(data[field], `posts-create-${field}`);
          if (!fieldSecurity.isSafe) {
            return NextResponse.json(
              { error: `Invalid ${field} content` },
              { status: 400 }
            );
          }
        }
      }

      // Sanitize input with enhanced validation
      const sanitizedData = {
        title: sanitizeInput(data.title, { maxLength: 200 }),
        content: sanitizeInput(data.content, { 
          allowHTML: true, 
          allowLinks: true,
          maxLength: 50000 
        }),
        slug: data.slug ? sanitizeInput(data.slug, { maxLength: 100 }) : undefined,
        status: data.status || Status.DRAFT,
        imageUrl: data.imageUrl ? sanitizeInput(data.imageUrl, { maxLength: 500 }) : null,
      };

      // Validate status enum
      if (!Object.values(Status).includes(sanitizedData.status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }

      // Generate slug if not provided
      if (!sanitizedData.slug) {
        sanitizedData.slug = sanitizedData.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 100);
      }

      // Performance monitoring
      const endQuery = SQLSecurity.QueryPerformanceMonitor.startQuery('posts-create');

      // Check if slug already exists
      const existingPost = await prisma.post.findUnique({
        where: { slug: sanitizedData.slug },
      });

      if (existingPost) {
        sanitizedData.slug = `${sanitizedData.slug}-${Date.now()}`;
      }

      const post = await prisma.post.create({
        data: sanitizedData,
      });
      
      endQuery();

      // Log successful creation for audit
      await logAPIError(new Error(`Post created: ${post.title}`), {
        context: 'Post creation audit',
        postId: post.id,
        userId: session.user.id,
        severity: 'info',
      });

      return NextResponse.json(post, { status: 201 });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/posts", method: "POST" });
      return NextResponse.json(
        { error: "Hiba történt a bejegyzés létrehozása közben." },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      const data = await request.json();
      
      if (!data.id) {
        return NextResponse.json(
          { error: "Hiányzó bejegyzés azonosító" },
          { status: 400 }
        );
      }

      // Check if post exists
      const existingPost = await prisma.post.findUnique({
        where: { id: data.id },
      });

      if (!existingPost) {
        return NextResponse.json(
          { error: "A bejegyzés nem található" },
          { status: 404 }
        );
      }

      // Sanitize input
      const updateData: any = {};
      if (data.title) updateData.title = sanitizeInput(data.title);
      if (data.content) updateData.content = sanitizeInput(data.content, { allowHTML: true });
      if (data.slug) updateData.slug = sanitizeInput(data.slug);
      if (data.status) updateData.status = data.status;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ? sanitizeInput(data.imageUrl) : null;

      // Check slug uniqueness if slug is being updated
      if (updateData.slug && updateData.slug !== existingPost.slug) {
        const slugExists = await prisma.post.findUnique({
          where: { slug: updateData.slug },
        });

        if (slugExists && slugExists.id !== data.id) {
          return NextResponse.json(
            { error: "Ez a slug már használatban van" },
            { status: 409 }
          );
        }
      }

      const post = await prisma.post.update({
        where: { id: data.id },
        data: updateData,
      });

      return NextResponse.json(post);
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/posts", method: "PUT" });
      return NextResponse.json(
        { error: "Hiba történt a bejegyzés módosítása közben." },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      
      if (!id) {
        return NextResponse.json(
          { error: "Hiányzó bejegyzés azonosító" },
          { status: 400 }
        );
      }

      // Check if post exists
      const existingPost = await prisma.post.findUnique({
        where: { id },
      });

      if (!existingPost) {
        return NextResponse.json(
          { error: "A bejegyzés nem található" },
          { status: 404 }
        );
      }

      await prisma.post.delete({
        where: { id },
      });

      return NextResponse.json({ 
        success: true,
        message: "A bejegyzés sikeresen törölve lett"
      });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/posts", method: "DELETE" });
      return NextResponse.json(
        { error: "Hiba történt a bejegyzés törlése közben." },
        { status: 500 }
      );
    }
  });
}
