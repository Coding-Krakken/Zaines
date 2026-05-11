'use client';

import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type AdminActionProps = {
  label: string;
  href?: string;
  onAction?: () => void;
};

type AdminLoadingStateProps = {
  message?: string;
};

type AdminErrorStateProps = {
  title?: string;
  message: string;
  action?: AdminActionProps;
};

type AdminEmptyStateProps = {
  title: string;
  message: string;
  action?: AdminActionProps;
};

function renderAction(action?: AdminActionProps) {
  if (!action) {
    return null;
  }

  if (action.href) {
    return (
      <Button asChild size="sm" className="mt-3">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }

  if (action.onAction) {
    return (
      <Button size="sm" className="mt-3" onClick={action.onAction}>
        {action.label}
      </Button>
    );
  }

  return null;
}

export function AdminLoadingState({
  message = 'Loading data…',
}: AdminLoadingStateProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function AdminErrorState({
  title = 'Unable to load data',
  message,
  action,
}: AdminErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {renderAction(action)}
      </AlertDescription>
    </Alert>
  );
}

export function AdminEmptyState({ title, message, action }: AdminEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-8">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        {renderAction(action)}
      </CardContent>
    </Card>
  );
}