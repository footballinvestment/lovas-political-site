import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const mockEvents = [
  {
    id: "1",
    title: "Lakossági fórum - Környezetvédelem",
    description:
      "Beszélgetés a zöld energia programról és a városi környezetvédelmi kezdeményezésekről",
    location: "XIII. kerületi Közösségi Ház",
    startDate: "2024-02-10T18:00:00Z",
    endDate: "2024-02-10T20:00:00Z",
    status: "UPCOMING",
    imageUrl: null,
  },
  {
    id: "2",
    title: "Közösségi kertészkedés",
    description: "A kerületi közösségi kert fejlesztése és gondozása",
    location: "XIII. kerületi Közösségi Kert",
    startDate: "2024-02-15T10:00:00Z",
    endDate: "2024-02-15T14:00:00Z",
    status: "UPCOMING",
    imageUrl: null,
  },
  {
    id: "3",
    title: "Oktatási kerekasztal",
    description:
      "Beszélgetés a digitális oktatás fejlesztéséről és a modern oktatási eszközökről",
    location: "XIII. kerületi Művelődési Központ",
    startDate: "2024-02-20T17:00:00Z",
    endDate: "2024-02-20T19:00:00Z",
    status: "UPCOMING",
    imageUrl: null,
  },
];

export async function GET() {
  try {
    // Ideiglenesen a mock adatokat küldjük vissza
    return NextResponse.json(mockEvents);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Hiba történt az események lekérése közben." },
      { status: 500 }
    );
  }
}
