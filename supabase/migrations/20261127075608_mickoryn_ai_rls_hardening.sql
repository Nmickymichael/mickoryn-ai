drop policy if exists "Users manage own messages" on public.ai_messages;
create policy "Users manage own conversation messages" on public.ai_messages
for all to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "Users read own agent runs" on public.ai_agent_runs;
create policy "Users read own agent runs" on public.ai_agent_runs
for select to authenticated
using (
  (select auth.uid()) = user_id
  and (
    conversation_id is null
    or exists (
      select 1 from public.ai_conversations c
      where c.id = ai_agent_runs.conversation_id
        and c.user_id = (select auth.uid())
    )
  )
);
