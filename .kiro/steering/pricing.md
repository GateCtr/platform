---
inclusion: always
---

# GateCtr — Pricing & Plans

## Billing Model

GateCtr adopts a hybrid SaaS model. The user pays their LLM provider directly — GateCtr monetizes the value-add (optimization, control, analytics), not the tokens themselves.

> GateCtr takes **zero commission on tokens**. You pay OpenAI, Anthropic, etc. directly with your own API key. GateCtr charges only for the control layer.

This is a key differentiator vs OpenRouter (5.5% platform fee). Always communicate it.

## Plans

### Free — $0/mo
- Up to 50K tokens/month
- 1 project
- Budget Firewall
- Basic analytics
- 1 webhook
- REST API + SDK
- Community support

### Pro — $29/mo
- Up to 2M tokens/month
- 5 projects
- Context Optimizer (avg $80–120/mo savings on tokens)
- Basic Model Router
- Advanced analytics
- Unlimited webhooks
- Email support

### Team — $99/mo
- Up to 10M tokens/month
- Unlimited projects
- RBAC — Admin, Manager, Dev, Viewer
- Team dashboard
- Audit logs 90 days
- Advanced Model Router
- Priority support

### Enterprise — Custom
- Unlimited tokens
- 99.9% SLA guaranteed
- Dedicated / on-prem deploy
- SSO / SAML
- Unlimited audit logs
- ERP/BI integrations
- Customer success manager

## Plan Hierarchy

`Free` < `Pro` < `Team` < `Enterprise`

- Free features available on all plans
- Pro features require Pro or above
- Team features require Team or above
- Enterprise is exclusive to Enterprise plan

## Additional Billing Models

| Model | Description | Segment |
|---|---|---|
| Monthly subscription | Platform access based on chosen plan | All plans |
| Usage-based add-on | Billed per 10M tokens routed beyond plan limit | Pro & Team |
| Additional seats | $15/user/month for extra team members | Team |
| Premium onboarding | Setup and integration session with our technical team | Enterprise |

Note: "Savings sharing" has been removed from public pricing — it creates confusion with token commission. Do not mention it in UI or marketing copy.

## Pricing Copy Rules

- Always remind that GateCtr does NOT charge on tokens — it's the key differentiator
- Free plan is the primary acquisition lever — lead with Budget Firewall + Analytics
- Pro upsell: triggered when Free user hits limit → surface Context Optimizer + Model Router
- Team upsell: triggered when Pro user adds a second user → surface RBAC + Audit Logs
- Enterprise upsell: triggered by on-prem requirement or 50+ users
- Never say "Free forever" — use "Free plan" or "Start free"
- Always show price ex-tax with "custom" for Enterprise
- ROI anchor for Pro: "At $29/mo, the average customer saves $80–120/mo on token costs alone."
- Annual toggle: offer ~17% discount (2 months free) — communicate as "Annual — save 17%"

## Pricing Messaging by Context

| Context | EN | FR |
|---|---|---|
| Hero / CTA | "Start free — No card needed" | "Démarrer — Sans carte requise" |
| Pricing headline | "Pay for control. Not for tokens." | "Payez pour le contrôle. Pas pour les tokens." |
| Free plan | "Everything you need to start. $0." | "Tout ce qu'il faut pour démarrer. $0." |
| Pro upsell | "Upgrade to Pro — up to 40% fewer tokens" | "Passer à Pro — jusqu'à 40% de tokens en moins" |
| ROI anchor | "Pro at $29/mo. Average token savings: $80–120/mo. ROI positive from day one." | "Pro à $29/mois. Économies tokens moyennes : $80–120/mois. ROI positif dès le premier jour." |
| Enterprise | "Book a technical call" | "Réserver un appel technique" |
| Billing philosophy | "You pay OpenAI. We charge for the control layer." | "Vous payez OpenAI. Nous facturons la couche de contrôle." |

## Reference Data (source: config/product.ts)

| Plan | Price | Token limit | Projects | Webhooks |
|---|---|---|---|---|
| Free | $0 | 50K/mo | 1 | 1 |
| Pro | $29/mo | 2M/mo | 5 | Unlimited |
| Team | $99/mo | 10M/mo | Unlimited | Unlimited |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

These values are the source of truth — always read from `config/product.ts` in code.
