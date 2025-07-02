// src/app/api/slides/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET() {
  return withRateLimit("default", async () => {
    try {
      const slides = await prisma.slide.findMany({
        orderBy: { order: "asc" },
      });
      return NextResponse.json(slides);
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
      const slide = await prisma.slide.create({
        data: {
          type: data.type,
          title: data.title,
          subtitle: data.subtitle || null,
          order: data.order || 0,
          isActive: data.isActive || true,
          gradientFrom: data.gradientFrom || null,
          gradientTo: data.gradientTo || null,
          mediaUrl: data.mediaUrl || null,
          ctaText: data.ctaText || null,
          ctaLink: data.ctaLink || null,
          videoType: data.videoType || null,
          autoPlay: data.autoPlay || true,
          isLoop: data.isLoop || true,
          isMuted: data.isMuted || true,
        },
      });

      return NextResponse.json(slide);
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
      const slide = await prisma.slide.update({
        where: { id: data.id },
        data,
      });

      return NextResponse.json(slide);
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

      await prisma.slide.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  });
}
