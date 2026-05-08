'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminSettings, BusinessHours } from '@/types/admin';

const businessHoursSchema = z.object({
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  isClosed: z.boolean(),
});

const settingsFormSchema = z.object({
  // Operational Preferences
  autoConfirmBookings: z.boolean(),
  photoNotificationType: z.enum(['instant', 'daily_batch']),
  photoNotificationTime: z.string().nullable().optional(),
  dashboardDateRange: z.enum(['today', 'today_tomorrow', 'this_week']),
  // Phase 1: Business Hours & Contact Info
  businessHours: z.object({
    monday: businessHoursSchema,
    tuesday: businessHoursSchema,
    wednesday: businessHoursSchema,
    thursday: businessHoursSchema,
    friday: businessHoursSchema,
    saturday: businessHoursSchema,
    sunday: businessHoursSchema,
  }),
  contactPhone: z.string().min(1, 'Phone is required'),
  contactEmail: z.string().email('Invalid email'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State must be 2 characters').max(2),
  zip: z.string().min(5, 'ZIP code must be at least 5 characters').max(10),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      autoConfirmBookings: true,
      photoNotificationType: 'instant',
      photoNotificationTime: null,
      dashboardDateRange: 'today',
      businessHours: {
        monday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
        tuesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
        wednesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
        thursday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
        friday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
        saturday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
        sunday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
      },
      contactPhone: '(315) 657-1332',
      contactEmail: 'jgibbs@zainesstayandplay.com',
      address: '123 Pet Paradise Lane',
      city: 'Syracuse',
      state: 'NY',
      zip: '13202',
    },
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = (await res.json()) as {
          success?: boolean;
          data?: AdminSettings;
        };

        if (data.data) {
          form.reset(data.data);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [form]);

  async function onSubmit(values: SettingsFormValues) {
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = (await res.json()) as {
        success?: boolean;
        data?: AdminSettings;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error || 'Failed to save settings');
        return;
      }

      toast.success('Settings saved successfully!');
      form.reset(values);
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure business hours, contact info, and operational preferences
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Hours Card */}
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>Set opening and closing times for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-end gap-4 p-4 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-medium capitalize">{day}</label>
                  </div>

                  {/* Closed Checkbox */}
                  <FormField
                    control={form.control}
                    name={`businessHours.${day}.isClosed`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">Closed</FormLabel>
                      </FormItem>
                    )}
                  />

                  {/* Open/Close Times */}
                  {!form.watch(`businessHours.${day}.isClosed`) && (
                    <>
                      <FormField
                        control={form.control}
                        name={`businessHours.${day}.openTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Opens</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} className="w-24" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`businessHours.${day}.closeTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Closes</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} className="w-24" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update business contact details displayed to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(315) 657-1332" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Syracuse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="13202" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
              <CardDescription>Control how new bookings are created</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-confirm Toggle */}
              <FormField
                control={form.control}
                name="autoConfirmBookings"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-confirm Bookings</FormLabel>
                      <FormDescription>
                        Automatically confirm bookings when created from admin or phone orders
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Dashboard Date Range */}
              <FormField
                control={form.control}
                name="dashboardDateRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dashboard Date Range</FormLabel>
                    <FormDescription>
                      Which dates to show in admin dashboard KPIs
                    </FormDescription>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="today">Today only</SelectItem>
                        <SelectItem value="today_tomorrow">Today + Tomorrow</SelectItem>
                        <SelectItem value="this_week">This week (Mon-Sun)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Photo Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Photo Notification Settings</CardTitle>
              <CardDescription>Control how owners are notified of uploaded photos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Type */}
              <FormField
                control={form.control}
                name="photoNotificationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <FormDescription>
                      How frequently owners receive photo notifications
                    </FormDescription>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instant">
                          Instant - Notify on each photo upload
                        </SelectItem>
                        <SelectItem value="daily_batch">
                          Daily Batch - Send digest at set time
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notification Time */}
              {form.watch('photoNotificationType') === 'daily_batch' && (
                <FormField
                  control={form.control}
                  name="photoNotificationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Send Time</FormLabel>
                      <FormDescription>
                        Daily digest email send time
                      </FormDescription>
                      <FormControl>
                        <Input
                          type="time"
                          value={field.value ?? '17:00'}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button type="submit" disabled={isSaving} className="w-full md:w-auto" size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
