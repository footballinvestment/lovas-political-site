// src/app/api/events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { withRateLimit } from "@/lib/rate-limit";
import { EventStatus } from "@prisma/client";
import { logAPIError } from "@/lib/error-logger";
import { sanitizeInput } from "@/lib/input-sanitizer";

export async function GET(request: Request) {
  return withRateLimit("default", async () => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") as EventStatus | null;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const upcoming = searchParams.get("upcoming") === "true";
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (upcoming) {
        where.startDate = {
          gte: new Date(),
        };
      }

      const [events, totalCount] = await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: { startDate: "asc" },
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            status: true,
            imageUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.event.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        data: events,
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
      await logAPIError(error, { endpoint: "/api/events", method: "GET" });
      return NextResponse.json(
        { error: "Hiba történt az események lekérése közben." },
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
      if (!data.title || !data.description || !data.location || !data.startDate || !data.endDate) {
        return NextResponse.json(
          { error: "Hiányzó kötelező mezők: title, description, location, startDate, endDate" },
          { status: 400 }
        );
      }

      // Validate dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Érvénytelen dátum formátum" },
          { status: 400 }
        );
      }

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: "A kezdő dátum nem lehet későbbi vagy egyenlő a befejező dátumnál" },
          { status: 400 }
        );
      }

      // Sanitize input
      const sanitizedData = {
        title: sanitizeInput(data.title),
        description: sanitizeInput(data.description, { allowHTML: true }),
        location: sanitizeInput(data.location),
        startDate,
        endDate,
        status: data.status || EventStatus.UPCOMING,
        imageUrl: data.imageUrl ? sanitizeInput(data.imageUrl) : null,
      };

      const event = await prisma.event.create({
        data: sanitizedData,
      });

      return NextResponse.json(event, { status: 201 });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/events", method: "POST" });
      return NextResponse.json(
        { error: "Hiba történt az esemény létrehozása közben." },
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
          { error: "Hiányzó esemény azonosító" },
          { status: 400 }
        );
      }

      // Check if event exists
      const existingEvent = await prisma.event.findUnique({
        where: { id: data.id },
      });

      if (!existingEvent) {
        return NextResponse.json(
          { error: "Az esemény nem található" },
          { status: 404 }
        );
      }

      // Build update data with sanitization
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = sanitizeInput(data.title);
      if (data.description !== undefined) updateData.description = sanitizeInput(data.description, { allowHTML: true });
      if (data.location !== undefined) updateData.location = sanitizeInput(data.location);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ? sanitizeInput(data.imageUrl) : null;

      // Validate and update dates
      if (data.startDate !== undefined) {
        const startDate = new Date(data.startDate);
        if (isNaN(startDate.getTime())) {
          return NextResponse.json(
            { error: "Érvénytelen kezdő dátum formátum" },
            { status: 400 }
          );
        }
        updateData.startDate = startDate;
      }

      if (data.endDate !== undefined) {
        const endDate = new Date(data.endDate);
        if (isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: "Érvénytelen befejező dátum formátum" },
            { status: 400 }
          );
        }
        updateData.endDate = endDate;
      }

      // Validate date relationship if both dates are being updated
      const finalStartDate = updateData.startDate || existingEvent.startDate;
      const finalEndDate = updateData.endDate || existingEvent.endDate;

      if (finalStartDate >= finalEndDate) {
        return NextResponse.json(
          { error: "A kezdő dátum nem lehet későbbi vagy egyenlő a befejező dátumnál" },
          { status: 400 }
        );
      }

      const event = await prisma.event.update({
        where: { id: data.id },
        data: updateData,
      });

      return NextResponse.json(event);
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/events", method: "PUT" });
      return NextResponse.json(
        { error: "Hiba történt az esemény módosítása közben." },
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

      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return NextResponse.json(
          { error: "Hiányzó esemény azonosító" },
          { status: 400 }
        );
      }

      // Check if event exists
      const existingEvent = await prisma.event.findUnique({
        where: { id },
      });

      if (!existingEvent) {
        return NextResponse.json(
          { error: "Az esemény nem található" },
          { status: 404 }
        );
      }

      await prisma.event.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Az esemény sikeresen törölve lett",
      });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/events", method: "DELETE" });
      return NextResponse.json(
        { error: "Hiba történt az esemény törlése közben." },
        { status: 500 }
      );
    }
  });
}
