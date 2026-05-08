'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  LogOut,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import type { AdminBookingResponse } from '@/types/admin';

interface KPICard {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'alert';
  action?: {
    label: string;
    href: string;
  };
}

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'checked_in':
      return 'secondary';
    case 'completed':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getDateRange(
  dateRangeType: 'today' | 'today_tomorrow' | 'this_week',
): { startDate: Date; endDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  if (dateRangeType === 'today_tomorrow') {
    endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (dateRangeType === 'this_week') {
    const dayOfWeek = today.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysUntilSunday);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate: today, endDate };
}

interface AdminDashboardClientProps {
  dateRange: 'today' | 'today_tomorrow' | 'this_week';
}

export default function AdminDashboardClient({
  dateRange = 'today',
}: AdminDashboardClientProps) {
  const [bookings, setBookings] = useState<AdminBookingResponse[]>([]);
  const [kpis, setKpis] = useState<KPICard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch bookings data
  const fetchBookings = async () => {
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();

      if (data.data) {
        setBookings(data.data);
        calculateKPIs(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs from bookings
  const calculateKPIs = (bookingList: AdminBookingResponse[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count check-ins today
    const checkInsToday = bookingList.filter((b) => {
      const checkInDate = new Date(b.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      return (
        checkInDate.getTime() === today.getTime() &&
        (b.status === 'confirmed' || b.status === 'checked_in')
      );
    }).length;

    // Count check-outs today
    const checkOutsToday = bookingList.filter((b) => {
      const checkOutDate = new Date(b.checkOutDate);
      checkOutDate.setHours(0, 0, 0, 0);
      return (
        checkOutDate.getTime() === today.getTime() && b.status === 'checked_in'
      );
    }).length;

    // Count pending confirmations
    const pendingConfirmations = bookingList.filter(
      (b) => b.status === 'pending',
    ).length;

    // Count currently checked in (occupancy)
    const checkedIn = bookingList.filter(
      (b) => b.status === 'checked_in',
    ).length;

    const newKPIs: KPICard[] = [
      {
        label: 'Check-ins Today',
        value: checkInsToday,
        icon: <Calendar className="h-4 w-4" />,
        status: checkInsToday > 0 ? 'success' : 'warning',
        action: {
          label: 'View Bookings',
          href: '/admin/bookings?status=confirmed',
        },
      },
      {
        label: 'Check-outs Today',
        value: checkOutsToday,
        icon: <LogOut className="h-4 w-4" />,
        status: checkOutsToday > 0 ? 'success' : 'warning',
        action: {
          label: 'View Bookings',
          href: '/admin/bookings?status=checked_in',
        },
      },
      {
        label: 'Current Occupancy',
        value: checkedIn,
        icon: <Users className="h-4 w-4" />,
        status: checkedIn > 0 ? 'success' : 'warning',
        action: {
          label: 'View Occupancy',
          href: '/admin/occupancy',
        },
      },
      {
        label: 'Pending Confirmations',
        value: pendingConfirmations,
        icon: <AlertCircle className="h-4 w-4" />,
        status: pendingConfirmations > 0 ? 'alert' : 'success',
        action: {
          label: 'Confirm Now',
          href: '/admin/bookings?status=pending',
        },
      },
    ];

    setKpis(newKPIs);
    setLastUpdated(new Date());
  };

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [dateRange]);

  // Set up polling (5 second interval)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchBookings();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [dateRange]);

  if (isLoading && bookings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Link
          href="/admin/bookings/create"
          className="text-sm font-medium text-primary hover:underline"
        >
          + Create Booking
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const statusBg =
            kpi.status === 'success'
              ? 'bg-green-50 border-green-200'
              : kpi.status === 'alert'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200';

          return (
            <Card key={idx} className={statusBg}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.label}
                </CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.action && (
                  <Link
                    href={kpi.action.href}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {kpi.action.label} →
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bookings List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {dateRange === 'today'
            ? "Today's Bookings"
            : dateRange === 'today_tomorrow'
              ? 'Today & Tomorrow Bookings'
              : 'This Week Bookings'}
        </h2>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No bookings for this period.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const petNames = booking.bookingPets
                ?.map((bp) => bp.pet?.name)
                .filter(Boolean)
                .join(', ') || '—';

              return (
                <Card key={booking.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {booking.bookingNumber}
                      </CardTitle>
                      <Badge variant={statusBadgeVariant(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <div className="text-muted-foreground">Guest</div>
                        <div>
                          {booking.user?.name ?? booking.user?.email ?? '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Suite</div>
                        <div>{booking.suite?.name ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Pets</div>
                        <div>{petNames}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Dates</div>
                        <div>
                          {new Date(booking.checkInDate).toLocaleDateString()} →{' '}
                          {new Date(booking.checkOutDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      {booking.status === 'confirmed' && (
                        <Link
                          href={`/admin/check-in/${booking.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Check In →
                        </Link>
                      )}
                      {booking.status === 'checked_in' && (
                        <>
                          <Link
                            href={`/admin/activities?bookingId=${booking.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Activity →
                          </Link>
                          <Link
                            href={`/admin/photos?bookingId=${booking.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Photos →
                          </Link>
                          <Link
                            href={`/admin/check-out/${booking.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Check Out →
                          </Link>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
