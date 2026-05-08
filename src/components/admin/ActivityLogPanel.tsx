'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type BookingOption = {
  id: string;
  bookingNumber: string;
  status: string;
  user: { name: string | null; email: string | null } | null;
  bookingPets: Array<{ pet: { id: string; name: string; breed: string } | null }>;
};

type ActivityItem = {
  id: string;
  type: string;
  description: string | null;
  notes: string | null;
  performedBy: string | null;
  performedAt: string;
  pet: { id: string; name: string; breed: string };
  booking: { id: string; bookingNumber: string; status: string };
};

const ACTIVITY_TYPES = [
  'feeding',
  'walk',
  'play',
  'bathroom',
  'medication',
  'grooming',
] as const;

export function ActivityLogPanel({ initialBookingId = '' }: { initialBookingId?: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [bookingId, setBookingId] = useState('');
  const [petId, setPetId] = useState('');
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>('feeding');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

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

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [bookingsRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/bookings?status=checked_in', { cache: 'no-store' }),
        fetch('/api/admin/activities?limit=30', { cache: 'no-store' }),
      ]);

      const bookingsData = (await bookingsRes.json()) as {
        bookings?: BookingOption[];
        data?: BookingOption[];
        error?: string;
      };
      const activitiesData = (await activitiesRes.json()) as { activities?: ActivityItem[]; error?: string };

      if (!bookingsRes.ok) {
        throw new Error(bookingsData.error ?? 'Unable to load bookings');
      }
      if (!activitiesRes.ok) {
        throw new Error(activitiesData.error ?? 'Unable to load activities');
      }

      const loadedBookings = bookingsData.bookings ?? bookingsData.data ?? [];
      const loadedActivities = activitiesData.activities ?? [];

      setBookings(loadedBookings);
      setActivities(loadedActivities);

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
      setError(loadError instanceof Error ? loadError.message : 'Unable to load staff activity data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBookingId]);

  const activePetId = useMemo(() => {
    if (!selectedPets.length) return '';
    return selectedPets.some((p) => p.id === petId) ? petId : (selectedPets[0]?.id ?? '');
  }, [petId, selectedPets]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, petId: activePetId, type, description, notes }),
      });

      const data = (await res.json()) as { activity?: ActivityItem; error?: string };
      if (!res.ok || !data.activity) {
        throw new Error(data.error ?? 'Unable to save activity');
      }

      setActivities((current) => [data.activity as ActivityItem, ...current]);
      setDescription('');
      setNotes('');
      setSuccess('Activity logged.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save activity');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Log Activity</CardTitle>
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
              <p className="text-sm font-medium">Type</p>
              <Select value={type} onValueChange={(value) => setType(value as (typeof ACTIVITY_TYPES)[number])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((activityType) => (
                    <SelectItem key={activityType} value={activityType}>
                      {activityType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Quick summary"
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Notes</p>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional details"
                rows={4}
              />
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}

            <Button type="submit" className="w-full" disabled={saving || !bookingId || !activePetId || loading}>
              {saving ? 'Saving…' : 'Log Activity'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activities</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading activities…</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{activity.type}</Badge>
                    <span className="text-sm font-medium">{activity.pet.name}</span>
                    <span className="text-xs text-muted-foreground">{activity.booking.bookingNumber}</span>
                  </div>
                  {activity.description && <p className="mt-2 text-sm">{activity.description}</p>}
                  {activity.notes && <p className="mt-1 text-sm text-muted-foreground">{activity.notes}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(activity.performedAt).toLocaleString()} by {activity.performedBy ?? 'staff'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
