'use client';

import { useState } from 'react';
import { AlertCircle, CircleCheckBig } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  billingPortalEnabled?: boolean;
}

export function ProfileForm({ user, billingPortalEnabled = false }: ProfileFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    zip: user.zip || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setIsEditing(false);
      setSuccess('Profile updated successfully.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zip: user.zip || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true);
    setPortalError(null);

    try {
      const response = await fetch('/api/payments/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnPath: '/dashboard/settings' }),
      });

      const payload = (await response.json()) as { url?: string; message?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(
          payload.message || payload.error || 'Unable to open billing portal right now.',
        );
      }

      window.location.assign(payload.url);
    } catch (portalErr) {
      setPortalError(
        portalErr instanceof Error
          ? portalErr.message
          : 'Unable to open billing portal right now.',
      );
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile</CardTitle>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
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

        <div>
          <Label htmlFor="name">Name</Label>
          {isEditing ? (
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSaving}
            />
          ) : (
            <p className="mt-1 text-sm">{user.name || 'Not provided'}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          {isEditing ? (
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isSaving}
            />
          ) : (
            <p className="mt-1 text-sm">{user.email || 'Not provided'}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          {isEditing ? (
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={isSaving}
              placeholder="(555) 123-4567"
            />
          ) : (
            <p className="mt-1 text-sm">{user.phone || 'Not provided'}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          {isEditing ? (
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={isSaving}
              placeholder="123 Main St"
            />
          ) : (
            <p className="mt-1 text-sm">{user.address || 'Not provided'}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="city">City</Label>
            {isEditing ? (
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={isSaving}
              />
            ) : (
              <p className="mt-1 text-sm">{user.city || 'N/A'}</p>
            )}
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            {isEditing ? (
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                disabled={isSaving}
                maxLength={2}
                placeholder="NY"
              />
            ) : (
              <p className="mt-1 text-sm">{user.state || 'N/A'}</p>
            )}
          </div>

          <div>
            <Label htmlFor="zip">ZIP</Label>
            {isEditing ? (
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                disabled={isSaving}
                placeholder="12345"
              />
            ) : (
              <p className="mt-1 text-sm">{user.zip || 'N/A'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        )}

        {billingPortalEnabled && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium">Billing and Subscriptions</p>
            <p className="text-xs text-muted-foreground mt-1">
              Open Stripe&apos;s secure customer billing portal to manage payment methods and subscription settings.
            </p>
            {portalError ? (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="size-4" />
                <AlertDescription>{portalError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenBillingPortal}
                disabled={isOpeningPortal}
              >
                {isOpeningPortal ? 'Opening portal...' : 'Open Billing Portal'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
