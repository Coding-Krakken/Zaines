'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const serviceUpdateSchema = z.object({
  services: z.array(
    z.object({
      id: z.string(),
      price: z.number().min(0, 'Price must be positive'),
      isActive: z.boolean(),
      name: z.string(),
      serviceTypeName: z.string(),
    }),
  ),
});

type ServiceUpdateFormValues = z.infer<typeof serviceUpdateSchema>;

interface ServiceManagementCardProps {
  onSave?: () => void;
}

export function ServiceManagementCard({
  onSave,
}: ServiceManagementCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm<ServiceUpdateFormValues>({
    resolver: zodResolver(serviceUpdateSchema),
    defaultValues: {
      services: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        setFetchError(null);
        const res = await fetch('/api/admin/services');
        const data = (await res.json()) as {
          success?: boolean;
          data?: {
            serviceTypes: Array<{
              id: string;
              name: string;
              services: Array<{
                id: string;
                name: string;
                price: number;
                isActive: boolean;
              }>;
            }>;
          };
          error?: string;
        };

        if (!res.ok) {
          setFetchError(data.error || 'Failed to load services');
          setIsLoading(false);
          return;
        }

        if (data.data?.serviceTypes) {
          const allServices: ServiceUpdateFormValues['services'] = [];

          for (const serviceType of data.data.serviceTypes) {
            for (const service of serviceType.services) {
              allServices.push({
                id: service.id,
                name: service.name,
                price: service.price,
                isActive: service.isActive,
                serviceTypeName: serviceType.name,
              });
            }
          }

          // Reset field array and re-populate
          form.reset({ services: allServices });
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setFetchError('Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [form]);

  async function onSubmit(values: ServiceUpdateFormValues) {
    setIsSaving(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: values.services.map((s) => ({
            id: s.id,
            price: s.price,
            isActive: s.isActive,
          })),
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error || 'Failed to save services');
        return;
      }

      toast.success('Services updated successfully!');
      onSave?.();
    } catch (error) {
      console.error('Services save error:', error);
      toast.error('Failed to save services');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services & Pricing</CardTitle>
          <CardDescription>
            Manage service types, pricing, and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services & Pricing</CardTitle>
        <CardDescription>
          Manage service types, pricing, and availability
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fetchError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No services configured</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Services List */}
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row sm:items-end gap-4 p-4 rounded-lg border"
                  >
                    {/* Service Type & Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {form.watch(`services.${index}.serviceTypeName`)}
                      </p>
                      <p className="font-medium text-sm">
                        {form.watch(`services.${index}.name`)}
                      </p>
                    </div>

                    {/* Price Input */}
                    <FormField
                      control={form.control}
                      name={`services.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Price</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                                className="w-24"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Active Toggle */}
                    <FormField
                      control={form.control}
                      name={`services.${index}.isActive`}
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
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            Active
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Services
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
