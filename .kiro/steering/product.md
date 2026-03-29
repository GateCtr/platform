---
inclusion: always
---

# Product Overview

GateCtr is AI Cost Infrastructure for LLM API calls. One endpoint swap. Full control.

## Category

**AI Cost Infrastructure** — not "LLM Gateway", not "AI Platform".

## Positioning

**Tagline:** One gateway. Every LLM.
**Primary promise:** Up to 40% fewer tokens on your LLM bill. From the first call. Without changing a line of code.
**Value prop:** GateCtr compresses every prompt, routes to the cheapest model, and blocks requests before they exceed your budget.

GateCtr sits between your app and LLM providers (OpenAI, Anthropic, Mistral, Gemini). It optimizes, routes, and enforces budgets — transparently.

## Target Users

**Primary:** Solo devs and startups paying $50–200/mo in LLM tokens. They're overpaying. They know it. They don't have time to configure complex gateways.

**Secondary:** Engineering teams and CTOs managing AI infrastructure costs at scale.

They don't want to change their code. They want results.

## Problems Solved

- Unpredictable LLM invoices → Budget Firewall with hard caps (blocks before the LLM call)
- Wasted tokens on bloated prompts → Context Optimizer (up to 40% fewer tokens, measured on every call)
- Wrong model for the job → Model Router (cheapest model that gets the job done)
- No visibility → Real-time token analytics per request, per project, per model
- API key exposure → AES encryption, multi-tenant isolation, zero data retention
- No alerts → Webhooks to Slack, Teams, ERP, BI tools before you hit the cap

## Core Features

- **Budget Firewall** — Hard caps + soft alerts per project/user. Blocks before the LLM call. No surprise invoices.
- **Context Optimizer** — Prompt compression. Up to 40% fewer tokens. Same output quality. Measured on every call.
- **Model Router** — Routes to the cheapest model that gets the job done. Cost + latency scoring.
- **Analytics Dashboard** — Token usage, costs, trends. Real-time. Per request, per project, per model.
- **Security Layer** — AES encryption, TLS, multi-tenant isolation. Zero data retention. Your API key stays yours.
- **Webhooks Engine** — Push events to Slack, Teams, ERP, BI tools. Budget alerts before you hit 80%.
- **RBAC** — Role-based access for teams and enterprise. Audit trail 90 days.

## Integration

Swap your endpoint URL. Keep your existing API keys. Setup in 5 min via SDK (Node.js, Python) or REST API. Zero code changes required.

## Billing Model

- GateCtr takes **zero commission on tokens** — you pay your LLM provider directly
- GateCtr charges a flat subscription for the control layer
- This is a key differentiator vs OpenRouter (5.5% platform fee)
- Always communicate: "You pay OpenAI. We charge for the control layer."
