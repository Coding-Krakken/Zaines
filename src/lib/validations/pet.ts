import { z } from "zod";

export const petSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  breed: z.string().min(1, "Breed is required").max(100),
  age: z.number().int().min(0).max(30),
  weight: z.number().positive("Weight must be positive").max(200),
  gender: z.enum(["male", "female"]),
  spayedNeutered: z.boolean().default(false),
  microchipId: z.string().max(50).optional(),
  temperament: z.string().max(200).optional(),
  specialNeeds: z.string().max(500).optional(),
  feedingInstructions: z.string().max(500).optional(),
  trainingLevel: z.enum(["none", "basic", "advanced"]).optional(),
  healthNotes: z.string().max(500).optional(),
});

export type PetInput = z.infer<typeof petSchema>;
