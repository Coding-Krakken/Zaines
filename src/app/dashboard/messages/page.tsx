import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Messages | Dashboard",
  description: "View and manage your booking messages",
};

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/auth/signin");
  }

  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Database is not configured. Messages are unavailable in this
          environment.
        </p>
      </div>
    );
  }

  // TODO: Fetch messages for the user
  // const messages = await prisma.message.findMany({
  //   where: { userId: session.user.id },
  //   orderBy: { createdAt: 'desc' },
  // });

  // For now, show empty state with call to action
  // In production, this would display actual messages

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with the boarding facility about your bookings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Booking Updates
            </CardTitle>
            <CardDescription>
              Messages from the boarding facility about your reservations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No messages yet. New messages from the boarding facility will appear here.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/bookings">View Bookings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send a Message
            </CardTitle>
            <CardDescription>
              Contact the facility with questions or special requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Have a question? Use the contact form to reach out.
            </p>
            <Button asChild className="w-full">
              <Link href="/contact">Contact Facility</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
