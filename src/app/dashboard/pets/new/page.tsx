import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { PetProfileForm } from "@/components/dashboard/pet-profile-form";

export default function NewPetPage() {
  return (
    <div className="luxury-shell space-y-6 rounded-2xl border border-border/60 bg-card/70 p-4 md:p-6">
      <DashboardPageHeader
        eyebrow="Pet Profiles"
        title="Add a Pet"
        description="Create a complete pet profile so bookings, records, and care updates stay accurate."
      />
      <PetProfileForm mode="create" />
    </div>
  );
}
