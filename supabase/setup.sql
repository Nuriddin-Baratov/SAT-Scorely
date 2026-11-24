-- Supabase sozlamasi (bir marta yoki o'zgarganda: node scripts/supabase-setup.mjs). Qayta bajarish xavfsiz.
-- Sayt bazaga faqat serverdan (postgres roli) kiradi. Brauzerdagi ochiq (anon) kalit bilan jadvallarni
-- O'QIB HAM, YOZIB HAM bo'lmaydi; u faqat "ma'lumot o'zgardi" degan bo'sh signallarni tinglaydi.

-- 1. Himoya: barcha jadvallarda RLS yoqiq, siyosat yo'q (anon/authenticated uchun yopiq)
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- 2. Signallar: mazmunsiz, faqat mavzu nomi. Xato bo'lsa ham asosiy yozuv buzilmaydi.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.signal(topic text, event text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send('{}'::jsonb, event, topic, true);
exception when others then
  raise warning 'realtime signal failed: %', sqlerrm;
end $$;

create or replace function private.signal_teachers(student text) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select distinct c.teacher_id
    from public.class_members m join public.classes c on c.id = m.class_id
    where m.user_id = student
  loop
    perform private.signal('teacher:' || r.teacher_id, 'members');
  end loop;
end $$;

create or replace function private.on_user_data() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform private.signal('leaderboard', 'changed');
    return null;
  end if;
  perform private.signal('user:' || new.user_id, 'data');
  if tg_op = 'INSERT'
     or (new.xp, new.streak, new.accuracy, new.questions) is distinct from (old.xp, old.streak, old.accuracy, old.questions) then
    perform private.signal('leaderboard', 'changed');
    perform private.signal_teachers(new.user_id);
  end if;
  return null;
end $$;

create or replace function private.on_users() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.signal('leaderboard', 'changed');
  if tg_op = 'UPDATE' then
    perform private.signal('user:' || new.id, 'session');
    perform private.signal_teachers(new.id);
  end if;
  return null;
end $$;

create or replace function private.on_class_members() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  cid text := case when tg_op = 'DELETE' then old.class_id else new.class_id end;
  teacher text;
begin
  select c.teacher_id into teacher from public.classes c where c.id = cid;
  if teacher is not null then
    perform private.signal('teacher:' || teacher, 'members');
  end if;
  return null;
end $$;

create or replace function private.on_telegram_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.signal('user:' || case when tg_op = 'DELETE' then old.user_id else new.user_id end, 'session');
  return null;
end $$;

revoke all on all functions in schema private from public, anon, authenticated;

drop trigger if exists scorely_user_data on public.user_data;
create trigger scorely_user_data after insert or update or delete on public.user_data
  for each row execute function private.on_user_data();
drop trigger if exists scorely_users on public.users;
create trigger scorely_users after insert or update of name, public_profile, role or delete on public.users
  for each row execute function private.on_users();
drop trigger if exists scorely_class_members on public.class_members;
create trigger scorely_class_members after insert or delete on public.class_members
  for each row execute function private.on_class_members();
drop trigger if exists scorely_telegram_links on public.telegram_links;
create trigger scorely_telegram_links after update of chat_id, daily_enabled or delete on public.telegram_links
  for each row execute function private.on_telegram_links();

-- 3. Kanallar: anon faqat TINGLAY oladi. INSERT siyosati yo'q — brauzerdan soxta signal yuborib bo'lmaydi.
drop policy if exists "scorely listen" on realtime.messages;
create policy "scorely listen" on realtime.messages for select to anon, authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) ~ '^(leaderboard|(user|teacher):[A-Za-z0-9_-]{8,64})$'
  );
