-- Add beta coupon fields to waitlist_entries
ALTER TABLE "waitlist_entries" ADD COLUMN "betaCouponCode" TEXT;
ALTER TABLE "waitlist_entries" ADD COLUMN "betaCouponSentAt" TIMESTAMP(3);
