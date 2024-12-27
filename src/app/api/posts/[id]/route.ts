import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateSlug, generateExcerpt } from "@/utils/posts";

const prisma = new PrismaClient();

// GET /api/posts/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "A bejegyzés nem található." },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: "Hiba történt a bejegyzés lekérése közben." },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, status, imageUrl } = body;

    const post = await prisma.post.update({
      where: { id: params.id },
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
      { error: "Hiba történt a bejegyzés módosítása közben." },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.post.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "A bejegyzés sikeresen törölve." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Hiba történt a bejegyzés törlése közben." },
      { status: 500 }
    );
  }
}
