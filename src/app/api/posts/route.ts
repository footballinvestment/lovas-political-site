// src/app/api/posts/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSlug } from "@/utils/posts";

// POST /api/posts - Új bejegyzés létrehozása
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Létrehozzuk a slug-ot a címből
    const slug = generateSlug(data.title);

    const post = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        slug: slug,
        status: data.status,
        imageUrl: data.imageUrl || null,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POSTS_POST]", error);
    return new NextResponse("Hiba történt a bejegyzés létrehozásakor", {
      status: 500,
    });
  }
}

// GET /api/posts - Bejegyzések listázása
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[POSTS_GET]", error);
    return new NextResponse("Hiba történt a bejegyzések lekérésekor", {
      status: 500,
    });
  }
}
