import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import { EmailHeaderSimple } from "./email-logo";
import { EmailFooter } from "./email-footer";
import {
  emailCanvas,
  emailCard,
  emailSectionContentCompact,
} from "./email-theme";

interface OutreachWrapperProps {
  preview?: string;
  bodyHtml: string;
  recipientEmail: string;
}

/**
 * Branded wrapper for outreach emails stored as raw HTML in DB.
 * Follows the same layout pattern as all other GateCtr transactional emails.
 */
export function OutreachWrapper({
  preview = "",
  bodyHtml,
  recipientEmail,
}: OutreachWrapperProps) {
  return (
    <Html lang="en">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section
            style={emailSectionContentCompact}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
          <EmailFooter
            locale="en"
            email={recipientEmail}
            showUnsubscribe={true}
            variant="card"
          />
        </Container>
      </Body>
    </Html>
  );
}
