'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Workflow state
  const [bookingData, setBookingData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [waiversSigned, setWaiversSigned] = useState(false);
  const [vaccinesCurrent, setVaccinesCurrent] = useState(false);
  const [medicationsReviewed, setMedicationsReviewed] = useState(false);
  const [specialRequestsAcknowledged, setSpecialRequestsAcknowledged] = useState(false);
  const now = new Date();

  // Load booking data on mount
  React.useEffect(() => {
    const loadBookingData = async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${id}`);
        if (!res.ok) {
          setErrorMessage('Booking not found');
          setIsLoadingData(false);
          return;
        }
        
        const data = await res.json();
        setBookingData(data.data || data);
      } catch (error) {
        console.error('Error loading booking:', error);
        setErrorMessage('Failed to load booking details');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadBookingData();
  }, [id]);

  React.useEffect(() => {
    if (!bookingData) {
      return;
    }

    const bookingWaivers = bookingData.waivers || [];
    const bookingPets = bookingData.bookingPets || [];

    const allWaiversSigned =
      bookingWaivers.length > 0 &&
      bookingWaivers.every((waiver: any) => Boolean(waiver.signedAt));

    const allVaccinesCurrent = bookingPets.every((bookingPet: any) => {
      const currentVaccine = bookingPet.pet?.vaccines?.find(
        (vaccine: any) => !vaccine.expiryDate || new Date(vaccine.expiryDate) > now,
      );

      return Boolean(currentVaccine);
    });

    const hasActiveMedicationRecords = bookingPets.some((bookingPet: any) =>
      bookingPet.pet?.medications?.some(
        (medication: any) => !medication.endDate || new Date(medication.endDate) > now,
      ),
    );

    setWaiversSigned(allWaiversSigned);
    setVaccinesCurrent(allVaccinesCurrent);
    setMedicationsReviewed(!hasActiveMedicationRecords);
    setSpecialRequestsAcknowledged(!bookingData.specialRequests);
  }, [bookingData]);

  const hasActiveMedications =
    bookingData?.bookingPets?.some((bp: any) =>
      bp.pet?.medications?.some(
        (medication: any) => !medication.endDate || new Date(medication.endDate) > now,
      ),
    ) || false;

  const allCheckboxesDone =
    waiversSigned &&
    vaccinesCurrent &&
    (hasActiveMedications ? medicationsReviewed : true) &&
    (bookingData?.specialRequests ? specialRequestsAcknowledged : true);

  async function handleCheckIn() {
    if (!allCheckboxesDone) {
      setErrorMessage('Please complete all health verification steps');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error ?? 'Check-in failed');
        return;
      }

      setStatus('success');
      setTimeout(() => router.push('/admin'), 2000);
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  }

  if (isLoadingData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const petNames =
    bookingData?.bookingPets
      ?.map((bp: any) => bp.pet?.name)
      .filter(Boolean)
      .join(', ') || '—';

  const petHealthSummary =
    bookingData?.bookingPets?.map((bookingPet: any) => {
      const currentVaccine = bookingPet.pet?.vaccines?.find(
        (vaccine: any) => !vaccine.expiryDate || new Date(vaccine.expiryDate) > now,
      );

      const activeMedications =
        bookingPet.pet?.medications?.filter(
          (medication: any) => !medication.endDate || new Date(medication.endDate) > now,
        ) || [];

      return {
        petId: bookingPet.pet?.id,
        petName: bookingPet.pet?.name,
        vaccineStatus: currentVaccine
          ? new Date(currentVaccine.expiryDate).getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000
            ? 'expiring_soon'
            : 'current'
          : 'missing',
        activeMedications,
      };
    }) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Booking Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Check-In: {bookingData?.bookingNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Guest</p>
              <p className="font-medium">{bookingData?.user?.name || bookingData?.user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Suite</p>
              <p className="font-medium">{bookingData?.suite?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pets</p>
              <p className="font-medium">{petNames}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check-in Date</p>
              <p className="font-medium">
                {new Date(bookingData?.checkInDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMessage && status !== 'success' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            ✅ Guest successfully checked in. Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {/* Waivers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Waiver Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ensure all required waivers are signed before proceeding
          </p>
          
          {bookingData?.waivers && bookingData.waivers.length > 0 ? (
            <div className="space-y-3">
              {bookingData.waivers.map((waiver: any) => (
                <div
                  key={waiver.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {waiver.type.replace('_', ' ')} Waiver
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {waiver.signedAt
                        ? `Signed on ${new Date(waiver.signedAt).toLocaleDateString()}`
                        : 'Not signed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {waiver.sourceType === 'auto_applied'
                        ? 'Reused from saved account record'
                        : waiver.sourceType === 'new_signature'
                          ? 'Signed during this booking'
                          : 'Legacy booking waiver'}
                    </p>
                  </div>
                  {waiver.signedAt ? (
                    <Badge variant="default" className="ml-2">
                      ✓ Signed
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-2">
                      Unsigned
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No waivers on file</p>
          )}

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="waivers"
              checked={waiversSigned}
              onCheckedChange={(checked) => setWaiversSigned(checked as boolean)}
            />
            <label htmlFor="waivers" className="text-sm font-medium cursor-pointer">
              I confirm all required waivers are signed
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Health Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Health Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify pet health status before check-in
          </p>

          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Pet health summary</p>
              <div className="space-y-2">
                {petHealthSummary.map((pet: any) => (
                  <div key={pet.petId} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{pet.petName}</p>
                      <p className="text-xs text-muted-foreground">
                        {pet.activeMedications.length > 0
                          ? `${pet.activeMedications.length} active medication(s)`
                          : 'No active medications'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        pet.vaccineStatus === 'current'
                          ? 'default'
                          : pet.vaccineStatus === 'expiring_soon'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {pet.vaccineStatus === 'current'
                        ? 'Vaccine current'
                        : pet.vaccineStatus === 'expiring_soon'
                          ? 'Vaccine expiring soon'
                          : 'Vaccine missing'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaccines */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Vaccines Current</p>
                <p className="text-xs text-muted-foreground">
                  Check that all pets have current vaccines
                </p>
              </div>
              <Checkbox
                id="vaccines"
                checked={vaccinesCurrent}
                onCheckedChange={(checked) => setVaccinesCurrent(checked as boolean)}
              />
            </div>

            {/* Medications */}
            {hasActiveMedications && (
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Medications Reviewed</p>
                  <p className="text-xs text-muted-foreground">
                    Review any active medications and dosing schedule
                  </p>
                </div>
                <Checkbox
                  id="medications"
                  checked={medicationsReviewed}
                  onCheckedChange={(checked) => setMedicationsReviewed(checked as boolean)}
                />
              </div>
            )}

            {/* Special Requests */}
            {bookingData?.specialRequests && (
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Special Requests Acknowledged</p>
                  <p className="text-xs text-muted-foreground">
                    "{bookingData.specialRequests}"
                  </p>
                </div>
                <Checkbox
                  id="special-requests"
                  checked={specialRequestsAcknowledged}
                  onCheckedChange={(checked) =>
                    setSpecialRequestsAcknowledged(checked as boolean)
                  }
                />
              </div>
            )}

            {!bookingData?.specialRequests && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">No special requests</p>
                  <p className="text-xs text-muted-foreground">
                    This booking has no special care requests
                  </p>
                </div>
                <Checkbox
                  id="special-requests"
                  checked={specialRequestsAcknowledged}
                  onCheckedChange={(checked) =>
                    setSpecialRequestsAcknowledged(checked as boolean)
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Checklist */}
      <Card className={allCheckboxesDone ? 'border-green-500 bg-green-50/30' : ''}>
        <CardContent className="pt-6 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {waiversSigned ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              )}
              <span className="text-sm">Waivers signed</span>
            </div>
            <div className="flex items-center gap-2">
              {vaccinesCurrent ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              )}
              <span className="text-sm">Vaccines verified</span>
            </div>
            {hasActiveMedications && (
              <div className="flex items-center gap-2">
                {medicationsReviewed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                )}
                <span className="text-sm">Medications reviewed</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {specialRequestsAcknowledged ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              )}
              <span className="text-sm">Special requests acknowledged</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCheckIn}
          disabled={status === 'loading' || status === 'success' || !allCheckboxesDone}
          className="flex-1"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking in…
            </>
          ) : allCheckboxesDone ? (
            'Confirm Check-In'
          ) : (
            'Complete verification to check in'
          )}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
