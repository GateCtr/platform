import { Column, Img, Row, Section, Text } from "@react-email/components";
import { emailPublicAssetUrl } from "@/lib/email-assets";
import {
  EMAIL_ACCENT,
  EMAIL_PRIMARY,
  emailHeader,
  emailHeaderCompact,
} from "./email-theme";

const LOGO_PNG = "/logo.png";

/**
 * Pictogramme de marque : même fichier que `public/logo.png` sur le site.
 * (Le composant `Logo` React ne peut pas être rendu dans les clients mail ;
 * une URL absolue vers l’asset public est requise.)
 */
export function EmailLogoMark({ size = 36 }: { size?: number }) {
  return (
    <Img
      src={emailPublicAssetUrl(LOGO_PNG)}
      width={size}
      height={size}
      alt="GateCtr"
      style={{ display: "block", border: 0, outline: "none" }}
    />
  );
}

/** Wordmark: Gate + accent **C** + tr (same as `Logo` full variant). */
export function EmailWordmark() {
  return (
    <Text style={{ margin: "0", lineHeight: "1.2" }}>
      <span
        style={{
          color: EMAIL_PRIMARY,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
        }}
      >
        Gate
      </span>
      <span
        style={{
          color: EMAIL_ACCENT,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
        }}
      >
        C
      </span>
      <span
        style={{
          color: EMAIL_PRIMARY,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
        }}
      >
        tr
      </span>
    </Text>
  );
}

export function EmailHeaderCard() {
  return (
    <Section style={emailHeader}>
      <Row>
        <Column style={{ width: 44, verticalAlign: "middle" }}>
          <EmailLogoMark size={36} />
        </Column>
        <Column style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
          <EmailWordmark />
        </Column>
      </Row>
    </Section>
  );
}

export function EmailHeaderSimple() {
  return (
    <Section style={emailHeaderCompact}>
      <Row>
        <Column style={{ width: 40, verticalAlign: "middle" }}>
          <EmailLogoMark size={32} />
        </Column>
        <Column style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
          <EmailWordmark />
        </Column>
      </Row>
    </Section>
  );
}
