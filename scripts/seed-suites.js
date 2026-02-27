import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  const suites = [
    {
      id: "suite-standard-1",
      name: "Standard Suite 1",
      tier: "standard",
      pricePerNight: 65,
      isActive: true,
    },
    {
      id: "suite-standard-2",
      name: "Standard Suite 2",
      tier: "standard",
      pricePerNight: 65,
      isActive: true,
    },
    {
      id: "suite-deluxe-1",
      name: "Deluxe Suite 1",
      tier: "deluxe",
      pricePerNight: 85,
      isActive: true,
    },
    {
      id: "suite-luxury-1",
      name: "Luxury Suite 1",
      tier: "luxury",
      pricePerNight: 120,
      isActive: true,
    },
  ];

  for (const s of suites) {
    await prisma.suite.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  console.log("Seeded suites");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
