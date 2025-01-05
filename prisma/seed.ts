import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.upsert({
    where: { slug: "elso-bejegyzes" },
    update: {},
    create: {
      title: "Első bejegyzés",
      slug: "elso-bejegyzes",
      content: "Ez az első bejegyzés tartalma.",
      excerpt: "Rövid kivonat az első bejegyzésből",
      status: "PUBLISHED",
    },
  });

  await Promise.all([
    prisma.theme.upsert({
      where: { id: "category-environment" },
      update: {},
      create: {
        id: "category-environment",
        name: "Környezetvédelem kategória",
        description: "Környezetvédelmi programok színvilága",
        fromColor: "#10b981",
        toColor: "#059669",
        textColor: "#FFFFFF",
        type: "CATEGORY",
        category: "Környezetvédelem",
        isActive: true,
      },
    }),
    prisma.theme.upsert({
      where: { id: "category-education" },
      update: {},
      create: {
        id: "category-education",
        name: "Oktatás kategória",
        description: "Oktatási programok színvilága",
        fromColor: "#3b82f6",
        toColor: "#2563eb",
        textColor: "#FFFFFF",
        type: "CATEGORY",
        category: "Oktatás",
        isActive: true,
      },
    }),
    prisma.theme.upsert({
      where: { id: "category-health" },
      update: {},
      create: {
        id: "category-health",
        name: "Egészségügy kategória",
        description: "Egészségügyi programok színvilága",
        fromColor: "#ec4899",
        toColor: "#be185d",
        textColor: "#FFFFFF",
        type: "CATEGORY",
        category: "Egészségügy",
        isActive: true,
      },
    }),
    prisma.theme.upsert({
      where: { id: "category-social" },
      update: {},
      create: {
        id: "category-social",
        name: "Szociális ügyek kategória",
        description: "Szociális programok színvilága",
        fromColor: "#67e8f9",
        toColor: "#06b6d4",
        textColor: "#FFFFFF",
        type: "CATEGORY",
        category: "Szociális ügyek",
        isActive: true,
      },
    }),
  ]);

  await prisma.theme.upsert({
    where: { id: "global-default" },
    update: {},
    create: {
      id: "global-default",
      name: "Alapértelmezett téma",
      description: "Az oldal alapértelmezett színvilága",
      fromColor: "#6DAEF0",
      toColor: "#8DEBD1",
      textColor: "#FFFFFF",
      type: "GLOBAL",
      isActive: true,
    },
  });

  console.log({ post });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
