# Project Structure

## Root Configuration

- `package.json` - Dependencies and scripts (pnpm workspace)
- `tsconfig.json` - TypeScript config with path aliases (`@/*`)
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - PostCSS with Tailwind
- `.gitignore` - Git exclusions

## App Directory (Next.js App Router)

```
app/
├── (marketing)/          # Public pages (landing, waitlist)
├── (auth)/               # Clerk authentication pages
├── (dashboard)/          # Main user application
│   ├── layout.tsx        # Dashboard layout
│   ├── page.tsx          # Overview/home
│   ├── analytics/        # Token analytics
│   ├── projects/         # LLM project management
│   ├── api-keys/         # API key management
│   ├── budget/           # Budget configuration
│   ├── webhooks/         # Webhook configuration
│   └── billing/          # Stripe billing & plans
├── (admin)/              # Admin-only area (RBAC protected)
│   ├── users/
│   ├── plans/
│   ├── feature-flags/
│   ├── audit-logs/
│   └── system/
├── api/
│   ├── v1/               # Public SDK API endpoints
│   │   ├── complete/     # LLM completion
│   │   ├── chat/         # Chat endpoints
│   │   ├── usage/        # Usage stats
│   │   ├── budget/       # Budget management
│   │   └── webhooks/     # Webhook management
│   └── webhooks/
│       ├── clerk/        # Clerk sync webhooks
│       └── stripe/       # Stripe event webhooks
├── layout.tsx            # Root layout
├── page.tsx              # Home page
├── globals.css           # Global styles
└── favicon.ico
```

## Supporting Directories

```
components/
├── ui/                   # Radix UI + shadcn components
├── dashboard/            # Dashboard-specific components
├── admin/                # Admin panel components
├── charts/               # Recharts visualizations
└── emails/               # React Email templates

lib/
├── prisma.ts             # Prisma client singleton
├── redis.ts              # Redis client
├── stripe.ts             # Stripe client
├── resend.ts             # Resend email client
├── optimizer.ts          # Context optimization logic
├── router.ts             # Model routing logic
├── firewall.ts           # Budget firewall logic
├── webhooks.ts           # Webhook engine
├── permissions.ts        # RBAC permissions
├── api-auth.ts           # API authentication
├── audit.ts              # Audit logging
├── features.ts           # Feature flags
└── llm/                  # LLM provider integrations
    ├── openai.ts
    ├── anthropic.ts
    └── mistral.ts

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Migration history

workers/
├── webhook.worker.ts     # Background webhook processing
└── email.worker.ts       # Background email processing

sdk/                      # SDK package for Node.js/Python

tests/
├── unit/                 # Vitest unit tests
├── integration/          # Integration tests
└── e2e/                  # Playwright E2E tests

docs/                     # Platform documentation PDFs

public/                   # Static assets (images, icons)
```

## Route Groups

Next.js route groups (folders in parentheses) organize routes without affecting URL structure:

- `(marketing)` - Public marketing pages
- `(auth)` - Authentication flows
- `(dashboard)` - Protected user dashboard
- `(admin)` - Admin-only protected area

## Path Aliases

TypeScript path alias `@/*` maps to project root, enabling clean imports:

```typescript
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
```

## Naming Conventions

- **Files**: kebab-case for components (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Utilities**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TOKEN_LIMIT`)
- **Types/Interfaces**: PascalCase with descriptive names
