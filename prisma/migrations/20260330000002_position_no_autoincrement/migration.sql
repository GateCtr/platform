-- Remove autoincrement sequence from waitlist_entries.position
-- Position is now managed explicitly in application code
ALTER TABLE "waitlist_entries" ALTER COLUMN "position" SET DEFAULT 0;
ALTER TABLE "waitlist_entries" ALTER COLUMN "position" DROP DEFAULT;
