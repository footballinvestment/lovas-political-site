// src/app/api/events/[id]/route.ts
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

      const event = await prisma.event.findUnique({
        where: { id },
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
      });

      if (!event) {
        return NextResponse.json(
          { error: "Az esemény nem található" },
          { status: 404 }
        );
      }

      return NextResponse.json(event);
    } catch (error) {
      await logAPIError(error, { 
        endpoint: `/api/events/${params.id}`, 
        method: "GET" 
      });
      return NextResponse.json(
        { error: "Hiba történt az esemény lekérése közben." },
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

      // Validate date relationship if dates are being updated
      const finalStartDate = updateData.startDate || existingEvent.startDate;
      const finalEndDate = updateData.endDate || existingEvent.endDate;

      if (finalStartDate >= finalEndDate) {
        return NextResponse.json(
          { error: "A kezdő dátum nem lehet későbbi vagy egyenlő a befejező dátumnál" },
          { status: 400 }
        );
      }

      const event = await prisma.event.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(event);
    } catch (error) {
      await logAPIError(error, { 
        endpoint: `/api/events/${params.id}`, 
        method: "PATCH" 
      });
      return NextResponse.json(
        { error: "Hiba történt az esemény módosítása közben." },
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
      await logAPIError(error, { 
        endpoint: `/api/events/${params.id}`, 
        method: "DELETE" 
      });
      return NextResponse.json(
        { error: "Hiba történt az esemény törlése közben." },
        { status: 500 }
      );
    }
  });
}
