'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminBookingFormData } from '@/types/admin';

// Form validation schema
const bookingFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  petIds: z.array(z.string()).min(1, 'At least one pet is required'),
  suiteId: z.string().min(1, 'Suite is required'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  specialRequests: z.string(),
  autoConfirm: z.boolean(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  onSuccess?: () => void;
  customers?: Array<{ id: string; name: string | null; email: string | null }>;
  pets?: Array<{ id: string; userId: string; name: string; breed: string }>;
  suites?: Array<{ id: string; name: string; pricePerNight: number }>;
  autoConfirmDefault?: boolean;
}

export function BookingForm({
  onSuccess,
  customers = [],
  pets = [],
  suites = [],
  autoConfirmDefault = true,
}: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [pricing, setPricing] = useState<{
    subtotal: number;
    tax: number;
    total: number;
  } | null>(null);
  const [availabilityCheck, setAvailabilityCheck] = useState<{ available: boolean; message: string } | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerId: '',
      petIds: [],
      suiteId: '',
      checkInDate: '',
      checkOutDate: '',
      specialRequests: '',
      autoConfirm: autoConfirmDefault,
    },
  });

  const customerPets = selectedCustomerId
    ? pets.filter((p) => p.userId === selectedCustomerId)
    : [];

  // Calculate pricing when dates or suite changes
  useEffect(() => {
    const calculatePricing = async () => {
      const checkInDate = form.getValues('checkInDate');
      const checkOutDate = form.getValues('checkOutDate');
      const suiteId = form.getValues('suiteId');

      if (!checkInDate || !checkOutDate || !suiteId) {
        setPricing(null);
        return;
      }

      const suite = suites.find((s) => s.id === suiteId);
      if (!suite) {
        setPricing(null);
        return;
      }

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      if (checkOut <= checkIn) {
        setPricing(null);
        return;
      }

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );

      const subtotal = suite.pricePerNight * nights;
      const tax = Math.round(subtotal * 0.1 * 100) / 100;
      const total = subtotal + tax;

      setPricing({ subtotal, tax, total });
    };

    calculatePricing();
  }, [form, suites]);

  // Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      const checkInDate = form.getValues('checkInDate');
      const checkOutDate = form.getValues('checkOutDate');
      const suiteId = form.getValues('suiteId');

      if (!checkInDate || !checkOutDate || !suiteId) {
        setAvailabilityCheck(null);
        return;
      }

      try {
        const res = await fetch('/api/admin/bookings/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            suiteId,
            checkInDate,
            checkOutDate,
          }),
        });

        const data = (await res.json()) as { available: boolean; message?: string };

        setAvailabilityCheck({
          available: data.available,
          message: data.message || (data.available ? 'Suite is available' : 'Suite is not available for these dates'),
        });
      } catch (error) {
        console.error('Availability check failed:', error);
        setAvailabilityCheck(null);
      }
    };

    checkAvailability();
  }, [form.watch('suiteId'), form.watch('checkInDate'), form.watch('checkOutDate')]);

  async function onSubmit(values: BookingFormValues) {
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: values.customerId,
          petIds: values.petIds,
          suiteId: values.suiteId,
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          specialRequests: values.specialRequests,
          autoConfirm: values.autoConfirm,
        } satisfies AdminBookingFormData),
      });

      const data = (await res.json()) as {
        success?: boolean;
        data?: { id: string; bookingNumber: string };
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error || 'Failed to create booking');
        return;
      }

      toast.success(`Booking ${data.data?.bookingNumber} created successfully!`);
      form.reset();
      setPricing(null);
      setSelectedCustomerId('');
      onSuccess?.();
    } catch (error) {
      console.error('Booking creation error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Booking</CardTitle>
        <CardDescription>Manually create a booking for a customer (phone order, walk-in, etc.)</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Selection */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCustomerId(value);
                      form.setValue('petIds', []);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name || customer.email || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pet Selection */}
            {selectedCustomerId && (
              <FormField
                control={form.control}
                name="petIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet(s) *</FormLabel>
                    <div className="space-y-2">
                      {customerPets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No pets for this customer
                        </p>
                      ) : (
                        customerPets.map((pet) => (
                          <div key={pet.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`pet-${pet.id}`}
                              checked={field.value.includes(pet.id)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...field.value, pet.id]
                                  : field.value.filter((id) => id !== pet.id);
                                field.onChange(updated);
                              }}
                              className="h-4 w-4"
                            />
                            <label
                              htmlFor={`pet-${pet.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {pet.name} ({pet.breed})
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Suite Selection */}
            <FormField
              control={form.control}
              name="suiteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suite *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a suite..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suites.map((suite) => (
                        <SelectItem key={suite.id} value={suite.id}>
                          {suite.name} (${suite.pricePerNight}/night)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Availability Check */}
            {availabilityCheck && (
              <div
                className={`flex items-center gap-2 p-3 rounded-md ${
                  availabilityCheck.available
                    ? 'bg-green-50 text-green-900'
                    : 'bg-red-50 text-red-900'
                }`}
              >
                {availabilityCheck.available ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{availabilityCheck.message}</span>
              </div>
            )}

            {/* Pricing */}
            {pricing && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">${pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span className="font-medium">${pricing.tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-bold">
                    <span>Total:</span>
                    <span>${pricing.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Requests */}
            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special care instructions, preferences, or notes..."
                      {...field}
                      className="min-h-24"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-confirm Toggle */}
            <FormField
              control={form.control}
              name="autoConfirm"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Auto-confirm Booking</FormLabel>
                    <FormDescription>
                      Create booking as confirmed immediately
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

            {/* Submit */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
