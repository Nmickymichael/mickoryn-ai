-- MICKORYN AI core schema. Apply to a dedicated Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.ai_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Africa/Nairobi',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  agent text check (agent is null or agent in ('jarvis','machine','samaritan','edith','zola')),
  provider text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory text not null,
  category text not null default 'general',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  agent text not null check (agent in ('jarvis','machine','samaritan','edith','zola')),
  provider text not null,
  status text not null check (status in ('completed','failed','blocked')),
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);
create index if not exists ai_memories_user_approved_idx on public.ai_memories(user_id, approved, created_at desc);
create index if not exists ai_agent_runs_user_created_idx on public.ai_agent_runs(user_id, created_at desc);

alter table public.ai_profiles enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_memories enable row level security;
alter table public.ai_agent_runs enable row level security;
alter table public.ai_audit_logs enable row level security;

create policy "Users manage own AI profile" on public.ai_profiles for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage own conversations" on public.ai_conversations for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage own messages" on public.ai_messages for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage own memories" on public.ai_memories for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users read own agent runs" on public.ai_agent_runs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users read own audit logs" on public.ai_audit_logs for select to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.ai_profiles, public.ai_conversations, public.ai_messages, public.ai_memories to authenticated;
create policy "Users create own audit logs" on public.ai_audit_logs for insert to authenticated
with check ((select auth.uid()) = user_id);

grant select on public.ai_agent_runs to authenticated;
grant select, insert on public.ai_audit_logs to authenticated;


-- Foreign-key and account timeline indexes added after advisor review.
create index if not exists ai_messages_user_created_idx on public.ai_messages(user_id, created_at desc);
create index if not exists ai_agent_runs_conversation_idx on public.ai_agent_runs(conversation_id);
create index if not exists ai_audit_logs_user_created_idx on public.ai_audit_logs(user_id, created_at desc);
