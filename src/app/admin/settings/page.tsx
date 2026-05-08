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
import type { AdminSettings } from '@/types/admin';

const settingsFormSchema = z.object({
  autoConfirmBookings: z.boolean(),
  photoNotificationType: z.enum(['instant', 'daily_batch']),
  photoNotificationTime: z.string().nullable().optional(),
  dashboardDateRange: z.enum(['today', 'today_tomorrow', 'this_week']),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

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
          Configure admin page behavior and operational preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Settings</CardTitle>
            <CardDescription>Control how new bookings are created</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Photo Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Photo Notification Settings</CardTitle>
            <CardDescription>Control how owners are notified of uploaded photos</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
          className="w-full md:w-auto"
          size="lg"
        >
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
      </div>
    </div>
  );
}
