"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Pet } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

type Props = { pet: Pet };

export function EditPetForm({ pet }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState(pet.gender);
  const [spayedNeutered, setSpayedNeutered] = useState(pet.spayedNeutered);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      breed: form.get("breed") as string,
      age: parseInt(form.get("age") as string, 10),
      weight: parseFloat(form.get("weight") as string),
      gender,
      spayedNeutered,
      specialNeeds: (form.get("specialNeeds") as string) || undefined,
      feedingInstructions:
        (form.get("feedingInstructions") as string) || undefined,
    };

    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/dashboard/pets/${pet.id}`);
    } else {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to save pet");
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Edit {pet.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-1">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" defaultValue={pet.name} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="breed">Breed *</Label>
              <Input
                id="breed"
                name="breed"
                defaultValue={pet.breed}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="age">Age (years) *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="30"
                  defaultValue={pet.age}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  defaultValue={pet.weight}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={gender} onValueChange={setGender} required>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="spayedNeutered"
                checked={spayedNeutered}
                onCheckedChange={(v) => setSpayedNeutered(v === true)}
              />
              <Label htmlFor="spayedNeutered">Spayed / Neutered</Label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="specialNeeds">Special Needs</Label>
              <Textarea
                id="specialNeeds"
                name="specialNeeds"
                rows={2}
                defaultValue={pet.specialNeeds ?? ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="feedingInstructions">Feeding Instructions</Label>
              <Textarea
                id="feedingInstructions"
                name="feedingInstructions"
                rows={2}
                defaultValue={pet.feedingInstructions ?? ""}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
