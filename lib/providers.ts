/**
 * LLM Provider configuration — single source of truth.
 * Used in onboarding, settings, and API routing.
 */

export type ProviderId = "openai" | "anthropic" | "mistral" | "gemini";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  description: string;
  docsUrl: string;
  /** Regex to do a basic client-side format check */
  keyPattern: RegExp;
  keyPlaceholder: string;
  /** Tailwind color class for the provider accent */
  color: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    description: "GPT-4o, GPT-4, GPT-3.5",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPattern: /^sk-[A-Za-z0-9_-]{20,}$/,
    keyPlaceholder: "sk-...",
    color: "text-emerald-600",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    description: "Claude 3.5, Claude 3",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPattern: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
    keyPlaceholder: "sk-ant-...",
    color: "text-orange-600",
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    description: "Mistral Large, Mixtral",
    docsUrl: "https://console.mistral.ai/api-keys",
    keyPattern: /^[A-Za-z0-9]{32,}$/,
    keyPlaceholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    color: "text-blue-600",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    description: "Gemini 1.5 Pro, Flash",
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPattern: /^AIza[A-Za-z0-9_-]{35,}$/,
    keyPlaceholder: "AIza...",
    color: "text-sky-600",
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS[id as ProviderId];
}

export function isValidProvider(id: string): id is ProviderId {
  return id in PROVIDERS;
}
