# MICKORYN AI

**One Intelligence. Multiple Minds. One Mission.**

MICKORYN AI is a modular, privacy-conscious personal intelligence platform inspired by JARVIS, The Machine, Samaritan, E.D.I.T.H. and ZOLA.

## Current status

This is the initial central-core scaffold (v0.1). It includes a React + TypeScript dashboard, specialist routing contracts, a demo provider, Supabase schema and an authenticated Edge Function starter. It is not a finished autonomous AI system; specialist capabilities will be added incrementally with permission boundaries and tests.

## Free-first model

- Frontend: Netlify free tier or local development.
- Database/auth: Supabase free tier, subject to current quotas.
- AI: demo mode works without API spending. Real OpenAI API calls require a separately funded API account; a ChatGPT subscription does not include API credits.
- Voice: browser speech APIs where supported.

## Security

RLS, per-user ownership, server-side secrets, scoped integrations, explicit approval for consequential actions, and audit logs. No covert surveillance or autonomous weapons control.

## Roadmap

1. Connect a dedicated Supabase project and apply the migration.
2. Deploy and test the authenticated Edge Function.
3. Add approved memory retrieval.
4. Implement the five bounded specialist modules.
5. Add consent-based integrations and voice improvements.

See `docs/ROADMAP.md` for milestones.