-- Portrait artwork for phones.
--
-- The banner stage takes its height from the hero, which makes it taller than
-- it is wide on a phone and wider than it is tall on a desktop. One landscape
-- creative cannot fill both, so a banner may now carry a second, portrait file.
--
-- Existing rows get '', which the app reads as "no phone artwork — use the wide
-- one at every width". That is exactly what they did before this column, so no
-- banner changes appearance until someone uploads a phone version.
ALTER TABLE "banners" ADD COLUMN "imageUrlMobile" TEXT NOT NULL DEFAULT '';
