-- CreateTable
CREATE TABLE "outreach_prospects" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT,
    "website" TEXT,
    "linkedinUrl" TEXT,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_email_logs" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "resendId" TEXT,
    "subject" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "trackingId" TEXT NOT NULL,
    "targetUrl" TEXT,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_templates" (
    "id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outreach_prospects_email_key" ON "outreach_prospects"("email");

-- CreateIndex
CREATE INDEX "outreach_prospects_tier_idx" ON "outreach_prospects"("tier");

-- CreateIndex
CREATE INDEX "outreach_prospects_status_idx" ON "outreach_prospects"("status");

-- CreateIndex
CREATE INDEX "outreach_prospects_email_idx" ON "outreach_prospects"("email");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_email_logs_resendId_key" ON "outreach_email_logs"("resendId");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_email_logs_trackingId_key" ON "outreach_email_logs"("trackingId");

-- CreateIndex
CREATE INDEX "outreach_email_logs_prospectId_idx" ON "outreach_email_logs"("prospectId");

-- CreateIndex
CREATE INDEX "outreach_email_logs_trackingId_idx" ON "outreach_email_logs"("trackingId");

-- CreateIndex
CREATE INDEX "outreach_email_logs_resendId_idx" ON "outreach_email_logs"("resendId");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_templates_step_key" ON "outreach_templates"("step");

-- AddForeignKey
ALTER TABLE "outreach_email_logs" ADD CONSTRAINT "outreach_email_logs_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "outreach_prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
