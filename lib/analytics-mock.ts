/**
 * Mock data for analytics dashboard — dev only.
 * Never imported in production (guarded by NODE_ENV check in the dashboard).
 */

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const MOCK_USAGE = {
  totalTokens: 1_847_320,
  totalRequests: 4_231,
  totalCostUsd: 18.4732,
  savedTokens: 742_800,
  byProvider: [
    {
      provider: "openai",
      totalTokens: 1_100_000,
      totalRequests: 2_400,
      totalCostUsd: 11.0,
    },
    {
      provider: "anthropic",
      totalTokens: 520_000,
      totalRequests: 1_200,
      totalCostUsd: 5.2,
    },
    {
      provider: "mistral",
      totalTokens: 227_320,
      totalRequests: 631,
      totalCostUsd: 2.27,
    },
  ],
  byModel: [
    {
      model: "gpt-4o",
      provider: "openai",
      totalTokens: 720_000,
      totalRequests: 1_500,
      totalCostUsd: 7.2,
      savedTokens: 288_000,
    },
    {
      model: "gpt-3.5-turbo",
      provider: "openai",
      totalTokens: 380_000,
      totalRequests: 900,
      totalCostUsd: 3.8,
      savedTokens: 152_000,
    },
    {
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      totalTokens: 520_000,
      totalRequests: 1_200,
      totalCostUsd: 5.2,
      savedTokens: 208_000,
    },
    {
      model: "mistral-large",
      provider: "mistral",
      totalTokens: 227_320,
      totalRequests: 631,
      totalCostUsd: 2.27,
      savedTokens: 94_800,
    },
  ],
  budgetStatus: {
    maxTokensPerMonth: 2_000_000,
    tokensPct: 92,
    alertThresholdPct: 80,
  },
};

export const MOCK_TRENDS = {
  trends: Array.from({ length: 30 }, (_, i) => {
    const base = 60_000 + Math.sin(i / 3) * 20_000 + Math.random() * 10_000;
    return {
      date: daysAgo(29 - i),
      totalTokens: Math.round(base),
      totalRequests: Math.round(base / 430),
      totalCostUsd: parseFloat((base * 0.00001).toFixed(4)),
      savedTokens: Math.round(base * 0.4),
    };
  }),
};
