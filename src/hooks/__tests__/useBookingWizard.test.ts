import { describe, expect, it } from "vitest";
import { getRestoredWizardStep } from "../useBookingWizard";

describe("getRestoredWizardStep", () => {
  it("keeps the requested step when prerequisite data is complete", () => {
    expect(
      getRestoredWizardStep(
        {
          dates: {
            checkIn: "2026-06-10",
            checkOut: "2026-06-13",
            serviceType: "boarding",
            petCount: 1,
          },
          suites: {
            suiteType: "deluxe",
            addOns: [],
          },
          account: {
            firstName: "Morgan",
            lastName: "Lee",
            email: "morgan@example.com",
            phone: "3155551234",
          },
          pets: {
            selectedPetIds: [],
            newPets: [
              {
                name: "Scout",
                breed: "Beagle",
                age: 4,
                weight: 28,
                gender: "female",
              },
            ],
            vaccines: [
              {
                petId: "new-1",
                fileUrl: "https://example.com/scout-vaccine.pdf",
                fileName: "scout-vaccine.pdf",
                fileSize: 2048,
              },
            ],
          },
        },
        "waiver",
      ),
    ).toBe("waiver");
  });

  it("rewinds to the first incomplete prerequisite step", () => {
    expect(
      getRestoredWizardStep(
        {
          dates: {
            checkIn: "2026-06-10",
            checkOut: "2026-06-13",
            serviceType: "boarding",
            petCount: 1,
          },
          suites: {
            suiteType: "deluxe",
            addOns: [],
          },
        },
        "payment",
      ),
    ).toBe("account");
  });
});
