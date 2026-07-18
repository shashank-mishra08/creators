import { prisma } from "@/lib/db/prisma";

/**
 * Global site settings — a single row keyed by "singleton". All fields have
 * DB defaults, so reads self-heal: if the row is missing we create it empty.
 */

const SINGLETON = "singleton";

/** The fields an admin may edit. `id`/`updatedAt` are managed, never accepted. */
export const SETTINGS_FIELDS = [
  "contactPhone",
  "contactEmail",
  "whatsappNumber",
  "officeAddress",
  "mapUrl",
  "businessHours",
  "websiteUrl",
  "reraNumber",
  "footerTagline",
  "instagramUrl",
  "facebookUrl",
  "linkedinUrl",
  "youtubeUrl",
  "leadNotifyEmails",
  "metaTitle",
  "metaDescription",
  "ogImageUrl",
  "ga4Id",
  "metaPixelId",
] as const;

export type SettingsTextField = (typeof SETTINGS_FIELDS)[number];

/** One extra footer line added via the "Add field" button. */
export interface CustomField {
  label: string;
  value: string;
}

export type SettingsPatch = Partial<Record<SettingsTextField, string>> & {
  maintenanceMode?: boolean;
  footerCustomFields?: CustomField[];
};

const MAX_CUSTOM_FIELDS = 12;

/**
 * Coerce arbitrary input (from the API body or a JSON DB column) into a clean
 * list of { label, value }. Drops anything malformed or empty; caps the count.
 * Never throws — bad data becomes an empty list.
 */
export function sanitizeCustomFields(input: unknown): CustomField[] {
  if (!Array.isArray(input)) return [];
  const out: CustomField[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const label = String((item as Record<string, unknown>).label ?? "").trim();
    const value = String((item as Record<string, unknown>).value ?? "").trim();
    if (!label && !value) continue;
    out.push({ label: label.slice(0, 60), value: value.slice(0, 200) });
    if (out.length >= MAX_CUSTOM_FIELDS) break;
  }
  return out;
}

export const settingsService = {
  /** Read the settings row, creating an empty one on first access. */
  async get() {
    return prisma.siteSettings.upsert({
      where: { id: SINGLETON },
      create: { id: SINGLETON },
      update: {},
    });
  },

  /** Apply a whitelisted patch. Unknown keys are ignored (never trusted). */
  async update(patch: SettingsPatch) {
    const data: Record<string, unknown> = {};
    for (const key of SETTINGS_FIELDS) {
      const v = patch[key];
      if (typeof v === "string") data[key] = v.trim();
    }
    if (typeof patch.maintenanceMode === "boolean") {
      data.maintenanceMode = patch.maintenanceMode;
    }
    if (patch.footerCustomFields !== undefined) {
      data.footerCustomFields = sanitizeCustomFields(patch.footerCustomFields);
    }
    return prisma.siteSettings.upsert({
      where: { id: SINGLETON },
      create: { id: SINGLETON, ...data },
      update: data,
    });
  },

  /**
   * Whether the public site is in maintenance mode. FAIL-OPEN: any error (DB
   * hiccup, missing table) returns false so the site is never taken down by a
   * settings-read failure.
   */
  async isMaintenanceMode(): Promise<boolean> {
    try {
      const row = await prisma.siteSettings.findUnique({
        where: { id: SINGLETON },
        select: { maintenanceMode: true },
      });
      return row?.maintenanceMode ?? false;
    } catch {
      return false;
    }
  },

  /**
   * Recipient emails for new-lead notifications (comma/space/newline separated).
   * Returns a de-duplicated list of valid-looking addresses; [] disables it.
   */
  async leadNotifyRecipients(): Promise<string[]> {
    try {
      const row = await prisma.siteSettings.findUnique({
        where: { id: SINGLETON },
        select: { leadNotifyEmails: true },
      });
      const raw = row?.leadNotifyEmails ?? "";
      const list = raw
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
      return Array.from(new Set(list));
    } catch {
      return [];
    }
  },

  /**
   * Public-safe settings for rendering the website (footer, contact, etc.).
   * NEVER exposes private fields like leadNotifyEmails. FAIL-OPEN: on any error
   * returns null so callers fall back to their hardcoded defaults (nothing
   * breaks, the page still renders exactly as before).
   */
  async getPublic(): Promise<PublicSettings | null> {
    try {
      const s = await prisma.siteSettings.findUnique({ where: { id: SINGLETON } });
      if (!s) return null;
      return {
        contactPhone: s.contactPhone,
        contactEmail: s.contactEmail,
        whatsappNumber: s.whatsappNumber,
        officeAddress: s.officeAddress,
        mapUrl: s.mapUrl,
        businessHours: s.businessHours,
        websiteUrl: s.websiteUrl,
        reraNumber: s.reraNumber,
        footerTagline: s.footerTagline,
        instagramUrl: s.instagramUrl,
        facebookUrl: s.facebookUrl,
        linkedinUrl: s.linkedinUrl,
        youtubeUrl: s.youtubeUrl,
        footerCustomFields: sanitizeCustomFields(s.footerCustomFields),
      };
    } catch {
      return null;
    }
  },
};

export interface PublicSettings {
  contactPhone: string;
  contactEmail: string;
  whatsappNumber: string;
  officeAddress: string;
  mapUrl: string;
  businessHours: string;
  websiteUrl: string;
  reraNumber: string;
  footerTagline: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  footerCustomFields: CustomField[];
}
