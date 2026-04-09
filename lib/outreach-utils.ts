/**
 * Pure utility functions for the Outreach CRM module.
 * Kept separate from lib/actions/outreach.ts so they can be imported
 * by client components without triggering the "use server" constraint.
 */

export function applyVariableSubstitution(
  template: string,
  prospect: {
    firstName: string;
    lastName: string;
    company: string;
    jobTitle?: string | null;
  },
  senderName: string,
): string {
  // Use function replacements to avoid special replacement patterns
  // (e.g. $&, $1, $`, $') being interpreted by String.prototype.replace
  return template
    .replace(/\{\{firstName\}\}/g, () => prospect.firstName)
    .replace(/\{\{lastName\}\}/g, () => prospect.lastName)
    .replace(/\{\{company\}\}/g, () => prospect.company)
    .replace(/\{\{jobTitle\}\}/g, () => prospect.jobTitle ?? "")
    .replace(/\{\{senderName\}\}/g, () => senderName);
}
