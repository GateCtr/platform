-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "IncidentStatus" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "IncidentImpact" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "impact" "IncidentImpact" NOT NULL DEFAULT 'MINOR',
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "status_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "incidents_startedAt_idx" ON "incidents"("startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "status_subscribers_email_key" ON "status_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "status_subscribers_token_key" ON "status_subscribers"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "status_subscribers_email_idx" ON "status_subscribers"("email");
