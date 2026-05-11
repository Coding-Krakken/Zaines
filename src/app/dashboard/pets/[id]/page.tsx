import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HealthTimeline } from "@/components/HealthTimeline";
import Link from "next/link";
import { PetRecordsManager } from "./PetRecordsManager";

type Props = { params: Promise<{ id: string }> };

function isSchemaDriftError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("does not exist") ||
    error.message.includes("P2021") ||
    error.message.includes("P2022")
  );
}

export default async function PetDetail({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  if (!isDatabaseConfigured()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Pet</h1>
        <p className="mt-4 text-muted-foreground">Database not configured.</p>
      </div>
    );
  }

  let pet;
  let healthDataCompatibilityMode = false;
  try {
    pet = await prisma.pet.findUnique({
      where: { id },
      include: { vaccines: true, medications: true },
    });
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }

    healthDataCompatibilityMode = true;
    const fallbackPet = await prisma.pet.findUnique({
      where: { id },
    });

    pet = fallbackPet
      ? {
          ...fallbackPet,
          vaccines: [],
          medications: [],
        }
      : null;
  }

  if (!pet || pet.userId !== session.user.id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Pet</h1>
        <p className="mt-4 text-muted-foreground">
          Pet not found or access denied.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">{pet.name}</h1>
        <Link href={`/dashboard/pets/${pet.id}/edit`} className="text-sm text-primary">
          Edit Profile
        </Link>
      </div>

      {healthDataCompatibilityMode && (
        <p className="mb-4 text-sm text-amber-700">
          Health history is temporarily unavailable in compatibility mode. Run database migrations
          to restore vaccine and medication records.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h2 className="font-medium">Profile</h2>
          <p className="text-sm">Breed: {pet.breed || "Unknown"}</p>
          <p className="text-sm">Age: {pet.age}</p>
          <p className="text-sm">Weight: {pet.weight || "N/A"}</p>
          <p className="text-sm">Gender: {pet.gender}</p>
          {pet.specialNeeds && (
            <p className="text-sm mt-2">
              <span className="font-medium">Special Needs:</span> {pet.specialNeeds}
            </p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-medium">Health Summary</h2>
          <div className="mt-2">
            <h3 className="text-sm font-medium">Vaccines</h3>
            <ul className="text-sm list-disc pl-5">
              {pet.vaccines.map(
                (v: { id: string; name: string; expiryDate: Date }) => (
                  <li key={v.id}>
                    {v.name} — expires{" "}
                    {new Date(v.expiryDate).toLocaleDateString()}
                  </li>
                ),
              )}
              {pet.vaccines.length === 0 && <li>No vaccine records</li>}
            </ul>
          </div>
          <div className="mt-3">
            <h3 className="text-sm font-medium">Medications</h3>
            <ul className="text-sm list-disc pl-5">
              {pet.medications.map(
                (m: { id: string; name: string; dosage: string }) => (
                  <li key={m.id}>
                    {m.name} — {m.dosage}
                  </li>
                ),
              )}
              {pet.medications.length === 0 && <li>No medications</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <PetRecordsManager
          petId={pet.id}
          petName={pet.name}
          initialVaccines={pet.vaccines.map((v) => ({
            id: v.id,
            name: v.name,
            administeredDate: v.administeredDate.toISOString(),
            expiryDate: v.expiryDate.toISOString(),
            veterinarian: v.veterinarian ?? null,
            documentUrl: v.documentUrl ?? null,
            notes: v.notes ?? null,
          }))}
        />
      </div>

      {/* Health Timeline for this pet */}
      <div className="mt-6">
        <HealthTimeline petId={pet.id} />
      </div>
    </div>
  );
}
