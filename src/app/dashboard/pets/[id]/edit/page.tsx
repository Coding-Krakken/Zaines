import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { PetProfileForm } from '@/components/dashboard/pet-profile-form';

type Props = { params: Promise<{ id: string }> };

export default async function EditPetPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  if (!isDatabaseConfigured()) redirect('/dashboard/pets');

  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet || pet.userId !== session.user.id) redirect('/dashboard/pets');

  return (
    <div className="luxury-shell space-y-6 rounded-2xl border border-border/60 bg-card/70 p-4 md:p-6">
      <DashboardPageHeader
        eyebrow="Pet Profiles"
        title={`Edit ${pet.name}`}
        description="Update profile details to keep care instructions and records current."
      />
      <PetProfileForm
        mode="edit"
        petId={pet.id}
        defaults={{
          name: pet.name,
          breed: pet.breed,
          age: pet.age,
          weight: pet.weight,
          gender: pet.gender,
          spayedNeutered: pet.spayedNeutered,
          specialNeeds: pet.specialNeeds ?? '',
          feedingInstructions: pet.feedingInstructions ?? '',
        }}
      />
    </div>
  );
}
