// src/app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { withRateLimit } from "@/lib/rate-limit";
import { logAPIError } from "@/lib/error-logger";
import { sanitizeInput } from "@/lib/input-sanitizer";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  return withRateLimit("default", async () => {
    try {
      const { id } = params;

      const post = await prisma.post.findUnique({
        where: { id },
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
      });

      if (!post) {
        return NextResponse.json(
          { error: "A bejegyzés nem található" },
          { status: 404 }
        );
      }

      // If post is not published, require admin access
      if (post.status !== "PUBLISHED") {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
          return NextResponse.json(
            { error: "A bejegyzés nem érhető el" },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(post);
    } catch (error) {
      await logAPIError(error, { 
        endpoint: `/api/posts/${params.id}`, 
        method: "GET" 
      });
      return NextResponse.json(
        { error: "Hiba történt a bejegyzés lekérése közben." },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      const { id } = params;
      const data = await request.json();

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

      // Build update data with sanitization
      const updateData: any = {};
      if (data.title !== undefined) {
        updateData.title = sanitizeInput(data.title);
        
        // Auto-generate slug from title if not provided
        if (!data.slug) {
          updateData.slug = updateData.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim("-");
        }
      }
      if (data.content !== undefined) updateData.content = sanitizeInput(data.content, { allowHTML: true });
      if (data.slug !== undefined) updateData.slug = sanitizeInput(data.slug);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ? sanitizeInput(data.imageUrl) : null;

      // Check slug uniqueness if slug is being updated
      if (updateData.slug && updateData.slug !== existingPost.slug) {
        const slugExists = await prisma.post.findUnique({
          where: { slug: updateData.slug },
        });

        if (slugExists && slugExists.id !== id) {
          updateData.slug = `${updateData.slug}-${Date.now()}`;
        }
      }

      const post = await prisma.post.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(post);
    } catch (error) {
      await logAPIError(error, { 
        endpoint: `/api/posts/${params.id}`, 
        method: "PATCH" 
      });
      return NextResponse.json(
        { error: "Hiba történt a bejegyzés módosítása közben." },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      const { id } = params;

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
        message: "A bejegyzés sikeresen törölve lett",
      });
    } catch (error) {
      await logAPIError(error, { 
        endpoint: `/api/posts/${params.id}`, 
        method: "DELETE" 
      });
      return NextResponse.json(
        { error: "Hiba történt a bejegyzés törlése közben." },
        { status: 500 }
      );
    }
  });
}
