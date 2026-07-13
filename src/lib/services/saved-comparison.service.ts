import { savedComparisonRepository } from "@/lib/repositories/saved-comparison.repository";
import { userRepository } from "@/lib/repositories/user.repository";
import { propertyRepository } from "@/lib/repositories/property.repository";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { SavedComparison } from "@/lib/types";

export const savedComparisonService = {
  async listForUser(userId: string): Promise<SavedComparison[]> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return savedComparisonRepository.findByUser(userId);
  },

  async create(
    userId: string,
    propertyIds: string[],
    name?: string,
  ): Promise<SavedComparison> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    // Ensure all referenced properties actually exist before persisting.
    const unique = Array.from(new Set(propertyIds));
    const found = await propertyRepository.findByIds(unique);
    if (found.length !== unique.length)
      throw new ValidationError("One or more properties do not exist");

    return savedComparisonRepository.create(userId, unique, name ?? null);
  },

  async delete(id: string, userId: string): Promise<void> {
    const ok = await savedComparisonRepository.deleteOwned(id, userId);
    if (!ok)
      throw new NotFoundError("Saved comparison not found for this user");
  },
};
