export type AnnouncementVariant = "info" | "warning" | "success" | "promo";

export interface AnnouncementConfig {
  message: string;
  messageFr?: string;
  cta?: string;
  ctaFr?: string;
  ctaHref?: string;
  variant: AnnouncementVariant;
  dismissable: boolean;
}
