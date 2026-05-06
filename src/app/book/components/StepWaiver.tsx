"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import {
  stepWaiverSchema,
  type StepWaiverData,
} from "@/lib/validations/booking-wizard";
import { BOOKING_POLICY_ACKNOWLEDGMENT } from "@/config/trust-copy";
import { toast } from "sonner";

interface StepWaiverProps {
  data: Partial<StepWaiverData>;
  onUpdate: (data: Partial<StepWaiverData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepWaiver({
  data,
  onUpdate,
  onNext,
  onBack,
}: StepWaiverProps) {
  const [liabilityAccepted, setLiabilityAccepted] = useState(
    data.liabilityAccepted || false,
  );
  const [medicalAuthorizationAccepted, setMedicalAuthorizationAccepted] =
    useState(data.medicalAuthorizationAccepted || false);
  const [photoReleaseAccepted, setPhotoReleaseAccepted] = useState(
    data.photoReleaseAccepted || false,
  );
  const [policyAcknowledgmentAccepted, setPolicyAcknowledgmentAccepted] =
    useState(data.policyAcknowledgmentAccepted || false);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const signaturePadInstanceRef = useRef<SignaturePad | null>(null);
  const [signature, setSignature] = useState(data.signature || "");

  useEffect(() => {
    const canvas = signaturePadRef.current;

    if (!canvas) {
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.offsetWidth || 400;
    const height = 150;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const context = canvas.getContext("2d");
    context?.scale(ratio, ratio);

    const signaturePad = new SignaturePad(canvas);

    if (data.signature) {
      signaturePad.fromDataURL(data.signature);
    }

    signaturePadInstanceRef.current = signaturePad;

    return () => {
      signaturePadInstanceRef.current?.off();
      signaturePadInstanceRef.current = null;
    };
  }, [data.signature]);

  const handleClearSignature = () => {
    signaturePadInstanceRef.current?.clear();
    setSignature("");
    onUpdate({ signature: "" });
  };

  const handleSaveSignature = () => {
    const signaturePad = signaturePadInstanceRef.current;

    if (signaturePad) {
      if (signaturePad.isEmpty()) {
        toast.error("Please provide a signature before proceeding");
        return;
      }

      const dataUrl = signaturePad.toDataURL();
      setSignature(dataUrl);
      onUpdate({ signature: dataUrl });
    }
  };

  const handleNext = () => {
    const waiverData = {
      liabilityAccepted,
      medicalAuthorizationAccepted,
      photoReleaseAccepted,
      policyAcknowledgmentAccepted,
      signature,
    };

    const validation = stepWaiverSchema.safeParse(waiverData);

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    onUpdate(validation.data);
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Waivers & E-Signature
        </CardTitle>
        <CardDescription>
          Please review and accept the waivers below. Your signature is required
          to proceed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Liability Waiver */}
        <div className="space-y-2">
          <Checkbox
            id="liability"
            checked={liabilityAccepted}
            onCheckedChange={(checked) =>
              setLiabilityAccepted(checked as boolean)
            }
          />
          <Label htmlFor="liability" className="text-sm">
            I accept the <strong>liability waiver</strong> and understand that
            supervised dogs may still experience normal dog-behavior risks such
            as scratches, scrapes, or property damage.
          </Label>
        </div>

        {/* Medical Authorization */}
        <div className="space-y-2">
          <Checkbox
            id="medical"
            checked={medicalAuthorizationAccepted}
            onCheckedChange={(checked) =>
              setMedicalAuthorizationAccepted(checked as boolean)
            }
          />
          <Label htmlFor="medical" className="text-sm">
            I authorize Zaine&apos;s Stay & Play to seek emergency medical
            treatment for my pet if necessary, and I agree to cover all
            associated costs.
          </Label>
        </div>

        {/* Photo Release */}
        <div className="space-y-2">
          <Checkbox
            id="photo"
            checked={photoReleaseAccepted}
            onCheckedChange={(checked) =>
              setPhotoReleaseAccepted(checked as boolean)
            }
          />
          <Label htmlFor="photo" className="text-sm">
            I consent to the use of photos/videos of my pet for promotional
            purposes.
          </Label>
        </div>

        <div className="space-y-2 rounded-lg border p-4">
          <Checkbox
            id="policy-acknowledgment"
            checked={policyAcknowledgmentAccepted}
            onCheckedChange={(checked) =>
              setPolicyAcknowledgmentAccepted(checked as boolean)
            }
          />
          <Label htmlFor="policy-acknowledgment" className="text-sm">
            {BOOKING_POLICY_ACKNOWLEDGMENT}
          </Label>
        </div>

        {/* Signature Pad */}
        <div className="space-y-2">
          <Label htmlFor="signature">E-Signature *</Label>
          <div className="rounded-lg border p-4">
            <canvas
              id="signature"
              ref={signaturePadRef}
              width={400}
              height={150}
              aria-label="Signature pad"
              data-testid="booking-signature-pad"
              className="w-full border rounded-md"
            />
            <div className="mt-2 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSignature}
              >
                Clear
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveSignature}
              >
                Save Signature
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              !liabilityAccepted ||
              !medicalAuthorizationAccepted ||
              !photoReleaseAccepted ||
              !policyAcknowledgmentAccepted ||
              !signature
            }
          >
            Continue to Payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
