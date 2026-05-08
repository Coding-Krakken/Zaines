'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type BookingOption = {
  id: string;
  bookingNumber: string;
  status: string;
  user: { name: string | null; email: string | null } | null;
  bookingPets: Array<{ pet: { id: string; name: string; breed: string } | null }>;
};

type PhotoItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  uploadedAt: string;
  uploadedBy: string | null;
  pet: { id: string; name: string; breed: string };
  booking: { id: string; bookingNumber: string; status: string };
};

export function PhotoUploadPanel({ initialBookingId = '' }: { initialBookingId?: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  const [bookingId, setBookingId] = useState('');
  const [petId, setPetId] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notifyOwner, setNotifyOwner] = useState(true);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'checked_in'),
    [bookings],
  );
  const selectedBooking = activeBookings.find((booking) => booking.id === bookingId);
  const selectedPets = useMemo(
    () =>
      selectedBooking?.bookingPets
        .map((bp) => bp.pet)
        .filter((pet): pet is NonNullable<typeof pet> => Boolean(pet)) ?? [],
    [selectedBooking],
  );

  const previewUrl = useMemo(() => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const activePetId = useMemo(() => {
    if (!selectedPets.length) return '';
    return selectedPets.some((p) => p.id === petId) ? petId : (selectedPets[0]?.id ?? '');
  }, [petId, selectedPets]);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [bookingsRes, photosRes] = await Promise.all([
        fetch('/api/admin/bookings?status=checked_in', { cache: 'no-store' }),
        fetch('/api/admin/photos?limit=30', { cache: 'no-store' }),
      ]);

      const bookingsData = (await bookingsRes.json()) as {
        bookings?: BookingOption[];
        data?: BookingOption[];
        error?: string;
      };
      const photosData = (await photosRes.json()) as { photos?: PhotoItem[]; error?: string };

      if (!bookingsRes.ok) {
        throw new Error(bookingsData.error ?? 'Unable to load bookings');
      }
      if (!photosRes.ok) {
        throw new Error(photosData.error ?? 'Unable to load photos');
      }

      const loadedBookings = bookingsData.bookings ?? bookingsData.data ?? [];
      setBookings(loadedBookings);
      setPhotos(photosData.photos ?? []);

      const preselectedBooking =
        loadedBookings.find(
          (booking) => booking.status === 'checked_in' && booking.id === initialBookingId,
        ) ?? loadedBookings.find((booking) => booking.status === 'checked_in');

      if (preselectedBooking && !bookingId) {
        setBookingId(preselectedBooking.id);
        const firstPet = preselectedBooking.bookingPets.find((bp) => bp.pet)?.pet;
        if (firstPet) {
          setPetId(firstPet.id);
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load photo data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBookingId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Select an image before uploading.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.set('bookingId', bookingId);
      formData.set('petId', activePetId);
      formData.set('caption', caption);
      formData.set('file', file);
      formData.set('notifyOwner', String(notifyOwner));

      const res = await fetch('/api/admin/photos', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as { photo?: PhotoItem; error?: string };
      if (!res.ok || !data.photo) {
        throw new Error(data.error ?? 'Unable to upload photo');
      }

      // Queue notification if owner notification is enabled
      if (notifyOwner && data.photo) {
        try {
          await fetch('/api/admin/photo-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoId: data.photo.id,
              bookingId,
              petName: selectedPets.find((p) => p.id === activePetId)?.name,
              ownerEmail: selectedBooking?.user?.email,
              notifyOwner,
            }),
          });
        } catch (notificationError) {
          console.error('Error queuing notification:', notificationError);
          // Continue anyway - photo was uploaded successfully
        }
      }

      setPhotos((current) => [data.photo as PhotoItem, ...current]);
      setCaption('');
      setFile(null);
      setNotifyOwner(true);
      setSuccess('Photo uploaded.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload photo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Upload Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Booking</p>
              <Select value={bookingId} onValueChange={setBookingId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select checked-in booking" />
                </SelectTrigger>
                <SelectContent>
                  {activeBookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.bookingNumber} - {booking.user?.name ?? booking.user?.email ?? 'Guest'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Pet</p>
              <Select value={activePetId} onValueChange={setPetId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select pet" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Image</p>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Caption (optional)</p>
              <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Quick update for the owner" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="notify-owner"
                checked={notifyOwner}
                onChange={(e) => setNotifyOwner(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="notify-owner" className="text-sm font-medium cursor-pointer">
                Notify owner of this photo
              </label>
            </div>

            {previewUrl && (
              <div className="overflow-hidden rounded-md border">
                <Image src={previewUrl} alt="Preview" width={640} height={360} className="h-auto w-full" />
              </div>
            )}

            {error && <p className="text-sm text-red-700">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}

            <Button type="submit" className="w-full" disabled={saving || !bookingId || !activePetId || !file || loading}>
              {saving ? 'Uploading…' : 'Upload Photo'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Photos</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading photos…</p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-md border">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption ?? `${photo.pet.name} photo`}
                    width={480}
                    height={320}
                    className="h-36 w-full object-cover"
                  />
                  <div className="space-y-1 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{photo.pet.name}</Badge>
                      <span className="text-muted-foreground">{photo.booking.bookingNumber}</span>
                    </div>
                    {photo.caption && <p>{photo.caption}</p>}
                    <p className="text-muted-foreground">
                      {new Date(photo.uploadedAt).toLocaleString()} by {photo.uploadedBy ?? 'staff'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
