// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nincs feltöltött fájl" },
        { status: 400 }
      );
    }

    // Fájl típus ellenőrzése
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Csak képfájlok tölthetők fel" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueId = uuidv4();
    const extension = path.extname(file.name);
    const filename = uniqueId + extension;

    // Mappa létrehozása, ha nem létezik
    const uploadDir = path.join(process.cwd(), "public/uploads");
    try {
      await writeFile(path.join(uploadDir, filename), buffer);
    } catch (e) {
      console.error("Hiba a fájl mentésekor:", e);
      return NextResponse.json(
        { error: "Hiba történt a fájl mentése során" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: `/uploads/${filename}`,
      message: "Fájl sikeresen feltöltve",
    });
  } catch (e) {
    console.error("Hiba a feltöltés során:", e);
    return NextResponse.json(
      { error: "Hiba történt a feltöltés során" },
      { status: 500 }
    );
  }
}
