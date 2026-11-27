create index if not exists ai_messages_user_created_idx on public.ai_messages(user_id, created_at desc);
create index if not exists ai_agent_runs_conversation_idx on public.ai_agent_runs(conversation_id);
create index if not exists ai_audit_logs_user_created_idx on public.ai_audit_logs(user_id, created_at desc);
