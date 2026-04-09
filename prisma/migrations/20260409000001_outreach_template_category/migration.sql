-- Add templateCategory to outreach_prospects
ALTER TABLE "outreach_prospects" ADD COLUMN "templateCategory" TEXT NOT NULL DEFAULT 'general';

-- Drop old unique constraint on step (single column)
DROP INDEX IF EXISTS "outreach_templates_step_key";

-- Add category column to outreach_templates
ALTER TABLE "outreach_templates" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general';

-- Add new composite unique constraint [step, category]
CREATE UNIQUE INDEX "outreach_templates_step_category_key" ON "outreach_templates"("step", "category");

-- Add category index
CREATE INDEX "outreach_templates_category_idx" ON "outreach_templates"("category");
