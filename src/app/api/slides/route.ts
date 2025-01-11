import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SlideType } from "@prisma/client";
import {
  validateSlideData,
  prepareVideoData,
} from "@/utils/validators/slideValidators";

// GET /api/slides - Összes slide lekérése
export async function GET() {
  try {
    const slides = await prisma.slide.findMany({
      orderBy: {
        order: "asc",
      },
    });
    return NextResponse.json(slides);
  } catch (error) {
    console.error("Error in GET /api/slides:", error);
    return NextResponse.json(
      { error: "Hiba a slide-ok lekérése során" },
      { status: 500 }
    );
  }
}

// POST /api/slides - Új slide létrehozása
export async function POST(request: Request) {
  try {
    const json = await request.json();
    console.log("Creating new slide with data:", json);

    // Slide típus ellenőrzése
    if (!Object.values(SlideType).includes(json.type)) {
      return NextResponse.json(
        { error: "Érvénytelen slide típus" },
        { status: 400 }
      );
    }

    // Slide adatok validálása
    try {
      validateSlideData(json);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Validációs hiba" },
        { status: 400 }
      );
    }

    // Get max order
    const maxOrder = await prisma.slide.findFirst({
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    // Slide adatok előkészítése a megfelelő típusokkal
    const slideData = {
      ...prepareVideoData(json),
      order: maxOrder ? maxOrder.order + 1 : 0,
    };

    const slide = await prisma.slide.create({
      data: slideData,
    });

    console.log("Created slide:", slide);
    return NextResponse.json(slide);
  } catch (error) {
    console.error("Error in POST /api/slides:", error);
    return NextResponse.json(
      {
        error: "Hiba a slide létrehozása során",
        details: error instanceof Error ? error.message : "Ismeretlen hiba",
      },
      { status: 500 }
    );
  }
}
