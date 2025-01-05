import { NextResponse } from "next/server";

const programPoints = [
  {
    id: "1",
    title: "Zöld energia program",
    category: "Környezetvédelem",
    description: "A megújuló energiaforrások támogatása és fejlesztése.",
    details:
      "Célunk a napenergia és szélenergia beruházások támogatása, energia-hatékony megoldások bevezetése a közintézményekben.",
    priority: 1,
    status: "folyamatban",
  },
  {
    id: "2",
    title: "Háztartási napelem program",
    category: "Környezetvédelem",
    description: "Lakossági napelem telepítések támogatása.",
    details:
      "Kedvezményes hitelkonstrukció és állami támogatás napelem rendszerek telepítéséhez.",
    priority: 2,
    status: "tervezett",
  },
  {
    id: "3",
    title: "Energiahatékonysági felújítások",
    category: "Környezetvédelem",
    description: "Lakóépületek energetikai korszerűsítése.",
    details:
      "Nyílászárócsere, szigetelés és fűtéskorszerűsítés támogatása a lakosság számára.",
    priority: 1,
    status: "folyamatban",
  },
  {
    id: "4",
    title: "Digitális oktatás fejlesztése",
    category: "Oktatás",
    description: "Modern oktatási eszközök és módszerek bevezetése.",
    details:
      "Iskolák digitális eszközökkel való felszerelése, tanárok továbbképzése.",
    priority: 2,
    status: "tervezett",
  },
  {
    id: "5",
    title: "Egészségügyi modernizáció",
    category: "Egészségügy",
    description: "Kórházak és rendelők fejlesztése, várólisták csökkentése.",
    details:
      "Modern orvosi eszközök beszerzése, egészségügyi dolgozók béremelése.",
    priority: 1,
    status: "folyamatban",
  },
  {
    id: "6",
    title: "Lakhatási program",
    category: "Szociális ügyek",
    description: "Megfizethető lakhatás biztosítása a fiatalok számára.",
    details: "Első lakás program indítása, bérlakás építési program.",
    priority: 2,
    status: "tervezett",
  },
];

export async function GET() {
  return NextResponse.json(programPoints);
}
