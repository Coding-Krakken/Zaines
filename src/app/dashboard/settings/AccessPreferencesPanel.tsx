'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';
import { AlertCircle, CircleCheckBig, KeyRound, Link2, MailCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  getConnectableProviders,
  isLinkedProviderPayload,
  isPreferencePayload,
  withUpdatedPreference,
  type LinkedProviderPayload,
  type PreferencePayload,
} from '@/lib/auth/access-preferences-state';

function displayProvider(provider: string): string {
  if (provider === 'google') return 'Google';
  if (provider === 'facebook') return 'Facebook';
  if (provider === 'resend') return 'Magic Link';
  return provider;
}

function formatDateTime(value: string | null): string {
  if (!value) return 'No recent login recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AccessPreferencesPanel() {
  const [loading, setLoading] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isUnlinkingProvider, setIsUnlinkingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [linkableProviders, setLinkableProviders] = useState<string[]>([]);
  const [hasPasswordCredential, setHasPasswordCredential] = useState(false);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    bookingStatusEmailsEnabled: true,
    productUpdatesEmailsEnabled: false,
    marketingEmailsEnabled: false,
  });

  const connectableProviders = useMemo(
    () =>
      getConnectableProviders({
        linkedProviders,
        linkableProviders,
      }),
    [linkedProviders, linkableProviders],
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [providerRes, preferencesRes] = await Promise.all([
        fetch('/api/auth/linked-providers', { cache: 'no-store' }),
        fetch('/api/profile/preferences', { cache: 'no-store' }),
      ]);

      const providerPayload = (await providerRes.json()) as LinkedProviderPayload | { error?: string };
      const preferencePayload = (await preferencesRes.json()) as PreferencePayload | { error?: string };

      if (!providerRes.ok || !isLinkedProviderPayload(providerPayload)) {
        throw new Error((providerPayload as { error?: string }).error || 'Unable to load linked providers.');
      }

      if (!preferencesRes.ok || !isPreferencePayload(preferencePayload)) {
        throw new Error((preferencePayload as { error?: string }).error || 'Unable to load preferences.');
      }

      setLinkedProviders(providerPayload.providers);
      setLinkableProviders(providerPayload.canLink);
      setHasPasswordCredential(providerPayload.hasPasswordCredential);

      setPreferences(preferencePayload.preferences);
      setLastLoginAt(preferencePayload.lastLoginAt);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load account access settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updatePreference = async (key: keyof typeof preferences, value: boolean) => {
    const next = withUpdatedPreference(preferences, key, value);
    setPreferences(next);
    setIsSavingPreferences(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });

      const payload = (await response.json()) as PreferencePayload | { error?: string };
      if (!response.ok || !isPreferencePayload(payload)) {
        throw new Error((payload as { error?: string }).error || 'Unable to save preferences.');
      }

      setPreferences(payload.preferences);
      setLastLoginAt(payload.lastLoginAt);
      setSuccess('Communication preferences updated.');
    } catch (saveError) {
      setPreferences(preferences);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const unlinkProvider = async (provider: string) => {
    setError(null);
    setSuccess(null);
    setIsUnlinkingProvider(provider);

    try {
      const response = await fetch('/api/auth/linked-providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to unlink provider.');
      }

      setSuccess(`${displayProvider(provider)} disconnected.`);
      await load();
    } catch (unlinkError) {
      setError(unlinkError instanceof Error ? unlinkError.message : 'Unable to unlink provider.');
    } finally {
      setIsUnlinkingProvider(null);
    }
  };

  const beginProviderLink = async (provider: string) => {
    setError(null);
    setSuccess(null);

    try {
      await signIn(provider, { callbackUrl: '/dashboard/settings?linked=1' });
    } catch {
      setError(`Unable to connect ${displayProvider(provider)} right now.`);
    }
  };

  return (
    <Card className="luxury-card border-border/60 bg-background/85 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Link2 className="size-4" />
          Access and Preferences
        </CardTitle>
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

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading access settings...</p>
        ) : (
          <>
            <section className="space-y-2">
              <p className="text-sm font-medium">Linked sign-in methods</p>
              <p className="text-xs text-muted-foreground">
                Last successful sign-in: {formatDateTime(lastLoginAt)}
              </p>
              <div className="space-y-2">
                {linkedProviders.map((provider) => (
                  <div
                    key={provider}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                  >
                    <span className="text-sm">{displayProvider(provider)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUnlinkingProvider === provider}
                      onClick={() => void unlinkProvider(provider)}
                    >
                      {isUnlinkingProvider === provider ? 'Removing...' : 'Disconnect'}
                    </Button>
                  </div>
                ))}

                {hasPasswordCredential ? (
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <KeyRound className="size-4" />
                      Email and password
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {connectableProviders.map((provider) => (
                    <Button
                      key={provider}
                      variant="outline"
                      size="sm"
                      onClick={() => void beginProviderLink(provider)}
                    >
                      Connect {displayProvider(provider)}
                    </Button>
                  ))}
              </div>
            </section>

            <section className="space-y-3 border-t pt-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium">
                <MailCheck className="size-4" />
                Email preferences
              </p>

              <div className="space-y-2">
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  Booking updates and reservation reminders
                  <Switch
                    checked={preferences.bookingStatusEmailsEnabled}
                    disabled={isSavingPreferences}
                    onCheckedChange={(checked) =>
                      void updatePreference('bookingStatusEmailsEnabled', checked === true)
                    }
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  Product and platform updates
                  <Switch
                    checked={preferences.productUpdatesEmailsEnabled}
                    disabled={isSavingPreferences}
                    onCheckedChange={(checked) =>
                      void updatePreference('productUpdatesEmailsEnabled', checked === true)
                    }
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  Marketing offers and promotions
                  <Switch
                    checked={preferences.marketingEmailsEnabled}
                    disabled={isSavingPreferences}
                    onCheckedChange={(checked) =>
                      void updatePreference('marketingEmailsEnabled', checked === true)
                    }
                  />
                </label>
              </div>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
