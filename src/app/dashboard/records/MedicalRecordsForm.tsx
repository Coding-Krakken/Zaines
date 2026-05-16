'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CircleCheckBig } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DashboardEmptyState, DashboardLoadingState } from '@/components/dashboard/dashboard-states';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type PetRecord = {
  id: string;
  name: string;
  vaccines: Array<{
    id: string;
    name: string;
    expiryDate: string;
    documentUrl: string | null;
  }>;
};

type MedicationRecord = {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  instructions: string | null;
  prescribedBy: string | null;
};

type MedicationForm = {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  instructions: string;
  prescribedBy: string;
};

function toDateInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

interface MedicalRecordsFormProps {
  pets: PetRecord[];
}

export function MedicalRecordsForm({ pets }: MedicalRecordsFormProps) {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets.length > 0 ? pets[0].id : '');
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<MedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    instructions: '',
    prescribedBy: '',
  });

  const loadMedicationsForPet = useCallback(async (petId: string) => {
    if (!petId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/medications?petId=${petId}`, { cache: 'no-store' });
      const payload = (await res.json()) as { medications?: MedicationRecord[]; error?: string };

      if (!res.ok) {
        throw new Error(payload.error || 'Failed to load medication records');
      }

      setMedications(payload.medications || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load medications');
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPetId) {
      return;
    }

     
    void loadMedicationsForPet(selectedPetId);
  }, [loadMedicationsForPet, selectedPetId]);

  const handleSelectPet = async (petId: string) => {
    setSelectedPetId(petId);
    resetForm();
    await loadMedicationsForPet(petId);
  };

  const resetForm = () => {
    setForm({
      name: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      instructions: '',
      prescribedBy: '',
    });
    setEditingMedicationId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name || !form.dosage || !form.frequency || !form.startDate) {
      setError('Name, dosage, frequency, and start date are required.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const payload = {
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        startDate: toIsoDate(form.startDate),
        endDate: form.endDate ? toIsoDate(form.endDate) : undefined,
        instructions: form.instructions || undefined,
        prescribedBy: form.prescribedBy || undefined,
      };

      if (editingMedicationId) {
        const res = await fetch(`/api/medications/${editingMedicationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const responsePayload = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(responsePayload.error || 'Failed to update medication');
        }
      } else {
        const res = await fetch('/api/medications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            petId: selectedPetId,
            ...payload,
          }),
        });

        const responsePayload = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(responsePayload.error || 'Failed to create medication');
        }
      }

      setSuccess(editingMedicationId ? 'Medication updated.' : 'Medication added.');
      await loadMedicationsForPet(selectedPetId);
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Unable to save medication.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/medications/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error || 'Failed to delete medication');
      }
      await loadMedicationsForPet(selectedPetId);
      if (editingMedicationId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete medication.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (record: MedicationRecord) => {
    setEditingMedicationId(record.id);
    setError(null);
    setShowForm(true);
    setForm({
      name: record.name,
      dosage: record.dosage,
      frequency: record.frequency,
      startDate: toDateInput(record.startDate),
      endDate: record.endDate ? toDateInput(record.endDate) : '',
      instructions: record.instructions || '',
      prescribedBy: record.prescribedBy || '',
    });
  };

  if (pets.length === 0) {
    return (
      <DashboardEmptyState
        title="No pets on file"
        description="Add a pet profile first to track medications and treatment schedules."
      />
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <Label className="text-sm font-medium">Select Pet</Label>
        <Select value={selectedPetId} onValueChange={(value) => void handleSelectPet(value)}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Select a pet" />
          </SelectTrigger>
          <SelectContent>
          {pets.map((pet) => (
            <SelectItem key={pet.id} value={pet.id}>
              {pet.name}
            </SelectItem>
          ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
          <CircleCheckBig className="size-4" />
          <AlertDescription className="text-emerald-700">{success}</AlertDescription>
        </Alert>
      ) : null}

      {showForm ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-lg border bg-card p-3 shadow-sm">
          <h3 className="font-medium">
            {editingMedicationId ? 'Edit Medication' : 'Add Medication'}
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Amoxicillin"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Dosage *</Label>
              <Input
                value={form.dosage}
                onChange={(e) => setForm((prev) => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 250mg"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Frequency *</Label>
              <Input
                value={form.frequency}
                onChange={(e) => setForm((prev) => ({ ...prev, frequency: e.target.value }))}
                placeholder="e.g., Twice daily"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Prescribed By</Label>
              <Input
                value={form.prescribedBy}
                onChange={(e) => setForm((prev) => ({ ...prev, prescribedBy: e.target.value }))}
                placeholder="Veterinarian name"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Start Date *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">End Date (if applicable)</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Instructions</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
              placeholder="e.g., Take with food, avoid dairy"
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              disabled={isSaving}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save Medication'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(true)}
          size="sm"
        >
          Add Medication
        </Button>
      )}

      {isLoading ? (
        <DashboardLoadingState message="Loading medications..." />
      ) : medications.length === 0 ? (
        <DashboardEmptyState
          title="No medications on file"
          description={`No medications on file for ${selectedPetId ? pets.find((p) => p.id === selectedPetId)?.name : 'this pet'}.`}
        />
      ) : (
        <div className="space-y-2">
          {medications.map((med) => (
            <div key={med.id} className="rounded-lg border bg-card p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {med.dosage} • {med.frequency}
                  </p>
                  {med.prescribedBy && (
                    <p className="text-xs text-muted-foreground">
                      Prescribed by: {med.prescribedBy}
                    </p>
                  )}
                  {med.instructions && (
                    <p className="text-xs text-muted-foreground">
                      Instructions: {med.instructions}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Start: {new Date(med.startDate).toLocaleDateString()}
                    {med.endDate ? ` • End: ${new Date(med.endDate).toLocaleDateString()}` : ' • Ongoing'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(med)}
                    className="w-full sm:w-auto"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDelete(med.id)}
                    className="w-full text-destructive hover:text-destructive sm:w-auto"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
