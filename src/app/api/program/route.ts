// src/app/api/program/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { withRateLimit } from "@/lib/rate-limit";
import { ProgramStatus } from "@prisma/client";
import { logAPIError } from "@/lib/error-logger";
import { sanitizeInput } from "@/lib/input-sanitizer";

export async function GET(request: Request) {
  return withRateLimit("default", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") as ProgramStatus | null;
      const category = searchParams.get("category");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (category) {
        where.category = category;
      }

      const [programPoints, totalCount] = await Promise.all([
        prisma.programPoint.findMany({
          where,
          orderBy: [
            { priority: "asc" },
            { createdAt: "desc" },
          ],
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            details: true,
            priority: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.programPoint.count({ where }),
      ]);

      const formattedProgramPoints = programPoints.map((point) => ({
        id: point.id,
        title: point.title,
        category: point.category,
        description: point.description,
        details: point.details,
        priority: point.priority,
        status: point.status,
        createdAt: point.createdAt,
        updatedAt: point.updatedAt,
      }));

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        data: formattedProgramPoints,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/program", method: "GET" });
      return NextResponse.json(
        { error: "Hiba történt a programpontok lekérése közben." },
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

      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.category || !data.description) {
        return NextResponse.json(
          { error: "Hiányzó kötelező mezők: title, category, description" },
          { status: 400 }
        );
      }

      // Validate priority
      const priority = parseInt(data.priority) || 1;
      if (priority < 1 || priority > 100) {
        return NextResponse.json(
          { error: "A prioritás 1 és 100 között kell lennie" },
          { status: 400 }
        );
      }

      // Sanitize input
      const sanitizedData = {
        title: sanitizeInput(data.title),
        category: sanitizeInput(data.category),
        description: sanitizeInput(data.description, { allowHTML: true }),
        details: data.details ? sanitizeInput(data.details, { allowHTML: true }) : "",
        priority,
        status: data.status || ProgramStatus.PLANNED,
      };

      const programPoint = await prisma.programPoint.create({
        data: sanitizedData,
      });

      return NextResponse.json(programPoint, { status: 201 });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/program", method: "POST" });
      return NextResponse.json(
        { error: "Hiba történt a programpont létrehozása közben." },
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
          { error: "Hiányzó programpont azonosító" },
          { status: 400 }
        );
      }

      // Check if program point exists
      const existingProgramPoint = await prisma.programPoint.findUnique({
        where: { id: data.id },
      });

      if (!existingProgramPoint) {
        return NextResponse.json(
          { error: "A programpont nem található" },
          { status: 404 }
        );
      }

      // Build update data with sanitization
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = sanitizeInput(data.title);
      if (data.category !== undefined) updateData.category = sanitizeInput(data.category);
      if (data.description !== undefined) updateData.description = sanitizeInput(data.description, { allowHTML: true });
      if (data.details !== undefined) updateData.details = sanitizeInput(data.details, { allowHTML: true });
      if (data.status !== undefined) updateData.status = data.status;
      
      if (data.priority !== undefined) {
        const priority = parseInt(data.priority);
        if (priority < 1 || priority > 100) {
          return NextResponse.json(
            { error: "A prioritás 1 és 100 között kell lennie" },
            { status: 400 }
          );
        }
        updateData.priority = priority;
      }

      const programPoint = await prisma.programPoint.update({
        where: { id: data.id },
        data: updateData,
      });

      return NextResponse.json(programPoint);
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/program", method: "PUT" });
      return NextResponse.json(
        { error: "Hiba történt a programpont módosítása közben." },
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
          { error: "Hiányzó programpont azonosító" },
          { status: 400 }
        );
      }

      // Check if program point exists
      const existingProgramPoint = await prisma.programPoint.findUnique({
        where: { id },
      });

      if (!existingProgramPoint) {
        return NextResponse.json(
          { error: "A programpont nem található" },
          { status: 404 }
        );
      }

      await prisma.programPoint.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "A programpont sikeresen törölve lett",
      });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/program", method: "DELETE" });
      return NextResponse.json(
        { error: "Hiba történt a programpont törlése közben." },
        { status: 500 }
      );
    }
  });
}
