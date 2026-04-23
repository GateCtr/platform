// Sentry server-side instrumentation disabled for AWS Amplify Lambda compatibility.
// require-in-the-middle (used by Sentry auto-instrumentation) has missing transitive
// deps (debug, ms) in the Turbopack + pnpm + Lambda runtime.
// Re-enable when Amplify/Turbopack resolves external module bundling.
//
// To re-enable: uncomment the Sentry.init() block below.

// import * as Sentry from "@sentry/nextjs";
//
// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
//   tracesSampleRate: 1,
//   enableLogs: true,
//   sendDefaultPii: true,
// });
