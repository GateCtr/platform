---
inclusion: always
---

# GateCtr Copywriting Rules

## CTA Copy by Context

| Context | Primary CTA | Secondary CTA | Tone |
|---|---|---|---|
| Hero page | `See your savings — free` | `How it works in 90s` | Confident, outcome-first |
| Pricing page | `Start saving — no card needed` | `Compare plans` | Reassuring, no friction |
| Landing dev | `npm install @gatectr/sdk` | `View docs` | Technical, actionable |
| Empty dashboard | `Connect your first LLM` | `Import existing key` | Guiding, simple |
| Budget alert | `Upgrade to Pro` | `Adjust limits` | Urgent but caring |
| Onboarding | `Set up your first project` | `Skip for now` | Progressive, non-intrusive |
| Enterprise | `Book a technical call` | `Download overview PDF` | Professional, serious |
| Email nurture | `See your token savings` | `View full report` | Data-driven, curiosity |
| Offboarding | `Pause my plan` | `Talk to support` | Empathetic, non-aggressive |
| Demo | `Run through GateCtr` | — | Direct, action |
| After demo result | `Start free — this happens on every request` | `View pricing` | Momentum, convert now |

## Rules

### Primary CTA
- One per view. Action-first. Outcome-implied.
- Never vague: `"See your savings — free"` not `"Get started"`
- Dev contexts: use the actual command — `npm install @gatectr/sdk`
- After demo: anchor on the savings just shown — "312 tokens saved on this request. -39% on every call."

### Secondary CTA
- Always less visually prominent than primary (`cta-secondary` or `cta-ghost`)
- Offers an alternative path, never competes with primary
- Offboarding: secondary must be softer than primary — never push churn

### Tone per context
- Hero / Pricing: confident, no hedging, lead with numbers
- Dev landing: technical and direct — devs scan, they don't read
- Dashboard empty state: guiding, not pushy — user just arrived
- Budget alert: create urgency without panic — give an out (`Adjust limits`)
- Onboarding: respect their time, always offer a skip
- Enterprise: formal, no slang, PDF download signals seriousness
- Email: data first, curiosity second — `"See your token savings"` implies there's something worth seeing
- Offboarding: never aggressive, `"Pause"` is softer than `"Cancel"`, always offer support

## Features → Outcomes (copy-ready)

| Feature | ❌ Technical | ✅ Outcome |
|---|---|---|
| Context Optimizer | "Prompt compression" | "Up to 40% fewer tokens per request. Measured on every call." |
| Budget Firewall | "Hard caps" | "Hit the cap → request blocked → $0 cost incurred. Before it reaches the LLM." |
| Model Router | "Intelligent routing" | "Simple request? Cheapest model. Complex? Best model. You pay the right price every time." |
| Analytics | "Real-time dashboard" | "See exactly which project, which user, which model is burning your budget." |
| Webhooks | "Push events" | "Budget alert in Slack before you hit 80%. Not after the invoice." |
| RBAC | "Role-based access" | "Your team sees what they need. Nothing more. Audit trail for 90 days." |

## Bilingual Equivalents (EN → FR)

| EN | FR |
|---|---|
| `See your savings — free` | `Voir vos économies — gratuit` |
| `How it works in 90s` | `Comment ça marche en 90s` |
| `Start saving — no card needed` | `Démarrer — Sans carte requise` |
| `Compare plans` | `Comparer les offres` |
| `npm install @gatectr/sdk` | _(keep as-is — technical term)_ |
| `View docs` | `Voir la documentation` |
| `Connect your first LLM` | `Connecter votre premier LLM` |
| `Import existing key` | `Importer une clé existante` |
| `Upgrade to Pro` | `Passer à Pro` |
| `Adjust limits` | `Ajuster les limites` |
| `Set up your first project` | `Configurer votre premier projet` |
| `Skip for now` | `Passer pour l'instant` |
| `Book a technical call` | `Réserver un appel technique` |
| `Download overview PDF` | `Télécharger le PDF` |
| `See your token savings` | `Voir vos économies de tokens` |
| `View full report` | `Voir le rapport complet` |
| `Pause my plan` | `Mettre en pause` |
| `Talk to support` | `Contacter le support` |
| `Run through GateCtr` | `Passer par GateCtr` |

## Anti-patterns

```
❌ "Get started today!"          → ✅ "See your savings — free"
❌ "Click here to learn more"    → ✅ "How it works in 90s"
❌ "Cancel my subscription"      → ✅ "Pause my plan"
❌ "Submit"                      → ✅ "Set up your first project"
❌ "Confirm"                     → ✅ "Upgrade to Pro" / "Delete project"
❌ "Yes, continue"               → ✅ state the actual action
❌ "The only tool that..."       → ✅ specific combination claim
❌ "Revolutionary AI platform"   → ✅ "Up to 40% fewer tokens. One endpoint swap."
```
