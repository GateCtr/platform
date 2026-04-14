import { render } from "@react-email/render";
import { OutreachWrapper } from "@/components/emails/outreach-wrapper";

/**
 * Renders the outreach email body inside the branded GateCtr layout.
 *
 * The body HTML (admin-authored, stored in DB) is injected via string
 * replacement after React Email renders the shell — this avoids
 * dangerouslySetInnerHTML in the React tree entirely.
 */
export async function wrapOutreachEmail(
  bodyHtml: string,
  recipientEmail: string,
  preview?: string,
): Promise<string> {
  const shell = await render(OutreachWrapper({ recipientEmail, preview }));
  // Replace the placeholder comment with the actual body HTML.
  // bodyHtml is admin-controlled template content from the DB, never user input.
  return shell.replace("__OUTREACH_BODY__", bodyHtml);
}
