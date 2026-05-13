'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '@/components/dashboard/dashboard-states';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type VaccineRecord = {
  id: string;
  name: string;
  administeredDate: string;
  expiryDate: string;
  veterinarian: string | null;
  documentUrl: string | null;
  notes: string | null;
};

type VaccineForm = {
  name: string;
  administeredDate: string;
  expiryDate: string;
  veterinarian: string;
  notes: string;
};

function toDateInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

interface PetRecordsManagerProps {
  petId: string;
  petName: string;
  initialVaccines: VaccineRecord[];
}

export function PetRecordsManager({
  petId,
  petName,
  initialVaccines,
}: PetRecordsManagerProps) {
  const [vaccines, setVaccines] = useState<VaccineRecord[]>(initialVaccines);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingVaccineId, setEditingVaccineId] = useState<string | null>(null);

  const [form, setForm] = useState<VaccineForm>({
    name: '',
    administeredDate: '',
    expiryDate: '',
    veterinarian: '',
    notes: '',
  });

  const editingVaccine = useMemo(
    () => vaccines.find((item) => item.id === editingVaccineId) ?? null,
    [editingVaccineId, vaccines],
  );

  const refreshVaccines = async () => {
    const res = await fetch(`/api/vaccines?petId=${petId}`, { cache: 'no-store' });
    const payload = (await res.json()) as { vaccines?: VaccineRecord[]; error?: string };

    if (!res.ok) {
      throw new Error(payload.error || 'Failed to refresh vaccine records');
    }

    setVaccines(payload.vaccines || []);
  };

  const resetForm = () => {
    setForm({
      name: '',
      administeredDate: '',
      expiryDate: '',
      veterinarian: '',
      notes: '',
    });
    setEditingVaccineId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name || !form.administeredDate || !form.expiryDate) {
      setError('Name, administered date, and expiry date are required.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const payload = {
        name: form.name,
        administeredDate: toIsoDate(form.administeredDate),
        expiryDate: toIsoDate(form.expiryDate),
        veterinarian: form.veterinarian || undefined,
        notes: form.notes || undefined,
      };

      if (editingVaccineId) {
        const res = await fetch(`/api/vaccines/${editingVaccineId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const responsePayload = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(responsePayload.error || 'Failed to update vaccine record');
        }
      } else {
        const res = await fetch('/api/vaccines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            petId,
            ...payload,
          }),
        });

        const responsePayload = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(responsePayload.error || 'Failed to create vaccine record');
        }
      }

      await refreshVaccines();
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save vaccine record.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/vaccines/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error || 'Failed to delete vaccine record');
      }
      await refreshVaccines();
      if (editingVaccineId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete vaccine record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('petId', petId);

      const res = await fetch('/api/upload/vaccine', {
        method: 'POST',
        body: formData,
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to upload vaccine document');
      }

      await refreshVaccines();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = (record: VaccineRecord) => {
    setEditingVaccineId(record.id);
    setError(null);
    setForm({
      name: record.name,
      administeredDate: toDateInput(record.administeredDate),
      expiryDate: toDateInput(record.expiryDate),
      veterinarian: record.veterinarian || '',
      notes: record.notes || '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-medium">Vaccination Records</h3>
            <p className="text-sm text-muted-foreground">
              Upload, edit, and manage persistent records for {petName}. Records are reusable in booking.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/book">Use Records in Booking</Link>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-4 rounded-md border border-dashed p-3">
          <label className="text-sm font-medium">Upload Vaccine PDF</label>
          <Input
            className="mt-2"
            type="file"
            accept="application/pdf"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleUpload(file);
              }
              event.currentTarget.value = '';
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Uploading creates a persistent vaccine record tied to this pet.
          </p>
        </div>

        <ul className="mt-4 space-y-2">
          {vaccines.length === 0 && (
            <li>
              <DashboardEmptyState
                title="No vaccine records yet"
                description="Upload a PDF or add a vaccine record manually to keep this pet compliant."
              />
            </li>
          )}
          {vaccines.map((record) => (
            <li key={record.id} className="rounded border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{record.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Administered: {new Date(record.administeredDate).toLocaleDateString()} | Expires: {new Date(record.expiryDate).toLocaleDateString()}
                  </p>
                  {record.veterinarian && (
                    <p className="text-xs text-muted-foreground">Vet: {record.veterinarian}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {record.documentUrl && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/api/vaccines/${record.id}/document`} target="_blank">
                        View Document
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => startEditing(record)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => {
                      void handleDelete(record.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="text-base font-medium">
          {editingVaccine ? 'Edit Vaccine Record' : 'Add Vaccine Record'}
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label className="text-sm">Vaccine Name</Label>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Rabies"
            />
          </div>
          <div>
            <Label className="text-sm">Veterinarian (optional)</Label>
            <Input
              value={form.veterinarian}
              onChange={(event) => setForm((prev) => ({ ...prev, veterinarian: event.target.value }))}
              placeholder="Dr. Smith"
            />
          </div>
          <div>
            <Label className="text-sm">Administered Date</Label>
            <Input
              type="date"
              value={form.administeredDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, administeredDate: event.target.value }))
              }
            />
          </div>
          <div>
            <Label className="text-sm">Expiry Date</Label>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-sm">Notes (optional)</Label>
          <Textarea
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Booster due next spring"
            rows={2}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving || isUploading}>
            {isSaving
              ? 'Saving...'
              : editingVaccine
                ? 'Save Changes'
                : 'Add Record'}
          </Button>
          {editingVaccine && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
