import { bannerRepository } from "@/lib/repositories/banner.repository";
import type { Banner, BannerInput } from "@/lib/types";

/**
 * Banner business logic. Routes call the service; the service calls the
 * repository. Mirrors the property service layering.
 */
export const bannerService = {
  /** Active, in-window banners for the public site. */
  live(): Promise<Banner[]> {
    return bannerRepository.findLive();
  },

  /** Everything, for the admin list. */
  all(): Promise<Banner[]> {
    return bannerRepository.findAll();
  },

  create(input: BannerInput): Promise<Banner> {
    return bannerRepository.create(input);
  },

  update(id: string, input: BannerInput): Promise<Banner> {
    return bannerRepository.update(id, input);
  },

  remove(id: string): Promise<void> {
    return bannerRepository.remove(id);
  },
};
