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
export type SettingsPatch = Partial<Record<SettingsTextField, string>> & {
  maintenanceMode?: boolean;
};

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
    const data: Record<string, string | boolean> = {};
    for (const key of SETTINGS_FIELDS) {
      const v = patch[key];
      if (typeof v === "string") data[key] = v.trim();
    }
    if (typeof patch.maintenanceMode === "boolean") {
      data.maintenanceMode = patch.maintenanceMode;
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
};
