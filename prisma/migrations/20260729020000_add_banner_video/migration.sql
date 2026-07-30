-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN     "videoUrl" TEXT NOT NULL DEFAULT '';

