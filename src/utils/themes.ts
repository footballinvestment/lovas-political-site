import { PrismaClient, Theme, ThemeType } from "@prisma/client";

const prisma = new PrismaClient();

export async function getActiveTheme(type: ThemeType): Promise<Theme | null> {
  try {
    const theme = await prisma.theme.findFirst({
      where: {
        type,
        isActive: true,
      },
    });
    return theme;
  } catch (error) {
    console.error(`Error fetching active ${type} theme:`, error);
    return null;
  }
}

export async function getActiveThemeByCategory(
  category: string
): Promise<Theme | null> {
  try {
    const theme = await prisma.theme.findFirst({
      where: {
        type: "CATEGORY",
        category,
        isActive: true,
      },
    });
    return theme;
  } catch (error) {
    console.error(`Error fetching theme for category ${category}:`, error);
    return null;
  }
}

export function getGradientStyle(theme: Theme | null) {
  if (!theme) return {};

  return {
    background: `linear-gradient(to right, ${theme.fromColor}, ${theme.toColor})`,
    color: theme.textColor,
  };
}

// Helper a témák közötti váltáshoz
export async function activateTheme(themeId: string): Promise<boolean> {
  try {
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) return false;

    // Ha nem kategória téma, deaktiváljuk az ugyanolyan típusú témákat
    if (theme.type !== "CATEGORY") {
      await prisma.theme.updateMany({
        where: {
          type: theme.type,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Aktiváljuk a kiválasztott témát
    await prisma.theme.update({
      where: { id: themeId },
      data: { isActive: true },
    });

    return true;
  } catch (error) {
    console.error("Error activating theme:", error);
    return false;
  }
}
