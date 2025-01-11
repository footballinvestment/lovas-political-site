// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Konstansok
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

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

    // Fájlméret ellenőrzése
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "A fájl mérete nem lehet nagyobb 100MB-nál" },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    // Fájltípus ellenőrzése
    if (isVideo && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Nem támogatott videó formátum. Használj MP4 vagy WebM formátumot.",
        },
        { status: 400 }
      );
    }

    if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Nem támogatott kép formátum. Használj JPEG, PNG, GIF vagy WebP formátumot.",
        },
        { status: 400 }
      );
    }

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: "Csak kép vagy videó fájlok tölthetők fel" },
        { status: 400 }
      );
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = path.extname(file.name);
      const filename = uuidv4() + extension;
      const uploadDir = path.join(process.cwd(), "public/uploads");

      // Mappa létrehozása, ha nem létezik
      try {
        await access(uploadDir, constants.F_OK);
      } catch {
        await mkdir(uploadDir, { recursive: true });
      }

      await writeFile(path.join(uploadDir, filename), buffer);

      return NextResponse.json({
        url: `/uploads/${filename}`,
        type: isVideo ? "video" : "image",
        message: `${isVideo ? "Videó" : "Kép"} sikeresen feltöltve`,
      });
    } catch (error) {
      console.error("Hiba a fájl mentése során:", error);
      return NextResponse.json(
        { error: "Hiba történt a fájl mentése során" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Általános hiba a feltöltés során:", error);
    return NextResponse.json(
      { error: "Hiba történt a feltöltés során" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
