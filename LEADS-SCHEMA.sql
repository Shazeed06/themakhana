-- ===================================================================
-- THE MAKHANA — leads table (run once in Supabase > SQL Editor)
-- Captures PARTIAL (typed-but-not-submitted) and COMPLETE (submitted)
-- contact details from the checkout / contact / newsletter forms.
-- Written ONLY by the server (api/lead.js via the service role); the
-- browser can neither read nor write leads directly.
-- ===================================================================
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  lead_key   text unique,           -- per-visitor session id (from the browser)
  name       text,
  phone      text,
  email      text,
  source     text,                  -- 'checkout' | 'contact' | 'newsletter' | 'form'
  page       text,                  -- URL path where it was captured
  status     text default 'partial',-- 'partial' (abandoned) | 'complete' (submitted)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists leads_created_idx on public.leads(created_at desc);
create index if not exists leads_status_idx  on public.leads(status);

-- RLS on, NO client policies -> browser has zero direct access.
-- api/lead.js upserts with the SERVICE ROLE key (bypasses RLS), keyed on
-- lead_key so one visitor = one row that updates as they type / submit.
alter table public.leads enable row level security;
