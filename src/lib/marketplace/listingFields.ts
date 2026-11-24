/**
 * Which listing-editor fields each provider kind sees, and how they read.
 *
 * The API keeps one listing shape for everyone, but not every field means
 * something for every kind:
 *   - Certifications are a person's credentials (a coach's CSCS, a
 *     dietitian's RD). A gym has none, so the gym editor hides them.
 *   - accepting_clients matters for every kind (the API ranks listings that
 *     aren't taking anyone last and refuses new requests to them), but a gym
 *     takes members, not clients. Mobile's gym editor says "Taking new
 *     members"; the web says the same.
 */
export type ListingKind = "gym" | "trainer" | "dietitian";

export interface ListingFieldSpec {
  /** Show the Certifications chip editor. */
  certifications: boolean;
  certificationsPlaceholder: string;
  specialtiesPlaceholder: string;
  /** Title and description of the card holding specialties (and certifications). */
  specialtiesCardTitle: string;
  specialtiesCardDesc: string;
  /** The accepting_clients switch. */
  availabilityLabel: string;
  availabilityOn: string;
  availabilityOff: string;
}

const SPECS: Record<ListingKind, ListingFieldSpec> = {
  gym: {
    certifications: false,
    certificationsPlaceholder: "",
    specialtiesPlaceholder: "e.g. Group classes",
    specialtiesCardTitle: "Specialties",
    specialtiesCardDesc: "Shown as tags on your listing.",
    availabilityLabel: "Taking new members",
    availabilityOn: "Open to new members",
    availabilityOff: "Not taking new members",
  },
  trainer: {
    certifications: true,
    certificationsPlaceholder: "e.g. CSCS",
    specialtiesPlaceholder: "e.g. Strength & conditioning",
    specialtiesCardTitle: "Specializations & credentials",
    specialtiesCardDesc: "Shown as tags on your listing. Credentials appear next to your name.",
    availabilityLabel: "Accepting clients",
    availabilityOn: "Shown as available",
    availabilityOff: "Not taking new clients",
  },
  dietitian: {
    certifications: true,
    certificationsPlaceholder: "e.g. Registered Dietitian",
    specialtiesPlaceholder: "e.g. Weight management",
    specialtiesCardTitle: "Specializations & credentials",
    specialtiesCardDesc: "Shown as tags on your listing. Credentials appear next to your name.",
    availabilityLabel: "Accepting clients",
    availabilityOn: "Shown as available",
    availabilityOff: "Not taking new clients",
  },
};

export function listingFieldsFor(kind: ListingKind): ListingFieldSpec {
  return SPECS[kind];
}
