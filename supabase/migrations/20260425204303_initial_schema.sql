-- Phase 1 MVP schema
-- Auth is fully managed by Supabase Auth (auth.users).
-- We mirror tier + stripe data in a public profiles table.

-- ─── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ─── Profiles ──────────────────────────────────────────────────────────────
-- One row per auth.users entry; created by trigger on sign-up.
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  tier             text not null default 'free' check (tier in ('free','pro','team')),
  stripe_customer_id text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner_all" on public.profiles
  for all using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Notebooks ─────────────────────────────────────────────────────────────
create table public.notebooks (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null default 'Untitled Notebook',
  youtube_url  text,
  status       text not null default 'pending'
                 check (status in ('pending','processing','ready','failed')),
  shared_token text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index notebooks_user_id_idx on public.notebooks(user_id);

alter table public.notebooks enable row level security;

create policy "notebooks_owner_all" on public.notebooks
  for all using (auth.uid() = user_id);

create policy "notebooks_shared_read" on public.notebooks
  for select using (shared_token is not null);

-- ─── Sources ───────────────────────────────────────────────────────────────
create table public.sources (
  id                   uuid primary key default uuid_generate_v4(),
  notebook_id          uuid not null references public.notebooks(id) on delete cascade,
  kind                 text not null check (kind in ('youtube_url','upload_video','upload_pdf','url','note')),
  url                  text,
  r2_key               text,
  duration_seconds     integer,
  language             text default 'en',
  status               text not null default 'pending'
                         check (status in ('pending','processing','ready','failed')),
  gemini_response_json jsonb,
  created_at           timestamptz not null default now()
);

create index sources_notebook_id_idx on public.sources(notebook_id);

alter table public.sources enable row level security;

create policy "sources_notebook_owner_all" on public.sources
  for all using (
    exists (
      select 1 from public.notebooks
      where notebooks.id = sources.notebook_id
        and notebooks.user_id = auth.uid()
    )
  );

create policy "sources_shared_read" on public.sources
  for select using (
    exists (
      select 1 from public.notebooks
      where notebooks.id = sources.notebook_id
        and notebooks.shared_token is not null
    )
  );

-- ─── Artifacts ─────────────────────────────────────────────────────────────
create table public.artifacts (
  id           uuid primary key default uuid_generate_v4(),
  notebook_id  uuid not null references public.notebooks(id) on delete cascade,
  source_id    uuid references public.sources(id) on delete set null,
  kind         text not null check (kind in (
                 'summary','detailed','mind_map','slide_deck','code_pack',
                 'diagram_pack','audio_overview','video_overview','recall_pack',
                 'action_list','short_clips','critical_viewing'
               )),
  status       text not null default 'pending'
                 check (status in ('pending','processing','ready','failed')),
  payload_json jsonb,
  r2_keys      jsonb,
  tier_used    text default 'free' check (tier_used in ('free','pro')),
  cost_cents   integer default 0,
  created_at   timestamptz not null default now()
);

create index artifacts_notebook_id_idx on public.artifacts(notebook_id);

alter table public.artifacts enable row level security;

create policy "artifacts_notebook_owner_all" on public.artifacts
  for all using (
    exists (
      select 1 from public.notebooks
      where notebooks.id = artifacts.notebook_id
        and notebooks.user_id = auth.uid()
    )
  );

create policy "artifacts_shared_read" on public.artifacts
  for select using (
    exists (
      select 1 from public.notebooks
      where notebooks.id = artifacts.notebook_id
        and notebooks.shared_token is not null
    )
  );

-- ─── Chunks (pgvector) ─────────────────────────────────────────────────────
create table public.chunks (
  id          uuid primary key default uuid_generate_v4(),
  source_id   uuid not null references public.sources(id) on delete cascade,
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  content     text not null,
  embedding   vector(768),
  start_sec   integer,
  page_num    integer,
  created_at  timestamptz not null default now()
);

create index chunks_notebook_id_idx on public.chunks(notebook_id);
create index chunks_embedding_idx on public.chunks
  using hnsw (embedding vector_cosine_ops);

alter table public.chunks enable row level security;

create policy "chunks_notebook_owner_all" on public.chunks
  for all using (
    exists (
      select 1 from public.notebooks
      where notebooks.id = chunks.notebook_id
        and notebooks.user_id = auth.uid()
    )
  );

-- ─── Usage meter ───────────────────────────────────────────────────────────
create table public.usage_meter (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  event         text not null check (event in (
                  'video_processed','artifact_generated','export','clip_export'
                )),
  video_minutes numeric,
  cost_cents    integer default 0,
  created_at    timestamptz not null default now()
);

create index usage_meter_user_id_idx on public.usage_meter(user_id);

alter table public.usage_meter enable row level security;

create policy "usage_owner_all" on public.usage_meter
  for all using (auth.uid() = user_id);

-- ─── updated_at helper ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notebooks_updated_at before update on public.notebooks
  for each row execute procedure public.set_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
