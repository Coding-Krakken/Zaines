import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AdminRunbookAction = {
  label: string;
  href: string;
  helperText: string;
};

type AdminRunbookActionsProps = {
  title: string;
  description: string;
  actions: AdminRunbookAction[];
};

export function AdminRunbookActions({
  title,
  description,
  actions,
}: AdminRunbookActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant="outline"
            className="h-auto flex-col items-start gap-1 p-3 text-left"
            asChild
          >
            <Link href={action.href}>
              <span className="font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">
                {action.helperText}
              </span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}