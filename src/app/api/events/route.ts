// src/app/api/events/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: "desc",
      },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Hiba történt az események lekérése közben." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        status: body.status || "UPCOMING",
        imageUrl: body.imageUrl,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: "Hiba történt az esemény létrehozása közben." },
      { status: 500 }
    );
  }
}
