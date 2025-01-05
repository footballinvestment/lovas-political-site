import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContactStatus } from "@prisma/client";

// GET - Egy üzenet lekérése
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const message = await prisma.contact.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Üzenet nem található" },
        { status: 404 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Hiba történt az üzenet betöltése során" },
      { status: 500 }
    );
  }
}

// PATCH - Üzenet státuszának módosítása
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    // Ellenőrizzük, hogy érvényes-e a státusz
    if (!Object.values(ContactStatus).includes(status as ContactStatus)) {
      return NextResponse.json(
        { error: "Érvénytelen státusz" },
        { status: 400 }
      );
    }

    const updatedMessage = await prisma.contact.update({
      where: {
        id: params.id,
      },
      data: {
        status: status as ContactStatus,
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Hiba történt az üzenet módosítása során" },
      { status: 500 }
    );
  }
}

// DELETE - Üzenet törlése
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contact.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Hiba történt az üzenet törlése során" },
      { status: 500 }
    );
  }
}
