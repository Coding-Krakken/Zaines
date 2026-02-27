import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { redirect } from 'next/navigation';

type Props = { params: { id: string } };

export default async function PetDetail({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return redirect('/auth/signin');

  if (!isDatabaseConfigured()) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Pet</h1>
        <p className="mt-4 text-muted-foreground">Database not configured.</p>
      </div>
    );
  }

  const pet = await prisma.pet.findUnique({ where: { id: params.id }, include: { vaccines: true, medications: true } });

  if (!pet || pet.userId !== session.user.id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Pet</h1>
        <p className="mt-4 text-muted-foreground">Pet not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">{pet.name}</h1>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h2 className="font-medium">Profile</h2>
          <p className="text-sm">Breed: {pet.breed || 'Unknown'}</p>
          <p className="text-sm">Age: {pet.age}</p>
          <p className="text-sm">Weight: {pet.weight || 'N/A'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-medium">Health</h2>
          <div className="mt-2">
            <h3 className="font-medium">Vaccines</h3>
            <ul className="text-sm list-disc pl-5">
              {pet.vaccines.map((v: { id: string; name: string; expiryDate: Date }) => (
                <li key={v.id}>{v.name} — expires {new Date(v.expiryDate).toLocaleDateString()}</li>
              ))}
              {pet.vaccines.length === 0 && <li>No vaccine records</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
