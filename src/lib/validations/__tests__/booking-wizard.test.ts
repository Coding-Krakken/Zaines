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
    const validData = { email: "test@example.com" };
    expect(stepAccountSchema.parse(validData)).toEqual(validData);

    const invalidData = { email: "invalid-email" };
    expect(() => stepAccountSchema.parse(invalidData)).toThrow();
  });

  it("validates stepPetsSchema", () => {
    const validData = {
      selectedPetIds: ["pet1"],
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
          petId: "pet1",
          fileUrl: "https://example.com/vaccine.pdf",
          fileName: "vaccine.pdf",
          fileSize: 1024,
        },
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

  it("validates stepWaiverSchema", () => {
    const validData = {
      liabilityAccepted: true,
      medicalAuthorizationAccepted: true,
      photoReleaseAccepted: true,
      signature: "data:image/png;base64,...",
      timestamp: new Date("2026-02-17T00:24:24.022Z"),
    };
    expect(stepWaiverSchema.parse(validData)).toEqual(validData);

    const invalidData = { ...validData, liabilityAccepted: false };
    expect(() => stepWaiverSchema.parse(invalidData)).toThrow();
  });

  it("validates stepPaymentSchema", () => {
    const validData = { paymentOption: "full", amount: 100 };
    expect(stepPaymentSchema.parse(validData)).toEqual(validData);

    const invalidData = { paymentOption: "unknown", amount: -10 };
    expect(() => stepPaymentSchema.parse(invalidData)).toThrow();
  });
});
