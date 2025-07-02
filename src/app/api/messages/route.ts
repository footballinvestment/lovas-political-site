// src/app/api/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { withRateLimit } from "@/lib/rate-limit";
import { logAPIError } from "@/lib/error-logger";
import { sanitizeInput } from "@/lib/input-sanitizer";
import { validateCSRFMiddleware } from "@/lib/csrf";

export async function GET(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      // CRITICAL FIX: Require admin authentication for viewing contact messages
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const status = searchParams.get("status");
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [messages, totalCount] = await Promise.all([
        prisma.contact.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
          select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            message: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.contact.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        data: messages,
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
      await logAPIError(error, { endpoint: "/api/messages", method: "GET" });
      return NextResponse.json(
        { error: "Hiba történt az üzenetek lekérése közben." },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      // CRITICAL FIX: Require admin role, not just authentication
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      // CSRF protection for state-changing operations
      if (!validateCSRFMiddleware(request, session.user.id)) {
        return NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        );
      }

      const data = await request.json();

      // Validate required fields
      if (!data.id) {
        return NextResponse.json(
          { error: "Hiányzó üzenet azonosító" },
          { status: 400 }
        );
      }

      // Validate status field
      const allowedStatuses = ["NEW", "READ", "REPLIED", "ARCHIVED"];
      if (data.status && !allowedStatuses.includes(data.status)) {
        return NextResponse.json(
          { error: "Érvénytelen státusz érték" },
          { status: 400 }
        );
      }

      // Check if message exists
      const existingMessage = await prisma.contact.findUnique({
        where: { id: data.id },
      });

      if (!existingMessage) {
        return NextResponse.json(
          { error: "Az üzenet nem található" },
          { status: 404 }
        );
      }

      // Build update data with validation
      const updateData: any = {};
      if (data.status) {
        updateData.status = data.status;
      }

      // Optional: Add admin note field if provided
      if (data.adminNote) {
        updateData.adminNote = sanitizeInput(data.adminNote, { maxLength: 1000 });
      }

      const message = await prisma.contact.update({
        where: { id: data.id },
        data: updateData,
      });

      return NextResponse.json(message);
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/messages", method: "PUT" });
      return NextResponse.json(
        { error: "Hiba történt az üzenet módosítása közben." },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      // CRITICAL FIX: Require admin role, not just authentication
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }

      // CSRF protection for state-changing operations
      if (!validateCSRFMiddleware(request, session.user.id)) {
        return NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json(
          { error: "Hiányzó üzenet azonosító" },
          { status: 400 }
        );
      }

      // Check if message exists before deletion
      const existingMessage = await prisma.contact.findUnique({
        where: { id },
      });

      if (!existingMessage) {
        return NextResponse.json(
          { error: "Az üzenet nem található" },
          { status: 404 }
        );
      }

      // Log the deletion for audit purposes
      await logAPIError(
        new Error(`Admin ${session.user.email} deleted contact message ${id}`),
        { 
          endpoint: "/api/messages", 
          method: "DELETE",
          severity: "info",
          messageId: id,
          adminId: session.user.id,
        }
      );

      await prisma.contact.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Az üzenet sikeresen törölve lett",
      });
    } catch (error) {
      await logAPIError(error, { endpoint: "/api/messages", method: "DELETE" });
      return NextResponse.json(
        { error: "Hiba történt az üzenet törlése közben." },
        { status: 500 }
      );
    }
  });
}
