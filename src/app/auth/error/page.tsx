import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthErrorKey =
  | "Configuration"
  | "AccessDenied"
  | "Verification"
  | "OAuthSignin"
  | "OAuthCallback"
  | "OAuthCreateAccount"
  | "EmailCreateAccount"
  | "Callback"
  | "OAuthAccountNotLinked"
  | "EmailSignin"
  | "CredentialsSignin"
  | "SessionRequired";

const errorCopy: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Oops! Something went ruff 🐕",
    description:
      "Our authentication system is having a moment. Please try again in a few minutes or reach out to our pack for help.",
  },
  AccessDenied: {
    title: "No paws-word access 🚫",
    description:
      "Your account doesn't have permission for this action. If you think this is a mistake, contact our team and we'll help you out.",
  },
  Verification: {
    title: "This link has gone to the doghouse 📧",
    description:
      "Your sign-in link has expired or isn't valid anymore. Request a fresh one and try again — we promise it'll work!",
  },
};

function getErrorDetails(error: string | undefined) {
  if (!error) {
    return {
      key: "Unknown",
      title: "Whoops! Something went wrong 🐾",
      description: "We couldn't complete your sign-in. Let's give it another try!",
    };
  }

  const known = errorCopy[error as AuthErrorKey];
  if (known) {
    return { key: error, ...known };
  }

  return {
    key: error,
    title: "Whoops! Something went wrong 🐾",
    description: "We couldn't complete your sign-in. Let's give it another try!",
  };
}

type AuthErrorPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error;
  const details = getErrorDetails(error);

  return (
    <main className="container mx-auto flex min-h-[60vh] items-center px-4 py-12">
      <Card className="paw-card mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="heading-playful text-2xl">{details.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{details.description}</p>
          <p className="text-xs text-muted-foreground">Error code: {details.key}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="paw-button-primary">
              <Link href="/auth/signin">Try Again 🐾</Link>
            </Button>
            <Button variant="outline" asChild className="paw-button-secondary">
              <Link href="/contact">Contact Our Pack</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
