import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  const pets = await prisma.pet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Pets</h1>
        <Link href="/dashboard/pets/new" className="btn">
          Add Pet
        </Link>
      </div>

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
            <div className="mt-3">
              <Link
                href={`/dashboard/pets/${p.id}`}
                className="text-sm text-primary"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
