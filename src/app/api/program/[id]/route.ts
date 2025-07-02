// src/app/api/program/[id]/route.ts
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

      const programPoint = await prisma.programPoint.findUnique({
        where: { id },
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
      });

      if (!programPoint) {
        return NextResponse.json(
          { error: "A programpont nem található" },
          { status: 404 }
        );
      }

      return NextResponse.json(programPoint);
    } catch (error) {
      await logAPIError(error, { 
        endpoint: `/api/program/${params.id}`, 
        method: "GET" 
      });
      return NextResponse.json(
        { error: "Hiba történt a programpont lekérése közben." },
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

      // Build update data with sanitization
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = sanitizeInput(data.title);
      if (data.category !== undefined) updateData.category = sanitizeInput(data.category);
      if (data.description !== undefined) updateData.description = sanitizeInput(data.description, { allowHTML: true });
      if (data.details !== undefined) updateData.details = sanitizeInput(data.details, { allowHTML: true });
      if (data.status !== undefined) updateData.status = data.status;
      
      if (data.priority !== undefined) {
        const priority = parseInt(data.priority);
        if (isNaN(priority) || priority < 1 || priority > 100) {
          return NextResponse.json(
            { error: "A prioritás 1 és 100 között kell lennie" },
            { status: 400 }
          );
        }
        updateData.priority = priority;
      }

      const programPoint = await prisma.programPoint.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(programPoint);
    } catch (error) {
      await logAPIError(error, { 
        endpoint: `/api/program/${params.id}`, 
        method: "PATCH" 
      });
      return NextResponse.json(
        { error: "Hiba történt a programpont módosítása közben." },
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
      await logAPIError(error, { 
        endpoint: `/api/program/${params.id}`, 
        method: "DELETE" 
      });
      return NextResponse.json(
        { error: "Hiba történt a programpont törlése közben." },
        { status: 500 }
      );
    }
  });
}