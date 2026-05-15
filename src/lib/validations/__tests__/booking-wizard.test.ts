import { describe, it, expect } from "vitest";
import {
  stepDatesSchema,
  stepSuitesSchema,
  stepAccountSchema,
  stepPetsSchema,
  stepWaiverSchema,
  stepPaymentSchema,
} from "../booking-wizard";

describe("Validation Schemas", () => {
  it("validates stepDatesSchema", () => {
    const validData = {
      checkIn: "2026-02-20",
      checkOut: "2026-02-25",
      serviceType: "boarding",
      petCount: 2,
    };
    expect(stepDatesSchema.parse(validData)).toEqual(validData);

    const invalidData = { ...validData, checkOut: "2026-02-19" };
    expect(() => stepDatesSchema.parse(invalidData)).toThrow();
  });

  it("validates stepSuitesSchema", () => {
    const validData = {
      suiteType: "deluxe",
      addOns: [{ id: "extra-walk", quantity: 2 }],
    };
    expect(stepSuitesSchema.parse(validData)).toEqual(validData);

    const invalidData = { suiteType: "unknown" };
    expect(() => stepSuitesSchema.parse(invalidData)).toThrow();
  });

  it("validates stepAccountSchema", () => {
    const validData = {
      firstName: "Taylor",
      lastName: "Jordan",
      email: "test@example.com",
      phone: "3155551234",
    };
    expect(stepAccountSchema.parse(validData)).toEqual(validData);

    const invalidData = { ...validData, email: "invalid-email" };
    expect(() => stepAccountSchema.parse(invalidData)).toThrow();
  });

  it("validates stepPetsSchema", () => {
    const validData = {
      selectedPetIds: [],
      newPets: [
        {
          name: "Max",
          breed: "Labrador",
          age: 3,
          weight: 70,
          gender: "male",
        },
      ],
      vaccines: [
        {
          petId: "newPet1",
          fileUrl: "https://example.com/vaccine2.pdf",
          fileName: "vaccine2.pdf",
          fileSize: 2048,
        },
      ],
    };
    expect(stepPetsSchema.parse(validData)).toEqual(validData);

    const invalidData = { ...validData, vaccines: [] };
    expect(() => stepPetsSchema.parse(invalidData)).toThrow();
  });

  it("accepts root-relative vaccine file URLs", () => {
    const validData = {
      selectedPetIds: ["pet-1"],
      newPets: [],
      vaccines: [
        {
          petId: "pet-1",
          fileUrl: "/api/vaccines/v-inline-1/document",
          fileName: "vaccine.pdf",
          fileSize: 4096,
        },
      ],
    };

    expect(stepPetsSchema.parse(validData)).toEqual(validData);
  });

  it("requires at least one selected or newly added pet", () => {
    expect(() =>
      stepPetsSchema.parse({
        selectedPetIds: [],
        newPets: [],
        vaccines: [],
      }),
    ).toThrow();
  });

  it("validates stepWaiverSchema", () => {
    const validReusedData = {
      reuseOnFileWaiver: true,
      policyAcknowledgmentAccepted: true,
      signature: undefined,
    };
    expect(stepWaiverSchema.parse(validReusedData)).toBeDefined();

    const validNewSignatureData = {
      liabilityAccepted: true,
      medicalAuthorizationAccepted: true,
      photoReleaseAccepted: true,
      policyAcknowledgmentAccepted: true,
      reuseExistingWaivers: false,
      signature: "data:image/png;base64,...",
      timestamp: new Date("2026-02-17T00:24:24.022Z"),
    };
    expect(stepWaiverSchema.parse(validNewSignatureData)).toBeDefined();

    const invalidData = { ...validNewSignatureData, liabilityAccepted: false };
    expect(() => stepWaiverSchema.parse(invalidData)).toThrow();
  });

  it("accepts reused waivers when signature is an empty string", () => {
    const reusedWithEmptySignature = {
      reuseOnFileWaiver: true,
      policyAcknowledgmentAccepted: true,
      signature: "",
    };

    expect(stepWaiverSchema.parse(reusedWithEmptySignature)).toBeDefined();
  });

  it("validates stepPaymentSchema", () => {
    const validData = { paymentOption: "full", amount: 100 };
    expect(stepPaymentSchema.parse(validData)).toEqual(validData);

    const invalidData = { paymentOption: "unknown", amount: -10 };
    expect(() => stepPaymentSchema.parse(invalidData)).toThrow();
  });
});
