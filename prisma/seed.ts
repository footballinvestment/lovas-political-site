import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Létrehozunk egy minta bejegyzést
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
