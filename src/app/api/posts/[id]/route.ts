// src/app/api/posts/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSlug } from "@/utils/posts";

// GET - Egy bejegyzés lekérése
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return new NextResponse("Bejegyzés nem található", { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POST_GET]", error);
    return new NextResponse("Hiba történt", { status: 500 });
  }
}

// PATCH - Bejegyzés módosítása
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Ha változott a cím, generáljunk új slug-ot
    const slug = body.title ? generateSlug(body.title) : undefined;

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        title: body.title,
        content: body.content,
        slug: slug,
        status: body.status,
        imageUrl: body.imageUrl,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POST_PATCH]", error);
    return new NextResponse("Hiba történt a módosítás során", { status: 500 });
  }
}

// DELETE - Bejegyzés törlése
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.post.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST_DELETE]", error);
    return new NextResponse("Hiba történt a törlés során", { status: 500 });
  }
}
