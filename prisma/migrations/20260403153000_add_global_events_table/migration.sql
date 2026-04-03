-- Create global events table for site-wide timed events (e.g. Double XP)
CREATE TABLE "GlobalEvent" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GlobalEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlobalEvent_eventKey_key" ON "GlobalEvent"("eventKey");
