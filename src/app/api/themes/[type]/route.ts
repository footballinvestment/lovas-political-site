import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type.toUpperCase();
    const themes = await prisma.theme.findMany({
      where: {
        type: type as any,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return NextResponse.json(themes);
  } catch (error) {
    console.error("GET /api/themes/[type] error:", error);
    return NextResponse.json(
      { error: "Hiba történt a témák lekérése közben." },
      { status: 500 }
    );
  }
}
