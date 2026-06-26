-- ===================================================================
-- THE MAKHANA - Supabase schema (run once in Supabase > SQL Editor)
-- Creates: profiles + orders, auto-profile trigger, and Row Level
-- Security so each customer sees only their own data.
-- ===================================================================

-- ---------- PROFILES (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  email      text,
  phone      text,
  address    text,
  city       text,
  state      text,
  pincode    text,
  created_at timestamptz default now()
);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,
  order_no       text,
  items          jsonb,            -- [{id,name,qty,price}]
  subtotal       numeric,
  shipping       numeric,
  total          numeric,
  payment_method text,             -- 'cod' | 'online'
  payment_id     text,             -- razorpay payment id (online)
  status         text default 'placed',
  -- snapshot of contact + address at order time
  name    text,
  phone   text,
  email   text,
  address text,
  created_at timestamptz default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_idx  on public.orders(created_at desc);

-- ---------- Auto-create a profile row on signup ----------
-- Reads the name/phone/address passed in auth signUp options.data
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, address, city, state, pincode)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'pincode'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.orders   enable row level security;

-- profiles: a user can read/insert/update only their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- orders: a user can read/insert only their own orders
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

-- NOTE: The brand/admin views all customers + orders from the Supabase
-- Dashboard (Table Editor), which uses the service role and bypasses RLS.
-- No admin policy is needed here, keeping customer data private by default.
