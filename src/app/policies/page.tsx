/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, FileText } from "lucide-react";
import {
  CANCELLATION_POLICY_COPY,
  SAFETY_STANDARDS_COPY,
} from "@/config/trust-copy";
import { getAdminSettings } from "@/lib/api/admin-settings";

export const metadata: Metadata = {
  title: "Policies | Zaine's Stay & Play",
  description:
    "Read about our private boarding policies, cancellation policy, health requirements, and service terms.",
};

export default async function PoliciesPage() {
  const settings = await getAdminSettings();
  const cancellationSettings = settings.cancellationPolicySettings;
  const fullRefundLabel = `${cancellationSettings.fullRefundHours}+ Hours Notice`;
  const partialRefundLabel = `${cancellationSettings.partialRefundHours}-${cancellationSettings.fullRefundHours} Hours Notice`;
  const noRefundLabel = `Less than ${cancellationSettings.partialRefundHours} Hours`;
  const fullRefundText = `${cancellationSettings.fullRefundHours}+ hours before check-in: full refund.`;
  const partialRefundText = `${cancellationSettings.partialRefundHours}-${cancellationSettings.fullRefundHours} hours before check-in: ${cancellationSettings.partialRefundPercent}% refund.`;
  const noRefundText = `Less than ${cancellationSettings.partialRefundHours} hours before check-in: no refund.`;
  const noShowText =
    cancellationSettings.noShowRefundPercent > 0
      ? `No-show: ${cancellationSettings.noShowRefundPercent}% refund.`
      : CANCELLATION_POLICY_COPY.noShow;
  const cancellationProcessingText =
    settings.trustCopySettings.cancellationProcessing ||
    CANCELLATION_POLICY_COPY.processing;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-50 to-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Terms & Policies</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Our Policies
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Clear, transparent policies to ensure the safety and happiness of
              all our guests
            </p>
            <p className="mb-4 text-sm text-muted-foreground md:text-base">
              {settings.trustCopySettings.trustEvidenceClaim}
            </p>
            <p className="mb-4 text-sm text-muted-foreground md:text-base">
              {settings.trustCopySettings.pricingDisclosure}
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: February 6, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Vaccination Requirements */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-700" />
                  <CardTitle>Vaccination Requirements</CardTitle>
                </div>
                <CardDescription>
                  Required for all guests to ensure a healthy environment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="mb-2 font-semibold">Required Vaccinations</h2>
                  <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                    {SAFETY_STANDARDS_COPY.requiredVaccines.map((vaccine) => (
                      <li key={vaccine}>{vaccine}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Strongly Recommended</h3>
                  <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                    <li>Canine Influenza (H3N2 and H3N8)</li>
                    <li>Leptospirosis</li>
                  </ul>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {SAFETY_STANDARDS_COPY.vaccineRecordTiming} Vaccinations
                    must be administered at least 2 weeks prior to check-in to
                    be effective.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Health Requirements */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <CardTitle>Health & Safety Requirements</CardTitle>
                </div>
                <CardDescription>
                  Ensuring the wellbeing of all our guests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Health Standards</h3>
                  <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                    <li>
                      All dogs must be in good health and free from contagious
                      illnesses
                    </li>
                    <li>
                      Dogs showing signs of illness will not be admitted and may
                      be sent home
                    </li>
                    <li>
                      Current flea/tick prevention is required for all guests
                    </li>
                    <li>
                      Dogs must be at least 4 months old and fully vaccinated
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Spay/Neuter Policy</h3>
                  <p className="text-muted-foreground">
                    Dogs over 7 months of age should be spayed or neutered
                    unless your veterinarian has advised otherwise. This helps
                    maintain a calm, safe boarding environment.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Supervision Protocols
                  </h3>
                  <p className="text-muted-foreground">
                    {SAFETY_STANDARDS_COPY.supervisionProtocol}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">What We Check For</h3>
                  <p className="text-muted-foreground">
                    Upon arrival, our staff conducts a visual health assessment
                    checking for signs of illness, injury, or parasites. We
                    reserve the right to refuse service if we observe any health
                    concerns.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-orange-600" />
                  <CardTitle>Cancellation & Refund Policy</CardTitle>
                </div>
                <CardDescription>
                  Plan changes happen - here&apos;s what you need to know
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                    <h3 className="mb-2 font-semibold text-green-900">
                      {fullRefundLabel}
                    </h3>
                    <p className="text-sm text-green-800">
                      {fullRefundText}
                    </p>
                  </div>
                  <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                    <h3 className="mb-2 font-semibold text-orange-900">
                      {partialRefundLabel}
                    </h3>
                    <p className="text-sm text-orange-800">
                      {partialRefundText}
                    </p>
                  </div>
                  <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                    <h3 className="mb-2 font-semibold text-red-900">
                      {noRefundLabel}
                    </h3>
                    <p className="text-sm text-red-800">
                      {noRefundText}
                    </p>
                  </div>
                  <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-semibold text-gray-900">
                      No-Show
                    </h3>
                    <p className="text-sm text-gray-800">
                      {noShowText}
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    {cancellationProcessingText}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Behavioral Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Behavioral Policy</CardTitle>
                <CardDescription>
                  Safety first for all guests and staff
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Temperament Evaluation</h3>
                  <p className="text-muted-foreground">
                    First-time boarding guests may undergo a temperament review
                    to ensure safe handling and suitable care routines during
                    their stay.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Aggressive Behavior</h3>
                  <p className="text-muted-foreground">
                    We have a zero-tolerance policy for aggressive behavior
                    toward people. Dogs displaying aggression toward other dogs
                    will be managed with individual play and separate
                    accommodations, when possible.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Right to Refuse Service
                  </h3>
                  <p className="text-muted-foreground">
                    We reserve the right to refuse service or discharge any dog
                    whose behavior poses a risk to staff, other guests, or
                    facility. In such cases, owners will be contacted for
                    immediate pickup and refunded for unused services.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Policy</CardTitle>
                <CardDescription>
                  Transparent pricing and payment terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Payment Schedule</h3>
                  <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                    <li>Boarding: Full payment due at booking</li>
                    <li>Add-ons: Payment due at booking confirmation</li>
                    <li>
                      Late changes: Additional charges confirmed before
                      processing
                    </li>
                    <li>
                      Clear subtotal, applicable tax, selected care items, and
                      total shown before confirmation
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Accepted Payment Methods
                  </h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards (Visa, Mastercard, Amex,
                    Discover), debit cards, and digital wallets (Apple Pay,
                    Google Pay). Cash and checks are not accepted.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Additional Charges (Always Disclosed)
                  </h3>
                  <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                    <li>Late pickup (after 8 PM): $25 per 30 minutes</li>
                    <li>Early drop-off (before 6 AM): $15 per occurrence</li>
                    <li>Holiday surcharge: 20% on major holidays</li>
                    <li>Medication administration: Complimentary</li>
                    <li>
                      Emergency vet visits: Owner responsible for all charges
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Liability & Emergency Care */}
            <Card>
              <CardHeader>
                <CardTitle>Liability & Emergency Care</CardTitle>
                <CardDescription>
                  Your pet&apos;s safety is our top priority
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">
                    Emergency Veterinary Care
                  </h3>
                  <p className="text-muted-foreground">
                    {SAFETY_STANDARDS_COPY.emergencyProtocol} All emergency
                    veterinary costs are the owner&apos;s responsibility.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Liability</h3>
                  <p className="text-muted-foreground">
                    While we follow safety standards and provide supervised
                    care, dogs can occasionally sustain minor injuries such as
                    scratches or scrapes. We will notify you of observed
                    injuries and provide necessary care. Zaine's Stay & Play is
                    not liable for injuries resulting from normal dog behavior.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Lost or Damaged Property
                  </h3>
                  <p className="text-muted-foreground">
                    We are not responsible for lost or damaged personal
                    belongings including collars, leashes, bedding, or toys. We
                    recommend leaving valuable items at home.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* What to Bring */}
            <Card>
              <CardHeader>
                <CardTitle>What to Bring</CardTitle>
                <CardDescription>
                  Checklist for your pet&apos;s stay
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="mb-2 font-semibold text-green-700">
                    Please Bring:
                  </h3>
                  <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                    <li>Enough food for entire stay (plus 1-2 extra days)</li>
                    <li>
                      Any medications in original packaging with clear
                      instructions
                    </li>
                    <li>Vaccination records (first visit only)</li>
                    <li>Emergency contact information</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-blue-600">
                    Optional Items:
                  </h3>
                  <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                    <li>
                      Favorite toys or blanket (labeled with pet&apos;s name)
                    </li>
                    <li>Special treats for positive reinforcement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Agreement */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-4xl border-primary">
            <CardHeader>
              <CardTitle>Client Agreement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                By booking services with Zaine's Stay & Play, you acknowledge
                that you have read, understood, and agree to all policies
                outlined on this page. You certify that your pet is in good
                health, has no history of aggression, and meets all vaccination
                requirements.
              </p>
              <p className="text-muted-foreground">
                If you have questions about any of our policies, please contact
                us before booking. We&apos;re happy to clarify and ensure
                you&apos;re comfortable with our terms.
              </p>
              <p className="mt-4 text-muted-foreground">
                {settings.trustCopySettings.pricingDisclosure}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Questions About Our Policies?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Our team is here to help clarify any questions you may have
          </p>
          <p className="mb-6 text-sm opacity-90 md:text-base">
            Premium but fair pricing is disclosed before confirmation with no
            hidden fees, no surprise add-ons, or other undisclosed charges.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/faq">View FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
