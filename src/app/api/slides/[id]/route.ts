export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    console.log("Updating slide:", { id: params.id, data: json });

    // Ha sorrend módosítás történik
    if (json.order !== undefined) {
      const currentSlide = await prisma.slide.findUnique({
        where: { id: params.id },
      });

      if (!currentSlide) {
        return NextResponse.json({ error: "Slide not found" }, { status: 404 });
      }

      console.log("Current slide:", currentSlide);
      console.log("New order:", json.order);

      // Többi slide átrendezése
      if (json.order > currentSlide.order) {
        // Lefelé mozgatás
        await prisma.slide.updateMany({
          where: {
            AND: [
              { order: { gt: currentSlide.order } },
              { order: { lte: json.order } },
              { id: { not: params.id } },
            ],
          },
          data: { order: { decrement: 1 } },
        });
      } else {
        // Felfelé mozgatás
        await prisma.slide.updateMany({
          where: {
            AND: [
              { order: { gte: json.order } },
              { order: { lt: currentSlide.order } },
              { id: { not: params.id } },
            ],
          },
          data: { order: { increment: 1 } },
        });
      }

      // Aktuális slide frissítése
      const updatedSlide = await prisma.slide.update({
        where: { id: params.id },
        data: { order: json.order },
      });

      return NextResponse.json(updatedSlide);
    }

    // Ha nem sorrend módosítás, akkor egyszerű update
    const updatedSlide = await prisma.slide.update({
      where: { id: params.id },
      data: json,
    });

    return NextResponse.json(updatedSlide);
  } catch (error) {
    console.error("Error in PUT /api/slides/[id]:", error);
    return NextResponse.json(
      {
        error: "Error updating slide",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
