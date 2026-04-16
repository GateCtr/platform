-- CreateEnum
CREATE TYPE "OutboxEmailStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "inbox_emails" (
    "id" TEXT NOT NULL,
    "resendId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "headers" JSONB,
    "attachments" JSONB DEFAULT '[]',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "threadId" TEXT,
    "inReplyTo" TEXT,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_emails" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "resendId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "replyTo" TEXT,
    "status" "OutboxEmailStatus" NOT NULL DEFAULT 'QUEUED',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "trackingId" TEXT NOT NULL,
    "tags" JSONB DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "inReplyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inbox_emails_resendId_key" ON "inbox_emails"("resendId");

-- CreateIndex
CREATE INDEX "inbox_emails_fromEmail_idx" ON "inbox_emails"("fromEmail");

-- CreateIndex
CREATE INDEX "inbox_emails_toEmail_idx" ON "inbox_emails"("toEmail");

-- CreateIndex
CREATE INDEX "inbox_emails_threadId_idx" ON "inbox_emails"("threadId");

-- CreateIndex
CREATE INDEX "inbox_emails_isRead_idx" ON "inbox_emails"("isRead");

-- CreateIndex
CREATE INDEX "inbox_emails_isArchived_idx" ON "inbox_emails"("isArchived");

-- CreateIndex
CREATE INDEX "inbox_emails_createdAt_idx" ON "inbox_emails"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_emails_resendId_key" ON "outbox_emails"("resendId");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_emails_trackingId_key" ON "outbox_emails"("trackingId");

-- CreateIndex
CREATE INDEX "outbox_emails_userId_idx" ON "outbox_emails"("userId");

-- CreateIndex
CREATE INDEX "outbox_emails_toEmail_idx" ON "outbox_emails"("toEmail");

-- CreateIndex
CREATE INDEX "outbox_emails_status_idx" ON "outbox_emails"("status");

-- CreateIndex
CREATE INDEX "outbox_emails_resendId_idx" ON "outbox_emails"("resendId");

-- CreateIndex
CREATE INDEX "outbox_emails_trackingId_idx" ON "outbox_emails"("trackingId");

-- CreateIndex
CREATE INDEX "outbox_emails_createdAt_idx" ON "outbox_emails"("createdAt");

-- AddForeignKey
ALTER TABLE "inbox_emails" ADD CONSTRAINT "inbox_emails_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "inbox_emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_emails" ADD CONSTRAINT "outbox_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
