'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CircleCheckBig, Shield, Smartphone, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  canRevokeSession,
  normalizeSecurityPayload,
  type SecurityPayload,
} from '@/lib/auth/security-panel-state';

type SessionEntry = {
  id: string;
  expiresAt: string;
  current: boolean;
  deviceHint: string | null;
};

type ActivityEntry = {
  id: string;
  eventType: string;
  provider: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isSuspicious: boolean;
  createdAt: string;
};

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SecurityPanel() {
  const [loading, setLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payload, setPayload] = useState<SecurityPayload | null>(null);

  const loadSecurityData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/sessions', { cache: 'no-store' });
      const result = (await response.json()) as SecurityPayload | { error?: string };

      if (!response.ok || !('sessions' in result)) {
        throw new Error((result as { error?: string }).error || 'Unable to load security details.');
      }

      setPayload(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load security details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSecurityData();
  }, []);

  const revokeSession = async (sessionId: string) => {
    setBusySessionId(sessionId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const result = (await response.json()) as { state?: string; error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Unable to revoke session.');
      }

      setSuccess('Session revoked.');
      await loadSecurityData();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Unable to revoke session.');
    } finally {
      setBusySessionId(null);
    }
  };

  const { sessions, activity, strategy, hasSuspicious } = normalizeSecurityPayload(payload);

  return (
    <Card id="security" className="paw-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Shield className="size-4" />
          Security and Sessions
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

        {hasSuspicious ? (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription>
              Suspicious activity was detected. If this was not you, reset your password immediately.
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading session activity...</p>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Active sessions</p>
              {strategy !== 'database' ? (
                <p className="text-xs text-muted-foreground">
                  Session revocation requires database-backed sessions. This environment is using JWT sessions.
                </p>
              ) : null}

              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sessions found.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {entry.current ? 'Current device' : 'Signed-in device'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires {formatDateTime(entry.expiresAt)}
                        </p>
                        {entry.deviceHint ? (
                          <p className="mt-1 text-xs text-muted-foreground">{entry.deviceHint}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          !canRevokeSession({
                            strategy: strategy || 'jwt',
                            session: entry,
                            busySessionId,
                          })
                        }
                        onClick={() => void revokeSession(entry.id)}
                      >
                        {busySessionId === entry.id ? 'Revoking...' : entry.current ? 'Current session' : 'Revoke'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Recent login activity</p>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {activity.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium capitalize">{entry.eventType.replaceAll('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Provider: {entry.provider || 'unknown'}
                      </p>
                      {(entry.userAgent || entry.ipAddress) ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Smartphone className="size-3" />
                          {entry.userAgent || entry.ipAddress}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
