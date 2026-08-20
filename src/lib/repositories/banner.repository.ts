import { prisma } from "@/lib/db/prisma";
import type { Banner, BannerInput } from "@/lib/types";

/**
 * Banner repository — the only place that talks to Prisma for promo banners.
 */

type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  mediaType: string;
  imageUrl: string;
  imageUrlMobile: string;
  videoUrl: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

function mapBanner(b: BannerRow): Banner {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    mediaType: b.mediaType === "video" ? "video" : "image",
    imageUrl: b.imageUrl,
    imageUrlMobile: b.imageUrlMobile,
    videoUrl: b.videoUrl,
    linkUrl: b.linkUrl,
    sortOrder: b.sortOrder,
    active: b.active,
    // Serialised for the client; Date objects don't survive the API boundary.
    startsAt: b.startsAt ? b.startsAt.toISOString() : null,
    endsAt: b.endsAt ? b.endsAt.toISOString() : null,
  };
}

const selectBanner = {
  id: true,
  title: true,
  subtitle: true,
  mediaType: true,
  imageUrl: true,
  imageUrlMobile: true,
  videoUrl: true,
  linkUrl: true,
  sortOrder: true,
  active: true,
  startsAt: true,
  endsAt: true,
} as const;

export const bannerRepository = {
  /** Banners the public site should show right now. */
  async findLive(now = new Date()): Promise<Banner[]> {
    const rows = await prisma.banner.findMany({
      where: {
        active: true,
        // A row with no media at all would render an empty slide.
        OR: [
          { mediaType: "image", imageUrl: { not: "" } },
          { mediaType: "video", videoUrl: { not: "" } },
        ],
        // A null bound means "no limit on that side".
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      select: selectBanner,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(mapBanner);
  },

  /** Every banner, including inactive and expired ones (admin view). */
  async findAll(): Promise<Banner[]> {
    const rows = await prisma.banner.findMany({
      select: selectBanner,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(mapBanner);
  },

  async create(input: BannerInput): Promise<Banner> {
    const row = await prisma.banner.create({
      data: toData(input),
      select: selectBanner,
    });
    return mapBanner(row);
  },

  async update(id: string, input: BannerInput): Promise<Banner> {
    const row = await prisma.banner.update({
      where: { id },
      data: toData(input),
      select: selectBanner,
    });
    return mapBanner(row);
  },

  async remove(id: string): Promise<void> {
    await prisma.banner.delete({ where: { id } });
  },
};

function toData(input: BannerInput) {
  return {
    title: input.title,
    subtitle: input.subtitle,
    mediaType: input.mediaType,
    imageUrl: input.imageUrl,
    imageUrlMobile: input.imageUrlMobile,
    videoUrl: input.videoUrl,
    linkUrl: input.linkUrl,
    sortOrder: input.sortOrder,
    active: input.active,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
  };
}
