// src/app/api/themes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET() {
  return withRateLimit("default", async () => {
    try {
      const themes = await prisma.theme.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(themes);
    } catch (error) {
      return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const data = await request.json();
      const theme = await prisma.theme.create({
        data: {
          name: data.name,
          description: data.description,
          fromColor: data.fromColor,
          toColor: data.toColor,
          textColor: data.textColor,
          type: data.type,
          category: data.category,
          isActive: data.isActive,
        },
      });
      return NextResponse.json(theme);
    } catch (error) {
      return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  });
}

export async function PUT(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const data = await request.json();
      const theme = await prisma.theme.update({
        where: { id: data.id },
        data,
      });
      return NextResponse.json(theme);
    } catch (error) {
      return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  });
}

export async function DELETE(request: Request) {
  return withRateLimit("admin", async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ error: "Hiányzó ID" }, { status: 400 });
      }

      await prisma.theme.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  });
}
