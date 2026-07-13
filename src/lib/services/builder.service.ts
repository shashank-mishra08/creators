import {
  builderRepository,
  type BuilderWithStats,
} from "@/lib/repositories/builder.repository";

export const builderService = {
  list(): Promise<BuilderWithStats[]> {
    return builderRepository.findAll();
  },
  getById(id: string): Promise<BuilderWithStats | null> {
    return builderRepository.findById(id);
  },
};
