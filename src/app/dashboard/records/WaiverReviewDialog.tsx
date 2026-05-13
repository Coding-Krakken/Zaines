'use client';

import { Button } from '@/components/ui/button';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card shadow-xl">
        <div className="border-b p-4 sm:p-6">
          <h2 className="text-xl font-semibold">{formatWaiverTitle(waiverType)}</h2>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 sm:p-6">
          <div className="whitespace-pre-wrap rounded-md bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
            {waiverContent}
          </div>
        </div>

        <div className="border-t p-4 sm:p-6">
          <label className="mb-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => {
                if (e.target.checked) {
                  onAcknowledge();
                }
              }}
              className="mt-1"
            />
            <span className="text-sm">
              I have read and understand the {formatWaiverTitle(waiverType).toLowerCase()}.
              I agree to the terms outlined above.
            </span>
          </label>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={onClose}
              disabled={!isAcknowledged}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
