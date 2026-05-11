import { PrismaClient } from "@prisma/client";

type BookingWaiverRow = {
  userId: string;
  type: string;
  content: string;
  signature: string;
  signedAt: Date;
  ipAddress: string;
  userAgent: string | null;
  bookingId: string;
};

const prisma = new PrismaClient();

function isSupportedWaiverType(type: string): type is "liability" | "medical" | "photo_release" {
  return type === "liability" || type === "medical" || type === "photo_release";
}

function getExpiryDate(type: string, signedAt: Date): Date | null {
  if (type === "photo_release") {
    return null;
  }

  return new Date(signedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
}

async function main() {
  const legacyWaivers = await prisma.waiver.findMany({
    orderBy: [
      { signedAt: "desc" },
      { id: "asc" },
    ],
    include: {
      booking: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  const latestWaiverByUserAndType = new Map<string, BookingWaiverRow>();

  for (const waiver of legacyWaivers) {
    if (!isSupportedWaiverType(waiver.type)) {
      continue;
    }

    const key = `${waiver.booking.userId}:${waiver.type}`;
    if (latestWaiverByUserAndType.has(key)) {
      continue;
    }

    latestWaiverByUserAndType.set(key, {
      userId: waiver.booking.userId,
      type: waiver.type,
      content: waiver.content,
      signature: waiver.signature,
      signedAt: waiver.signedAt,
      ipAddress: waiver.ipAddress,
      userAgent: waiver.userAgent,
      bookingId: waiver.bookingId,
    });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const waiver of latestWaiverByUserAndType.values()) {
    const existing = await prisma.accountWaiver.findUnique({
      where: {
        userId_type: {
          userId: waiver.userId,
          type: waiver.type as "liability" | "medical" | "photo_release",
        },
      },
    });

    const expiresAt = getExpiryDate(waiver.type, waiver.signedAt);

    if (!existing) {
      await prisma.accountWaiver.create({
        data: {
          userId: waiver.userId,
          type: waiver.type as "liability" | "medical" | "photo_release",
          content: waiver.content,
          signature: waiver.signature,
          signedAt: waiver.signedAt,
          expiresAt,
          ipAddress: waiver.ipAddress,
          userAgent: waiver.userAgent,
        },
      });
      created += 1;
      continue;
    }

    const shouldUpdate =
      existing.signedAt.getTime() < waiver.signedAt.getTime() ||
      existing.content !== waiver.content ||
      existing.signature !== waiver.signature;

    if (shouldUpdate) {
      await prisma.accountWaiver.update({
        where: { id: existing.id },
        data: {
          content: waiver.content,
          signature: waiver.signature,
          signedAt: waiver.signedAt,
          expiresAt,
          ipAddress: waiver.ipAddress,
          userAgent: waiver.userAgent,
        },
      });
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  console.log(
    JSON.stringify(
      {
        processed: latestWaiverByUserAndType.size,
        created,
        updated,
        skipped,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });