-- AlterTable
ALTER TABLE "users" ADD COLUMN     "savedPropertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
