// src/app/api/hirek/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";

const mockHirek = [
  {
    id: "1",
    cim: "Közösségi fejlesztések indulnak",
    tartalom:
      "A következő hónapokban számos közösségi fejlesztési program indul kerületünkben...",
    publikalasDatuma: "2024-03-01",
  },
  {
    id: "2",
    cim: "Környezetvédelmi program",
    tartalom:
      "Új környezetvédelmi program indul a kerületben, melynek célja a zöld területek növelése...",
    publikalasDatuma: "2024-02-28",
  },
  {
    id: "3",
    cim: "Lakossági fórum",
    tartalom:
      "A következő lakossági fórum időpontja március 15. Téma: közlekedésfejlesztés...",
    publikalasDatuma: "2024-02-25",
  },
  {
    id: "4",
    cim: "Oktatási reform",
    tartalom: "Az oktatási intézmények fejlesztésére új programot indítunk...",
    publikalasDatuma: "2024-02-20",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oldal = parseInt(searchParams.get("oldal") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  return NextResponse.json({
    data: mockHirek,
    pagination: {
      totalPages: 1,
      currentPage: oldal,
      totalItems: mockHirek.length,
    },
  });
}
