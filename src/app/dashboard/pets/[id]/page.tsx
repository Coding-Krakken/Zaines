import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { DashboardUnavailableState } from "@/components/dashboard/dashboard-states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthTimeline } from "@/components/HealthTimeline";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
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
      <DashboardUnavailableState
        title="Pet profile unavailable"
        description="Database is not configured in this environment."
      />
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
      <DashboardUnavailableState
        title="Pet profile unavailable"
        description="Pet not found or access denied."
      />
    );
  }

  return (
    <div className="luxury-shell space-y-6 rounded-2xl border border-border/60 bg-card/70 p-4 md:p-6">
      <DashboardPageHeader
        eyebrow="Pet Profile"
        title={pet.name}
        description="Review health information, records, and timeline updates for this pet."
        actions={(
          <Link
            href={`/dashboard/pets/${pet.id}/edit`}
            className="focus-ring rounded-md px-2 py-1 text-sm text-primary"
          >
            Edit Profile
          </Link>
        )}
      />

      {healthDataCompatibilityMode && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-amber-800">
            Health history is temporarily unavailable in compatibility mode. Run database migrations
            to restore vaccine and medication records.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="luxury-card border-border/60 bg-background/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Breed: {pet.breed || "Unknown"}</p>
            <p>Age: {pet.age}</p>
            <p>Weight: {pet.weight || "N/A"}</p>
            <p>Gender: {pet.gender}</p>
            {pet.specialNeeds ? (
              <p className="pt-1">
                <span className="font-medium">Special Needs:</span> {pet.specialNeeds}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="luxury-card border-border/60 bg-background/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Health Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-sm font-medium">Vaccines</h3>
              <ul className="list-disc pl-5 text-sm">
              {pet.vaccines.map(
                (v: { id: string; name: string; expiryDate: Date }) => (
                  <li key={v.id}>
                    {v.name} — expires{" "}
                    {new Date(v.expiryDate).toLocaleDateString()}
                  </li>
                ),
              )}
              {pet.vaccines.length === 0 && (
                <li className="list-none rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-muted-foreground">
                  No vaccine records on file.
                </li>
              )}
              </ul>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-medium">Medications</h3>
              <ul className="list-disc pl-5 text-sm">
              {pet.medications.map(
                (m: { id: string; name: string; dosage: string }) => (
                  <li key={m.id}>
                    {m.name} — {m.dosage}
                  </li>
                ),
              )}
              {pet.medications.length === 0 && (
                <li className="list-none rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-muted-foreground">
                  No medications on file.
                </li>
              )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
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
      <div>
        <HealthTimeline petId={pet.id} />
      </div>
    </div>
  );
}
