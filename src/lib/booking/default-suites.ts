import { prisma } from "@/lib/prisma";

type SuiteSeed = {
  id: string;
  name: string;
  tier: string;
  size: string;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  isActive: boolean;
};

type SuiteBootstrapPrisma = {
  suite: {
    count: (args: { where: { isActive: boolean } }) => Promise<number>;
    upsert: (args: {
      where: { id: string };
      update: SuiteSeed;
      create: SuiteSeed;
    }) => Promise<unknown>;
  };
};

export const DEFAULT_SUITES: SuiteSeed[] = [
  {
    id: "suite-standard-1",
    name: "Standard Suite 1",
    tier: "standard",
    size: "medium",
    capacity: 1,
    pricePerNight: 65,
    amenities: ["raised_bed"],
    isActive: true,
  },
  {
    id: "suite-standard-2",
    name: "Standard Suite 2",
    tier: "standard",
    size: "medium",
    capacity: 1,
    pricePerNight: 65,
    amenities: ["raised_bed"],
    isActive: true,
  },
  {
    id: "suite-deluxe-1",
    name: "Deluxe Suite 1",
    tier: "deluxe",
    size: "large",
    capacity: 1,
    pricePerNight: 85,
    amenities: ["webcam", "raised_bed"],
    isActive: true,
  },
  {
    id: "suite-luxury-1",
    name: "Luxury Suite 1",
    tier: "luxury",
    size: "large",
    capacity: 1,
    pricePerNight: 120,
    amenities: ["webcam", "tv", "raised_bed"],
    isActive: true,
  },
];

export async function ensureDefaultSuites(
  prismaClient: SuiteBootstrapPrisma = prisma as unknown as SuiteBootstrapPrisma,
): Promise<number> {
  const activeSuiteCount = await prismaClient.suite.count({
    where: { isActive: true },
  });

  if (activeSuiteCount > 0) {
    return activeSuiteCount;
  }

  await Promise.all(
    DEFAULT_SUITES.map((suite) =>
      prismaClient.suite.upsert({
        where: { id: suite.id },
        update: suite,
        create: suite,
      }),
    ),
  );

  return DEFAULT_SUITES.length;
}