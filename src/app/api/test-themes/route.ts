import { NextResponse } from "next/server";
import { getActiveTheme, getActiveThemeByCategory } from "@/utils/themes";

export async function GET() {
  try {
    // Teszteljük az összes téma típust
    const globalTheme = await getActiveTheme("GLOBAL");
    const programTheme = await getActiveTheme("PROGRAM");
    const environmentTheme = await getActiveThemeByCategory("Környezetvédelem");
    const newsTheme = await getActiveTheme("NEWS");
    const eventsTheme = await getActiveTheme("EVENTS");

    return NextResponse.json({
      global: globalTheme,
      program: programTheme,
      environmentCategory: environmentTheme,
      news: newsTheme,
      events: eventsTheme,
    });
  } catch (error) {
    console.error("Theme test error:", error);
    return NextResponse.json(
      { error: "Hiba történt a témák tesztelése közben." },
      { status: 500 }
    );
  }
}
