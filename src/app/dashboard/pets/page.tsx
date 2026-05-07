import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function isSchemaDriftError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("does not exist") ||
    error.message.includes("P2021") ||
    error.message.includes("P2022")
  );
}

export default async function PetsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  if (!isDatabaseConfigured()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">My Pets</h1>
        <p className="mt-4 text-muted-foreground">Database not configured.</p>
      </div>
    );
  }

  let pets;
  let usedFallbackQuery = false;
  try {
    pets = await prisma.pet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }

    usedFallbackQuery = true;
    pets = await prisma.pet.findMany({
      where: { userId: session.user.id },
    });
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Pets</h1>
        <Button asChild>
          <Link href="/dashboard/pets/new">Add Pet</Link>
        </Button>
      </div>

      {usedFallbackQuery && (
        <p className="mt-3 text-sm text-amber-700">
          Pet list loaded in compatibility mode. Run database migrations to
          restore full sorting.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {pets.length === 0 && (
          <p className="text-muted-foreground">No pets yet.</p>
        )}
        {pets.map((p: { id: string; name: string; breed?: string | null }) => (
          <div key={p.id} className="p-4 border rounded">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-muted-foreground">
              {p.breed || "Unknown"}
            </div>
            <div className="mt-3 flex gap-3">
              <Link
                href={`/dashboard/pets/${p.id}`}
                className="text-sm text-primary"
              >
                View
              </Link>
              <Link
                href={`/dashboard/pets/${p.id}/edit`}
                className="text-sm text-primary"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
