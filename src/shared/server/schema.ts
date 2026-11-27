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
  `create table if not exists certificates (
    code text primary key,
    user_id text not null references users(id) on delete cascade,
    event_id text not null,
    name text not null,
    correct integer not null,
    total integer not null,
    scores jsonb not null,
    issued_at timestamptz not null default now(),
    unique (user_id, event_id)
  )`,
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
  `create table if not exists ai_usage (
    user_id text not null references users(id) on delete cascade,
    day text not null,
    count integer not null default 0,
    primary key (user_id, day)
  )`,
  // To'lov buyurtmalari (Payme / Click). `seq` — Click'ga raqamli identifikator kerak
  `create table if not exists orders (
    id text primary key,
    seq bigserial unique,
    user_id text not null references users(id) on delete cascade,
    provider text not null check (provider in ('payme', 'click')),
    amount integer not null,
    months integer not null default 1,
    status text not null default 'new' check (status in ('new', 'paid', 'cancelled')),
    ext_id text,
    pay_state integer,
    create_time bigint,
    perform_time bigint,
    cancel_time bigint,
    cancel_reason integer,
    created_at timestamptz not null default now()
  )`,
  `create unique index if not exists orders_provider_ext_idx on orders(provider, ext_id) where ext_id is not null`,
  `create index if not exists orders_user_idx on orders(user_id, created_at desc)`,
];

/**
 * Eski bazalarga keyin qo'shilgan ustunlar. ALTER har ishga tushishda jadvalni bloklamasligi uchun
 * avval `information_schema` orqali tekshiriladi, faqat yo'q bo'lsa bajariladi.
 */
export const COLUMNS: { table: string; column: string; sql: string }[] = [
  { table: "user_data", column: "version", sql: "alter table user_data add column if not exists version integer not null default 0" },
  { table: "users", column: "plan", sql: "alter table users add column if not exists plan text not null default 'free'" },
  { table: "users", column: "plan_until", sql: "alter table users add column if not exists plan_until timestamptz" },
];

export const COLUMN_CHECK =
  "select 1 as ok from information_schema.columns where table_schema = current_schema() and table_name = $1 and column_name = $2";
