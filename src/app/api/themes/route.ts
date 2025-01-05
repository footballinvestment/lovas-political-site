import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });
    return NextResponse.json(themes);
  } catch (error) {
    console.error("GET /api/themes error:", error);
    return NextResponse.json(
      { error: "Hiba történt a témák lekérése közben." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ha GLOBAL, PROGRAM, NEWS vagy EVENTS típusú téma és isActive=true,
    // akkor deaktiváljuk az ugyanolyan típusú aktív témákat
    if (body.isActive && body.type !== "CATEGORY") {
      await prisma.theme.updateMany({
        where: {
          type: body.type,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    const theme = await prisma.theme.create({
      data: {
        name: body.name,
        description: body.description,
        fromColor: body.fromColor,
        toColor: body.toColor,
        textColor: body.textColor,
        type: body.type,
        category: body.category,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(theme);
  } catch (error) {
    console.error("POST /api/themes error:", error);
    return NextResponse.json(
      { error: "Hiba történt a téma létrehozása közben." },
      { status: 500 }
    );
  }
}
