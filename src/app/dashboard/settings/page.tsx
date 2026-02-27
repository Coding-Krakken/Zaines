import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  // Fetch user profile if DB configured
  const user = isDatabaseConfigured()
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mt-4 p-4 border rounded">
        <h2 className="font-medium">Profile</h2>
        <p className="mt-2">Name: {user?.name || session.user.name}</p>
        <p>Email: {user?.email || session.user.email}</p>
        <p>Phone: {user?.phone || "Not provided"}</p>
      </div>
    </div>
  );
}
