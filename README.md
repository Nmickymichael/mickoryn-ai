# MICKORYN AI

**One Intelligence. Multiple Minds. One Mission.**

MICKORYN AI is a modular, privacy-conscious personal intelligence platform inspired by JARVIS, The Machine, Samaritan, E.D.I.T.H. and ZOLA.

## Live backend configuration

- Supabase project: `mickoryn-ai` (`sxirojgbtcmwwiywbbqr`)
- Region: `eu-west-1`
- Core schema: applied; six tables with Row Level Security
- Edge Function: `assistant-chat`, deployed with JWT verification
- Frontend: React + TypeScript + Vite; Supabase Auth, per-user conversations and message persistence
- AI provider: demo mode until an OpenAI API key is configured server-side

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The frontend includes safe public Supabase URL and publishable-key defaults for this dedicated project. Override them with environment variables if needed.

## Enable real model reasoning

The Edge Function currently runs in demo mode. To enable OpenAI, add these secrets in Supabase Dashboard → Edge Functions → Secrets:

- `AI_PROVIDER=openai`
- `OPENAI_API_KEY=<your API key>`
- `OPENAI_MODEL=gpt-4.1-mini` (optional; this is the default)

The OpenAI API is billed separately from a ChatGPT subscription. Never put the API key in frontend environment variables or GitHub.

## Five specialist engines

- **JARVIS** — conversational assistant and personal workflows
- **THE MACHINE** — patterns and anomalies in user-authorized data
- **SAMARITAN** — strategic scenarios, risk analysis and forecasting
- **E.D.I.T.H.** — authorized integrations and action orchestration
- **ZOLA** — predictive analytics and trends

Specialist names currently represent bounded routing/instruction profiles, not five independently trained models or autonomous agents.

## Security principles

- Supabase Auth for user identity
- Row Level Security on all user-data tables
- User-scoped conversations, messages and memories
- Server-side AI credentials only
- Explicit approval before consequential external actions
- No covert surveillance or autonomous weapons control
- OpenAI Responses requests use `store: false`

## Current limitations

This is an early working foundation, not a finished autonomous platform. Integrations, long-term memory retrieval, agent-specific tools, rate limiting, automated tests, deployment and a full security review remain on the roadmap. Voice input/output depends on browser support.
