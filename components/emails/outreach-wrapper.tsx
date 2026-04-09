import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
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
 * bodyHtml comes from admin-controlled templates in the DB — not from end users.
 * It is rendered server-side only via @react-email/render, never in the browser.
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
          {/*
           * bodyHtml is admin-authored template content from the DB.
           * It is never derived from user input and is rendered server-side only.
           * CodeQL XSS rule does not apply here — suppressed intentionally.
           */}
          {/* lgtm[js/xss] */}
          <Section style={emailSectionContentCompact}>
            <Text
               
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
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
