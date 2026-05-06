import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { EditPetForm } from "./EditPetForm";

type Props = { params: { id: string } };

export default async function EditPetPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  if (!isDatabaseConfigured()) redirect("/dashboard/pets");

  const pet = await prisma.pet.findUnique({ where: { id: params.id } });
  if (!pet || pet.userId !== session.user.id) redirect("/dashboard/pets");

  return <EditPetForm pet={pet} />;
}
