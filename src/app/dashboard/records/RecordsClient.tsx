'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CircleCheckBig } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WaiverReviewDialog } from './WaiverReviewDialog';
import { MedicalRecordsForm } from './MedicalRecordsForm';
import { WAIVER_CONTENT_BY_TYPE } from '@/lib/waiver-content';

type AccountWaiver = {
  id: string;
  type: 'liability' | 'medical' | 'photo_release';
  signedAt: string;
  expiresAt: string | null;
};

type PetRecord = {
  id: string;
  name: string;
  vaccines: Array<{
    id: string;
    name: string;
    expiryDate: string;
    documentUrl: string | null;
  }>;
};

interface RecordsClientProps {
  accountWaivers: AccountWaiver[];
  pets: PetRecord[];
}

function formatWaiverType(type: AccountWaiver['type']): string {
  if (type === 'photo_release') return 'Photo Release';
  if (type === 'medical') return 'Medical Authorization';
  return 'Liability Waiver';
}

export function RecordsClient({ accountWaivers, pets }: RecordsClientProps) {
  const [waivers, setWaivers] = useState(accountWaivers);
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewingWaiverType, setReviewingWaiverType] = useState<
    'liability' | 'medical' | 'photo_release' | null
  >(null);
  const [waiverAcknowledged, setWaiverAcknowledged] = useState<{
    [key in 'liability' | 'medical' | 'photo_release']?: boolean;
  }>({});

  const activeWaivers = useMemo(
    () =>
      waivers.filter(
        (waiver) => !waiver.expiresAt || new Date(waiver.expiresAt) > new Date(),
      ),
    [waivers],
  );

  const waiverHealth = activeWaivers.length === 3;

  const handleReviewWaiver = (type: 'liability' | 'medical' | 'photo_release') => {
    setReviewingWaiverType(type);
    setWaiverAcknowledged((prev) => ({ ...prev, [type]: false }));
  };

  const handleCloseReview = () => {
    setReviewingWaiverType(null);
  };

  const handleAcknowledgeWaiver = () => {
    if (reviewingWaiverType) {
      setWaiverAcknowledged((prev) => ({ ...prev, [reviewingWaiverType]: true }));
    }
  };

  const handleSignWaivers = async () => {
    setError(null);
    setSuccess(null);

    if (signature.trim().length < 5) {
      setError('Please provide your signature (minimum 5 characters).');
      return;
    }

    setIsSigning(true);

    try {
      const response = await fetch('/api/account-records/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });

      const payload = (await response.json()) as {
        error?: string;
        accountWaivers?: AccountWaiver[];
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to sign waivers.');
      }

      setWaivers(payload.accountWaivers || []);
      setSuccess('Waivers signed and saved to your account.');
    } catch (signError) {
      setError(signError instanceof Error ? signError.message : 'Unable to sign waivers.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {reviewingWaiverType && (
        <WaiverReviewDialog
          waiverType={reviewingWaiverType}
          waiverContent={WAIVER_CONTENT_BY_TYPE[reviewingWaiverType]}
          isAcknowledged={waiverAcknowledged[reviewingWaiverType] || false}
          onAcknowledge={handleAcknowledgeWaiver}
          onClose={handleCloseReview}
        />
      )}

      <section className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Waiver Signing</h2>
            <p className="text-sm text-muted-foreground">
              Sign once and reuse active waivers during booking.
            </p>
          </div>
          <Badge
            className={`px-3 py-1 text-xs font-medium ${
              waiverHealth
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {waiverHealth ? 'All waivers active' : 'Waivers need attention'}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {(['liability', 'medical', 'photo_release'] as const).map((type) => {
            const active = activeWaivers.find((waiver) => waiver.type === type);
            return (
              <div key={type} className="rounded border p-3">
                <p className="text-sm font-medium">{formatWaiverType(type)}</p>
                {active ? (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Signed {new Date(active.signedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {active.expiresAt
                        ? `Expires ${new Date(active.expiresAt).toLocaleDateString()}`
                        : 'No expiry'}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-auto p-0 text-xs"
                      onClick={() => handleReviewWaiver(type)}
                    >
                      View Waiver
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-amber-700">No active waiver on file</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-auto p-0 text-xs"
                      onClick={() => handleReviewWaiver(type)}
                    >
                      Review & Sign
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-md border p-3">
          <Label htmlFor="waiver-signature" className="text-sm font-medium">Type Your Signature</Label>
          <Input
            id="waiver-signature"
            className="mt-2"
            value={signature}
            onChange={(event) => setSignature(event.target.value)}
            placeholder="Jane Doe"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This updates liability, medical, and photo release waivers for your account.
          </p>
          {error ? (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {success ? (
            <Alert className="mt-2 border-emerald-200 bg-emerald-50 text-emerald-700">
              <CircleCheckBig className="size-4" />
              <AlertDescription className="text-emerald-700">{success}</AlertDescription>
            </Alert>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={isSigning}
              onClick={() => void handleSignWaivers()}
              className="w-full sm:w-auto"
            >
              {isSigning ? 'Signing...' : 'Sign / Refresh Waivers'}
            </Button>
            <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
              <Link href="/book">Use in Booking</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Medical Records</h2>
        <p className="text-sm text-muted-foreground">
          Track medications and other medical information for each pet.
        </p>
        <MedicalRecordsForm pets={pets} />
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Pet Vaccination Records</h2>
        <p className="text-sm text-muted-foreground">
          Persistent, pet-specific vaccination records available during booking.
        </p>

        <ul className="mt-4 space-y-3">
          {pets.length === 0 && (
            <li className="rounded border p-3 text-sm text-muted-foreground">
              No pets on file yet.
            </li>
          )}
          {pets.map((pet) => (
            <li key={pet.id} className="rounded border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{pet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pet.vaccines.length} vaccine record{pet.vaccines.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/pets/${pet.id}`}>Manage Records</Link>
                </Button>
              </div>

              {pet.vaccines.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {pet.vaccines.slice(0, 3).map((vaccine) => (
                    <li key={vaccine.id} className="text-muted-foreground">
                      {vaccine.name} • expires {new Date(vaccine.expiryDate).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
