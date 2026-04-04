-- Add profile customization fields to User
ALTER TABLE "User" ADD COLUMN "bannerKey" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "User" ADD COLUMN "customImage" TEXT;
