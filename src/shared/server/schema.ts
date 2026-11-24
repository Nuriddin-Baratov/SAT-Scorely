/** Ma'lumotlar bazasi sxemasi. Har bir ishga tushishda xavfsiz qayta bajariladi. */
export const SCHEMA = [
  `create table if not exists users (
    id text primary key,
    email text unique not null,
    name text not null,
    password_hash text not null,
    role text not null default 'student' check (role in ('student', 'teacher')),
    public_profile boolean not null default true,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists sessions (
    token_hash text primary key,
    user_id text not null references users(id) on delete cascade,
    expires_at timestamptz not null
  )`,
  `create index if not exists sessions_user_idx on sessions(user_id)`,
  `create table if not exists user_data (
    user_id text primary key references users(id) on delete cascade,
    snapshot jsonb not null,
    xp integer not null default 0,
    streak integer not null default 0,
    accuracy real,
    questions integer not null default 0,
    weak_domain text,
    last_active text,
    updated_at timestamptz not null default now(),
    version integer not null default 0
  )`,
  `create table if not exists xp_daily (
    user_id text not null references users(id) on delete cascade,
    day text not null,
    xp integer not null,
    primary key (user_id, day)
  )`,
  `create table if not exists xp_events (
    user_id text not null references users(id) on delete cascade,
    event_id text not null,
    kind text not null,
    ref text not null,
    dedupe text,
    xp integer not null check (xp >= 0),
    correct integer,
    total integer,
    mastered boolean not null default false,
    detail jsonb,
    day text not null,
    awarded_on text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, event_id)
  )`,
  `create unique index if not exists xp_events_dedupe_idx on xp_events(user_id, dedupe) where dedupe is not null`,
  `create index if not exists xp_events_day_idx on xp_events(user_id, awarded_on)`,
  `create table if not exists classes (
    id text primary key,
    teacher_id text not null references users(id) on delete cascade,
    name text not null,
    code text unique not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists class_members (
    class_id text not null references classes(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (class_id, user_id)
  )`,
  `create table if not exists telegram_links (
    user_id text primary key references users(id) on delete cascade,
    chat_id bigint unique,
    link_code text unique,
    code_expires_at timestamptz,
    locale text not null default 'uz',
    daily_enabled boolean not null default true,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists telegram_answers (
    chat_id bigint not null,
    day text not null,
    question_id text not null,
    correct boolean not null,
    primary key (chat_id, day)
  )`,
];
