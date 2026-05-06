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
    title: "Sign-in is temporarily unavailable",
    description:
      "Authentication is currently misconfigured. Please try again in a few minutes or contact support if this persists.",
  },
  AccessDenied: {
    title: "Access denied",
    description:
      "Your account does not currently have access to this action. If this is unexpected, contact support.",
  },
  Verification: {
    title: "Verification failed",
    description:
      "The sign-in link is invalid or expired. Request a new sign-in link and try again.",
  },
};

function getErrorDetails(error: string | undefined) {
  if (!error) {
    return {
      key: "Unknown",
      title: "Sign-in failed",
      description: "We could not complete sign-in. Please try again.",
    };
  }

  const known = errorCopy[error as AuthErrorKey];
  if (known) {
    return { key: error, ...known };
  }

  return {
    key: error,
    title: "Sign-in failed",
    description: "We could not complete sign-in. Please try again.",
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
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle>{details.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{details.description}</p>
          <p className="text-xs text-muted-foreground">Error code: {details.key}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/auth/signin">Try sign-in again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
