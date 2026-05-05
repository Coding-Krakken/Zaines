import { z } from 'zod';

export const vaccineSchema = z.object({
  name: z.string().min(1, 'Vaccine name is required').max(100),
  administeredDate: z.string().datetime().or(z.date()),
  expiryDate: z.string().datetime().or(z.date()),
  veterinarian: z.string().max(200).optional(),
  documentUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

export type VaccineInput = z.infer<typeof vaccineSchema>;
