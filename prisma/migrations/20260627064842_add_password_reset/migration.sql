-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetTokenExp" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT;
