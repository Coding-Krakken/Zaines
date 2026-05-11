'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from '@/components/admin/AdminAsyncState';

type OccupancyBooking = {
  id: string;
  bookingNumber: string;
  checkInDate: string;
  checkOutDate: string;
  guest: { id: string; name: string | null; email: string | null };
  pets: Array<{ id: string; name: string; breed: string }>;
};

type OccupancySuite = {
  id: string;
  name: string;
  tier: string;
  size: string;
  capacity: number;
  occupiedPets: number;
  occupancyPct: number;
  status: 'occupied' | 'available';
  bookings: OccupancyBooking[];
};

type OccupancyResponse = {
  suites: OccupancySuite[];
  summary: {
    suites: number;
    occupiedSuites: number;
    occupiedPets: number;
  };
};

export function OccupancyGrid() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<OccupancyResponse>({
    suites: [],
    summary: { suites: 0, occupiedSuites: 0, occupiedPets: 0 },
  });

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/occupancy', { cache: 'no-store' });
      const body = (await res.json()) as OccupancyResponse & { error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? 'Unable to load occupancy');
      }

      setData({
        suites: body.suites ?? [],
        summary: body.summary ?? { suites: 0, occupiedSuites: 0, occupiedPets: 0 },
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load occupancy');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Suites</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.summary.occupiedSuites}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pets In-House</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.summary.occupiedPets}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Suites</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.summary.suites}</CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <AdminErrorState
          message={error}
          action={{ label: 'Retry', onAction: () => void loadData() }}
        />
      )}

      {loading && <AdminLoadingState message="Loading suite occupancy…" />}

      {!loading && !error && data.suites.length === 0 && (
        <AdminEmptyState
          title="No active suite data"
          message="No checked-in bookings were found. Create or check in a booking to populate occupancy."
          action={{ label: 'View Bookings', href: '/admin/bookings?status=confirmed' }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data.suites.map((suite) => (
          <Card key={suite.id}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{suite.name}</CardTitle>
                <Badge variant={suite.status === 'occupied' ? 'secondary' : 'outline'}>{suite.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {suite.tier} • {suite.size}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{suite.occupiedPets} pets</span>
                  <span>Capacity {suite.capacity}</span>
                </div>
                <Progress value={suite.occupancyPct} />
              </div>

              {suite.bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checked-in bookings.</p>
              ) : (
                <div className="space-y-2">
                  {suite.bookings.map((booking) => (
                    <div key={booking.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{booking.bookingNumber}</span>
                        <Link href={`/admin/check-out/${booking.id}`} className="text-primary hover:underline">
                          Check Out
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {booking.guest.name ?? booking.guest.email ?? 'Guest'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pets: {booking.pets.map((pet) => pet.name).join(', ') || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
