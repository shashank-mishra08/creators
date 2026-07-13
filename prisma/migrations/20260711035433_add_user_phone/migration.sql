-- Add nullable phone number to users. Nullable so pre-existing accounts are
-- preserved (no data loss); registration enforces it as required at the app layer.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
