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

export function TrustCopySettingsCard() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Copy</CardTitle>
        <CardDescription>
          Configure customer-facing disclosure copy with required compliance language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="trustCopySettings.pricingDisclosure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing Disclosure</FormLabel>
              <FormDescription>
                Must include wording about pre-confirmation visibility and hidden fees.
              </FormDescription>
              <FormControl>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="trustCopySettings.cancellationProcessing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cancellation Processing Note</FormLabel>
              <FormDescription>
                Message displayed on policies and terms pages for refund processing.
              </FormDescription>
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
      </CardContent>
    </Card>
  );
}
