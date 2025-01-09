const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

type OldProgram = {
  id: string;
  title: string;
  category: string;
  description: string;
  details: string;
  priority: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type OldTheme = {
  id: string;
  name: string;
  description: string | null;
  fromColor: string;
  toColor: string;
  textColor: string;
  isPreset: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function importBackupData(): Promise<{
  programs: OldProgram[];
  themes: OldTheme[];
}> {
  try {
    // Beolvassuk a backup fájlt
    const backupContent = fs.readFileSync("backup_tables.sql", "utf-8");

    // Program adatok kinyerése
    const programsMatch = backupContent.match(
      /INSERT INTO `Program` VALUES(.*?);/
    )[1];
    const programValues: OldProgram[] = programsMatch
      .trim()
      .slice(1, -1) // Remove outer parentheses
      .split("),(")
      .map((row: string) => {
        // Split by comma but respect values in quotes
        const values =
          row
            .match(/'([^']*)'|([^,]+)/g)
            ?.map((v: string) => v.replace(/^'|'$/g, "").trim()) || [];

        return {
          id: values[0],
          title: values[1],
          category: values[2],
          description: values[3],
          details: values[4],
          priority: parseInt(values[5]),
          status: values[6],
          createdAt: new Date(values[7]),
          updatedAt: new Date(values[8]),
        };
      });

    // SavedTheme adatok kinyerése
    const themesMatch = backupContent.match(
      /INSERT INTO `SavedTheme` VALUES(.*?);/
    )[1];
    const themeValues: OldTheme[] = themesMatch
      .trim()
      .slice(1, -1) // Remove outer parentheses
      .split("),(")
      .map((row: string) => {
        // Split by comma but respect values in quotes
        const values =
          row
            .match(/'([^']*)'|([^,]+)/g)
            ?.map((v: string) => v.replace(/^'|'$/g, "").trim()) || [];

        return {
          id: values[0],
          name: values[1],
          description: values[2] === "NULL" ? null : values[2],
          fromColor: values[3],
          toColor: values[4],
          textColor: values[5],
          isPreset: values[6] === "1",
          createdAt: new Date(values[7]),
          updatedAt: new Date(values[8]),
        };
      });

    return {
      programs: programValues,
      themes: themeValues.filter(
        (theme: OldTheme, index: number, self: OldTheme[]) =>
          // Szűrjük a duplikált témákat a name alapján
          index === self.findIndex((t: OldTheme) => t.name === theme.name)
      ),
    };
  } catch (error) {
    console.error("Error reading backup file:", error);
    throw error;
  }
}

async function migrateToSlides() {
  const logFile = fs.createWriteStream("migration_log.txt", { flags: "a" });
  const logMessage = (msg: string) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${msg}\n`;
    console.log(logLine);
    logFile.write(logLine);
  };

  try {
    logMessage("Starting migration...");

    // Először töröljük a régi slide-okat
    await prisma.slide.deleteMany({});
    logMessage("Deleted existing slides");

    // Backup adatok importálása
    const { programs, themes } = await importBackupData();
    logMessage(
      `Found ${programs.length} programs and ${themes.length} themes to migrate`
    );

    // Programok átalakítása slide-okká
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      // Válasszunk egy megfelelő témát a program kategóriája alapján
      const theme =
        themes.find((t) =>
          t.name.toLowerCase().includes(program.category.toLowerCase())
        ) || themes[Math.floor(Math.random() * themes.length)];

      const slide = await prisma.slide.create({
        data: {
          type: "GRADIENT",
          title: program.title,
          subtitle: program.description,
          order: i + 1, // 0 lesz a fő slide
          isActive: true,
          gradientFrom: theme.fromColor,
          gradientTo: theme.toColor,
          ctaText: "Program részletei",
          ctaLink: `/program#${program.category
            .toLowerCase()
            .replace(" ", "-")}`,
        },
      });
      logMessage(
        `Created slide for program: ${program.title} with colors: ${theme.fromColor} -> ${theme.toColor}`
      );
    }

    // Fő slide létrehozása
    const mainTheme =
      themes.find((t) => t.name === "Kék-Zöld Modern") || themes[0];
    const mainSlide = await prisma.slide.create({
      data: {
        type: "GRADIENT",
        title: "Építsük együtt a jövő Magyarországát",
        subtitle:
          "Modern megoldások, átlátható kormányzás, fenntartható fejlődés",
        order: 0,
        isActive: true,
        gradientFrom: mainTheme.fromColor,
        gradientTo: mainTheme.toColor,
        ctaText: "Programom megismerése",
        ctaLink: "/program",
      },
    });
    logMessage(
      `Created main slide with colors: ${mainTheme.fromColor} -> ${mainTheme.toColor}`
    );

    logMessage("Migration completed successfully");
  } catch (error) {
    logMessage(`Error during migration: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
    logFile.end();
  }
}

migrateToSlides().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
