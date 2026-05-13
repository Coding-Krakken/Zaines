import { Loader2 } from "lucide-react";

interface DashboardEmptyStateProps {
  title: string;
  description: string;
}

export function DashboardEmptyState({ title, description }: DashboardEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed bg-card/70 p-6">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface DashboardLoadingStateProps {
  message?: string;
}

export function DashboardLoadingState({ message = "Loading..." }: DashboardLoadingStateProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card/70 px-4 py-3 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
