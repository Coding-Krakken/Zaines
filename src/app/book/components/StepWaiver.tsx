"use client";

import { useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { stepWaiverSchema, type StepWaiverData } from "@/lib/validations/booking-wizard";
import { toast } from "sonner";

interface StepWaiverProps {
  data: Partial<StepWaiverData>;
  onUpdate: (data: Partial<StepWaiverData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepWaiver({ data, onUpdate, onNext, onBack }: StepWaiverProps) {
  const [liabilityAccepted, setLiabilityAccepted] = useState(data.liabilityAccepted || false);
  const [medicalAuthorizationAccepted, setMedicalAuthorizationAccepted] = useState(
    data.medicalAuthorizationAccepted || false
  );
  const [photoReleaseAccepted, setPhotoReleaseAccepted] = useState(data.photoReleaseAccepted || false);
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const [signature, setSignature] = useState(data.signature || "");

  const handleClearSignature = () => {
    const canvas = signaturePadRef.current;
    if (canvas) {
      const pad = new SignaturePad(canvas);
      pad.clear();
      setSignature("");
    }
  };

  const handleSaveSignature = () => {
    const canvas = signaturePadRef.current;
    if (canvas) {
      const pad = new SignaturePad(canvas);
      if (pad.isEmpty()) {
        toast.error("Please provide a signature before proceeding");
        return;
      }
      const dataUrl = pad.toDataURL();
      setSignature(dataUrl);
      onUpdate({ signature: dataUrl });
    }
  };

  const handleNext = () => {
    const waiverData: Partial<StepWaiverData> = {
      liabilityAccepted,
      medicalAuthorizationAccepted,
      photoReleaseAccepted,
      signature,
    };

    const validation = stepWaiverSchema.safeParse(waiverData);

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    onUpdate(waiverData);
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
          Please review and accept the waivers below. Your signature is required to proceed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Liability Waiver */}
        <div className="space-y-2">
          <Checkbox
            id="liability"
            checked={liabilityAccepted}
            onCheckedChange={(checked) => setLiabilityAccepted(checked as boolean)}
          />
          <Label htmlFor="liability" className="text-sm">
            I accept the <strong>liability waiver</strong>, releasing Zaine&apos;s Stay & Play from any
            liability for injuries or damages during my pet&apos;s stay.
          </Label>
        </div>

        {/* Medical Authorization */}
        <div className="space-y-2">
          <Checkbox
            id="medical"
            checked={medicalAuthorizationAccepted}
            onCheckedChange={(checked) => setMedicalAuthorizationAccepted(checked as boolean)}
          />
          <Label htmlFor="medical" className="text-sm">
            I authorize Zaine&apos;s Stay & Play to seek emergency medical treatment for my pet if
            necessary, and I agree to cover all associated costs.
          </Label>
        </div>

        {/* Photo Release */}
        <div className="space-y-2">
          <Checkbox
            id="photo"
            checked={photoReleaseAccepted}
            onCheckedChange={(checked) => setPhotoReleaseAccepted(checked as boolean)}
          />
          <Label htmlFor="photo" className="text-sm">
            I consent to the use of photos/videos of my pet for promotional purposes.
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
              className="w-full border rounded-md"
            />
            <div className="mt-2 flex justify-between">
              <Button variant="outline" size="sm" onClick={handleClearSignature}>
                Clear
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSaveSignature}>
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
