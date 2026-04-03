-- Create table for admin-controlled site-wide broadcast notices
CREATE TABLE "GlobalBroadcast" (
  "id" TEXT NOT NULL,
  "broadcastKey" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GlobalBroadcast_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlobalBroadcast_broadcastKey_key" ON "GlobalBroadcast"("broadcastKey");
