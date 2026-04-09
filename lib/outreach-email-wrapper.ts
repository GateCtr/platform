import { render } from "@react-email/render";
import { OutreachWrapper } from "@/components/emails/outreach-wrapper";

/**
 * Renders the outreach email body inside the branded GateCtr layout.
 * Uses the same React Email components as all other transactional emails.
 */
export async function wrapOutreachEmail(
  bodyHtml: string,
  recipientEmail: string,
  preview?: string,
): Promise<string> {
  return render(OutreachWrapper({ bodyHtml, recipientEmail, preview }));
}
