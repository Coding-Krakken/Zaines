"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  PawPrint, Plus, Upload, FileText, X, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle 
} from "lucide-react";
import { stepPetsSchema, newPetSchema, type StepPetsData, type NewPetData } from "@/lib/validations/booking-wizard";
import { validateFile, formatFileSize } from "@/lib/file-upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StepPetsProps {
  data: Partial<StepPetsData>;
  onUpdate: (data: Partial<StepPetsData>) => void;
  onNext: () => void;
  onBack: () => void;
  petCount?: number; // From dates step
}

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
}

export function StepPets({ data, onUpdate, onNext, onBack, petCount = 1 }: StepPetsProps) {
  const { data: session } = useSession();
  const [existingPets, setExistingPets] = useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(data.selectedPetIds || []);
  const [newPets, setNewPets] = useState<NewPetData[]>(data.newPets || []);
  const [vaccines, setVaccines] = useState<Array<{ petId: string; file: File; fileUrl?: string }>>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [uploadingVaccine, setUploadingVaccine] = useState<string | null>(null);
  const [showNewPetForm, setShowNewPetForm] = useState(false);
  const [newPetForm, setNewPetForm] = useState<Partial<NewPetData>>({
    gender: "male",
    temperament: "friendly",
  });

  // Fetch existing pets if authenticated
  useEffect(() => {
    if (session?.user?.id) {
      fetchPets();
    }
  }, [session]);

  const fetchPets = async () => {
    setIsLoadingPets(true);
    try {
      const response = await fetch("/api/pets");
      if (response.ok) {
        const petsData = await response.json();
        setExistingPets(petsData.pets || petsData || []);
      }
    } catch (error) {
      console.error("Failed to fetch pets:", error);
    } finally {
      setIsLoadingPets(false);
    }
  };

  const handlePetSelection = (petId: string, checked: boolean) => {
    let updated: string[];
    if (checked) {
      updated = [...selectedPetIds, petId];
    } else {
      updated = selectedPetIds.filter((id) => id !== petId);
    }
    setSelectedPetIds(updated);
    onUpdate({ selectedPetIds: updated });
  };

  const handleAddNewPet = () => {
    const validation = newPetSchema.safeParse(newPetForm);
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    const petWithId = {
      ...validation.data,
      tempId: `new-${Date.now()}`,
    };
    
    const updated = [...newPets, petWithId as NewPetData];
    setNewPets(updated);
    onUpdate({ newPets: updated });
    setNewPetForm({ gender: "male", temperament: "friendly" });
    setShowNewPetForm(false);
    toast.success(`${validation.data.name} added!`);
  };

  const handleRemoveNewPet = (index: number) => {
    const updated = newPets.filter((_, i) => i !== index);
    setNewPets(updated);
    onUpdate({ newPets: updated });
  };

  const handleVaccineUpload = async (petId: string, file: File) => {
    // Validate file
    const validation = validateFile(file, ["application/pdf"]);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploadingVaccine(petId);

    try {
      // Upload via API route
      const formData = new FormData();
      formData.append("file", file);
      formData.append("petId", petId);

      const response = await fetch("/api/upload/vaccine", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      
      // Store vaccine info
      const updatedVaccines = [
        ...vaccines.filter((v) => v.petId !== petId),
        {
          petId,
          file,
          fileUrl: result.url,
          fileName: file.name,
          fileSize: file.size,
        },
      ];
      
      setVaccines(updatedVaccines);
      
      // Update wizard data
      const vaccineData = updatedVaccines.map((v) => ({
        petId: v.petId,
        fileUrl: v.fileUrl || "",
        fileName: v.file.name,
        fileSize: v.file.size,
      }));
      
      onUpdate({ vaccines: vaccineData });
      
      toast.success("Vaccine record uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload vaccine record. Please try again.");
    } finally {
      setUploadingVaccine(null);
    }
  };

  const handleNext = () => {
    const totalPets = selectedPetIds.length + newPets.length;
    
    if (totalPets === 0) {
      toast.error("Please select or add at least one pet");
      return;
    }
    
    if (totalPets < (petCount || 1)) {
      toast.error(`You selected ${petCount} pets in step 1. Please add ${petCount} pet(s).`);
      return;
    }
    
    // Validate with schema
    const validation = stepPetsSchema.safeParse({
      selectedPetIds,
      newPets,
      vaccines: vaccines.map((v) => ({
        petId: v.petId,
        fileUrl: v.fileUrl || "",
        fileName: v.file.name,
        fileSize: v.file.size,
      })),
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PawPrint className="h-5 w-5" />
          Pet Profiles & Vaccination
        </CardTitle>
        <CardDescription>
          Select existing pets or add new profiles ({selectedPetIds.length + newPets.length} of {petCount} selected)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Pets Selection */}
        {session?.user && existingPets.length > 0 && (
          <div className="space-y-3">
            <Label>Your Pets</Label>
            <div className="space-y-2 rounded-lg border p-4">
              {existingPets.map((pet) => {
                const isSelected = selectedPetIds.includes(pet.id);
                const hasVaccine = vaccines.some((v) => v.petId === pet.id);
                
                return (
                  <div
                    key={pet.id}
                    className={cn(
                      "flex items-start space-x-3 rounded-md border-2 p-3 transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"
                    )}
                  >
                    <Checkbox
                      id={pet.id}
                      checked={isSelected}
                      onCheckedChange={(checked) => handlePetSelection(pet.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={pet.id} className="flex items-center gap-2 font-medium">
                        {pet.name}
                        {hasVaccine && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {pet.breed} • {pet.age} {pet.age === 1 ? "year" : "years"} • {pet.weight} lbs
                      </p>
                      
                      {/* Vaccine Upload */}
                      {isSelected && (
                        <div className="mt-2">
                          <label
                            htmlFor={`vaccine-${pet.id}`}
                            className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline"
                          >
                            {uploadingVaccine === pet.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : hasVaccine ? (
                              <>
                                <FileText className="h-4 w-4" />
                                Vaccine uploaded • Click to replace
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                Upload vaccine record (PDF)
                              </>
                            )}
                          </label>
                          <input
                            id={`vaccine-${pet.id}`}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVaccineUpload(pet.id, file);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Pets */}
        {newPets.length > 0 && (
          <div className="space-y-3">
            <Label>New Pets Being Added</Label>
            <div className="space-y-2">
              {newPets.map((pet, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3 dark:bg-blue-950">
                  <div className="flex-1">
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pet.breed} • {pet.age} {pet.age === 1 ? "year" : "years"} • {pet.weight} lbs
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveNewPet(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Pet Button/Form */}
        {!showNewPetForm && (
          <Button
            variant="outline"
            onClick={() => setShowNewPetForm(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Pet Profile
          </Button>
        )}

        {showNewPetForm && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add New Pet</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNewPetForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="petName">Name *</Label>
                <Input
                  id="petName"
                  value={newPetForm.name || ""}
                  onChange={(e) => setNewPetForm({ ...newPetForm, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="breed">Breed *</Label>
                <Input
                  id="breed"
                  value={newPetForm.breed || ""}
                  onChange={(e) => setNewPetForm({ ...newPetForm, breed: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age (years) *</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="30"
                  value={newPetForm.age || ""}
                  onChange={(e) => setNewPetForm({ ...newPetForm, age: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="1"
                  max="300"
                  value={newPetForm.weight || ""}
                  onChange={(e) => setNewPetForm({ ...newPetForm, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={newPetForm.gender}
                  onValueChange={(value) => setNewPetForm({ ...newPetForm, gender: value as "male" | "female" })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperament">Temperament</Label>
                <Select
                  value={newPetForm.temperament}
                  onValueChange={(value) => setNewPetForm({ ...newPetForm, temperament: value as any })}
                >
                  <SelectTrigger id="temperament">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="shy">Shy</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialNeeds">Special Needs (Optional)</Label>
              <Textarea
                id="specialNeeds"
                value={newPetForm.specialNeeds || ""}
                onChange={(e) => setNewPetForm({ ...newPetForm, specialNeeds: e.target.value })}
                placeholder="Allergies, medications, disabilities, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedingInstructions">Feeding Instructions (Optional)</Label>
              <Textarea
                id="feedingInstructions"
                value={newPetForm.feedingInstructions || ""}
                onChange={(e) => setNewPetForm({ ...newPetForm, feedingInstructions: e.target.value })}
                placeholder="Diet, portion sizes, feeding times, etc."
              />
            </div>
            
            <Button onClick={handleAddNewPet} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </div>
        )}

        {/* Vaccine Requirements Alert */}
        {(selectedPetIds.length + newPets.length) > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Vaccination Required:</strong> All pets must have current vaccination records
              (Rabies, DHPP, Bordetella). Please upload PDF documents.
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedPetIds.length + newPets.length === 0}
          >
            Continue to Waivers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
