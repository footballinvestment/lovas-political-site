import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Összes üzenet lekérése
export async function GET() {
  try {
    const messages = await prisma.contact.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Hiba történt az üzenetek betöltése során" },
      { status: 500 }
    );
  }
}

// POST - Új üzenet létrehozása (ez a contact form által használt végpont)
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const message = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        district: data.district || null,
        preferredContact: data.preferredContact || "email",
        newsletter: data.newsletter || false,
        status: "NEW",
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Hiba történt az üzenet mentése során" },
      { status: 500 }
    );
  }
}
