import { NextResponse } from "next/server";

const mockPrograms = [
  {
    id: "1",
    title: "Átlátható kormányzás",
    category: "kormányzás",
    description:
      "Digitális platformok és nyilvános adatbázisok a kormányzati döntések átláthatóságáért.",
    details: "Részletes program...",
    priority: 1,
    status: "folyamatban",
  },
  {
    id: "2",
    title: "Fenntartható fejlődés",
    category: "környezet",
    description:
      "Zöld energia és környezetbarát megoldások a jövő generációiért.",
    details: "Részletes program...",
    priority: 2,
    status: "tervezett",
  },
  {
    id: "3",
    title: "Modern oktatás",
    category: "oktatás",
    description:
      "Digitális készségek és gyakorlati tudás a 21. század kihívásaira.",
    details: "Részletes program...",
    priority: 3,
    status: "folyamatban",
  },
];

export async function GET() {
  return NextResponse.json(mockPrograms);
}
