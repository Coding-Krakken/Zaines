'use client';

import { useFormContext } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function WebsiteProfileSettingsCard() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Profile & Service Area</CardTitle>
        <CardDescription>
          Configure core website metadata and the service areas shown across the site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="websiteProfileSettings.siteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="websiteProfileSettings.ogImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Open Graph Image URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/og.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="websiteProfileSettings.siteDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website Description</FormLabel>
              <FormControl>
                <textarea
                  className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="websiteProfileSettings.serviceArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Area (comma-separated)</FormLabel>
              <FormDescription>
                Example: Syracuse, Liverpool, Cicero
              </FormDescription>
              <FormControl>
                <textarea
                  className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={(field.value || []).join(', ')}
                  onChange={(e) => {
                    const value = e.target.value
                      .split(',')
                      .map((city) => city.trim())
                      .filter(Boolean);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
