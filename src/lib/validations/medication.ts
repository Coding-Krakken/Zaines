import { z } from 'zod';

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required').max(100),
  dosage: z.string().min(1, 'Dosage is required').max(100),
  frequency: z.string().min(1, 'Frequency is required').max(100),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  instructions: z.string().max(500).optional(),
  prescribedBy: z.string().max(200).optional(),
});

export type MedicationInput = z.infer<typeof medicationSchema>;
