import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Messages | Dashboard",
  description: "View and manage your booking messages",
};

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/auth/signin");
  }

  return redirect("/dashboard/updates");
}
