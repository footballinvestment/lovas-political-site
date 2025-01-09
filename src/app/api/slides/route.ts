import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
      { error: "Error fetching slides" },
      { status: 500 }
    );
  }
}

// POST /api/slides - Új slide létrehozása
export async function POST(request: Request) {
  try {
    // const session = await auth()
    // console.log('Session:', session)

    // Ideiglenes: auth bypass fejlesztéshez
    /*if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }*/

    const json = await request.json();
    console.log("Creating new slide with data:", json);

    // Get max order
    const maxOrder = await prisma.slide.findFirst({
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });
    console.log("Current max order:", maxOrder);

    const slide = await prisma.slide.create({
      data: {
        type: json.type,
        title: json.title,
        subtitle: json.subtitle,
        order: maxOrder ? maxOrder.order + 1 : 0,
        isActive: json.isActive,
        gradientFrom: json.gradientFrom,
        gradientTo: json.gradientTo,
        mediaUrl: json.mediaUrl,
        ctaText: json.ctaText,
        ctaLink: json.ctaLink,
      },
    });

    console.log("Created slide:", slide);
    return NextResponse.json(slide);
  } catch (error) {
    console.error("Error in POST /api/slides:", error);
    return NextResponse.json(
      {
        error: "Error creating slide",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/slides/[id] - Slide módosítása
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // const session = await auth()
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const json = await request.json();
    console.log("Updating slide with data:", json);

    // Ha van order változás, rendezzük át a többi slide-ot is
    if (typeof json.order === "number") {
      const currentSlide = await prisma.slide.findUnique({
        where: { id: params.id },
      });

      if (currentSlide && currentSlide.order !== json.order) {
        // Többi slide átrendezése
        if (json.order > currentSlide.order) {
          // Lefelé mozgatás
          await prisma.slide.updateMany({
            where: {
              order: {
                gt: currentSlide.order,
                lte: json.order,
              },
            },
            data: {
              order: {
                decrement: 1,
              },
            },
          });
        } else {
          // Felfelé mozgatás
          await prisma.slide.updateMany({
            where: {
              order: {
                gte: json.order,
                lt: currentSlide.order,
              },
            },
            data: {
              order: {
                increment: 1,
              },
            },
          });
        }
      }
    }

    const updatedSlide = await prisma.slide.update({
      where: {
        id: params.id,
      },
      data: json,
    });

    console.log("Updated slide:", updatedSlide);
    return NextResponse.json(updatedSlide);
  } catch (error) {
    console.error("Error in PUT /api/slides:", error);
    return NextResponse.json(
      {
        error: "Error updating slide",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/slides/[id] - Slide törlése
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // const session = await auth()
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const slide = await prisma.slide.delete({
      where: {
        id: params.id,
      },
    });

    // Átrendezzük a többi slide order értékét
    await prisma.slide.updateMany({
      where: {
        order: {
          gt: slide.order,
        },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/slides:", error);
    return NextResponse.json(
      { error: "Error deleting slide" },
      { status: 500 }
    );
  }
}
