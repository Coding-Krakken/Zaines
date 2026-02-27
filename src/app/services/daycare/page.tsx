import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Service Update | Zaine's Stay & Play",
  description:
    "Zaine's Stay & Play currently offers private boarding with suite options and approved add-ons.",
};

export default function DaycarePage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center px-4 py-16">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Service Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            We currently operate as a private, small-capacity boarding service.
            Standalone daycare is not offered at this time.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/suites">View Suite Options</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/book">Book Boarding</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
