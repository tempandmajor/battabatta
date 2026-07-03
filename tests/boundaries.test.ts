import { describe, expect, it } from "vitest";
import { offerActionSchema, offerSchema, onboardingSchema, postSchema } from "@/lib/validation";

describe("product safety boundaries", () => {
  it("requires 18+ confirmation and terms acceptance to onboard", () => {
    const base = {
      displayName: "Sam Okafor",
      handle: "sam",
      bio: "",
      publicLocationLabel: "Near Ballard, Seattle",
      locationMode: "local" as const
    };

    expect(onboardingSchema.safeParse({ ...base, isAdultConfirmed: true, acceptsTerms: true }).success).toBe(true);
    expect(onboardingSchema.safeParse({ ...base, isAdultConfirmed: undefined, acceptsTerms: true }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, isAdultConfirmed: true, acceptsTerms: undefined }).success).toBe(false);
  });

  it("models limited availability with an explicit unit", () => {
    const base = {
      kind: "offering" as const,
      category: "services" as const,
      title: "App developer client openings",
      body: "Small app builds for nonprofits and community projects.",
      whatICanGive: "",
      locationMode: "online" as const,
      approvalPolicy: "manual_approval" as const
    };

    expect(postSchema.safeParse({ ...base, availabilityTotal: 4, availabilityUnit: "app developer clients" }).success).toBe(true);
    // A limit without a unit label would render meaninglessly ("2 of 4 available").
    expect(postSchema.safeParse({ ...base, availabilityTotal: 4 }).success).toBe(false);
  });

  it("only allows negotiation vocabulary for offer responses — no settlement states", () => {
    for (const allowed of ["interested", "countered", "declined", "withdrawn", "closed"]) {
      expect(offerActionSchema.safeParse(allowed).success).toBe(true);
    }
    for (const forbidden of ["completed", "settled", "paid", "accepted_with_payment"]) {
      expect(offerActionSchema.safeParse(forbidden).success).toBe(false);
    }
  });

  it("rejects offers without both sides of the exchange described", () => {
    const recipientId = "6b6ff0a4-8e3e-4a44-9457-6a52dcbc9b04";
    expect(offerSchema.safeParse({ recipientId, offeredItem: "Portrait", requestedItem: "" }).success).toBe(false);
    expect(offerSchema.safeParse({ recipientId, offeredItem: "", requestedItem: "Lessons" }).success).toBe(false);
    expect(
      offerSchema.safeParse({ recipientId, offeredItem: "Portrait commission", requestedItem: "2 photography lessons" }).success
    ).toBe(true);
  });
});
