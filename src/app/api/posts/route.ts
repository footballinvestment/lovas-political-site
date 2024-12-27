import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateSlug, generateExcerpt } from "@/utils/posts";

const prisma = new PrismaClient();

// GET /api/posts
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return new NextResponse(JSON.stringify(posts), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Hiba történt a bejegyzések lekérése közben." },
      { status: 500 }
    );
  }
}

// POST /api/posts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, status = "DRAFT", imageUrl } = body;

    const post = await prisma.post.create({
      data: {
        title,
        slug: generateSlug(title),
        content,
        excerpt: generateExcerpt(content),
        status,
        imageUrl,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: "Hiba történt a bejegyzés létrehozása közben." },
      { status: 500 }
    );
  }
}
