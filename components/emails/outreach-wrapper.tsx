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
  recipientEmail: string;
}

/**
 * Branded layout shell for outreach emails.
 * The body HTML is injected after render() via string replacement in
 * lib/outreach-email-wrapper.ts — never via dangerouslySetInnerHTML.
 */
export function OutreachWrapper({
  preview = "",
  recipientEmail,
}: OutreachWrapperProps) {
  return (
    <Html lang="en">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section style={emailSectionContentCompact}>
            {/* OUTREACH_BODY_PLACEHOLDER */}
          </Section>
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
