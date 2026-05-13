'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

function formatWaiverTitle(type: 'liability' | 'medical' | 'photo_release'): string {
  if (type === 'photo_release') return 'Photo Release Waiver';
  if (type === 'medical') return 'Medical Authorization Waiver';
  return 'Liability Waiver';
}

interface WaiverReviewDialogProps {
  waiverType: 'liability' | 'medical' | 'photo_release';
  waiverContent: string;
  isAcknowledged: boolean;
  onAcknowledge: () => void;
  onClose: () => void;
}

export function WaiverReviewDialog({
  waiverType,
  waiverContent,
  isAcknowledged,
  onAcknowledge,
  onClose,
}: WaiverReviewDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{formatWaiverTitle(waiverType)}</DialogTitle>
          <DialogDescription>
            Review the waiver details before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[52vh] overflow-y-auto px-6 py-4">
          <div className="whitespace-pre-wrap rounded-md bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
            {waiverContent}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4 sm:justify-between">
          <div className="flex w-full items-start gap-3 sm:mr-4">
            <Checkbox
              id="waiver-acknowledge"
              checked={isAcknowledged}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  onAcknowledge();
                }
              }}
            />
            <Label htmlFor="waiver-acknowledge" className="text-sm font-normal text-muted-foreground">
              I have read and understand the {formatWaiverTitle(waiverType).toLowerCase()}. I agree to the terms outlined above.
            </Label>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Close
            </Button>
            <Button
              onClick={onClose}
              disabled={!isAcknowledged}
              className="flex-1 sm:flex-none"
            >
              Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
