-- ================================================
-- IHSAN BUSINESS APP - Complete Database Setup
-- Paste this entire script in Supabase SQL Editor
-- ================================================

-- Drop existing tables if any (clean start)
drop table if exists ihsan_sales cascade;
drop table if exists ihsan_expenses cascade;
drop table if exists ihsan_stock cascade;
drop table if exists ihsan_restocks cascade;
drop table if exists ihsan_credits cascade;
drop table if exists ihsan_customers cascade;
drop table if exists ihsan_suppliers cascade;
drop table if exists ihsan_p_flocks cascade;
drop table if exists ihsan_p_eggs cascade;
drop table if exists ihsan_p_feed cascade;
drop table if exists ihsan_p_health cascade;
drop table if exists ihsan_p_psales cascade;
drop table if exists ihsan_p_pexpenses cascade;

-- ================================================
-- FOOTWEAR TABLES
-- ================================================

create table ihsan_sales (
  id text primary key,
  item text,
  qty numeric default 1,
  price numeric default 0,
  cost numeric default 0,
  total_cost numeric default 0,
  total numeric default 0,
  payment text default 'cash',
  customer text,
  phone text,
  note text,
  part_paid numeric default 0,
  stock_item_id text,
  created_at timestamptz default now()
);

create table ihsan_expenses (
  id text primary key,
  description text,
  cat text,
  amount numeric default 0,
  payment text default 'cash',
  note text,
  created_at timestamptz default now()
);

create table ihsan_stock (
  id text primary key,
  name text,
  brand text,
  cat text,
  size text,
  colour text,
  qty numeric default 0,
  buy numeric default 0,
  sell numeric default 0,
  image text,
  created_at timestamptz default now()
);

create table ihsan_restocks (
  id text primary key,
  item text,
  qty numeric default 0,
  cost numeric default 0,
  supplier text,
  note text,
  created_at timestamptz default now()
);

create table ihsan_credits (
  id text primary key,
  name text,
  phone text,
  item text,
  total numeric default 0,
  paid numeric default 0,
  balance numeric default 0,
  due date,
  note text,
  payments jsonb default '[]',
  created_at timestamptz default now()
);

create table ihsan_customers (
  id text primary key,
  name text,
  phone text,
  address text,
  note text,
  created_at timestamptz default now()
);

create table ihsan_suppliers (
  id text primary key,
  name text,
  phone text,
  items text,
  location text,
  note text,
  created_at timestamptz default now()
);

-- ================================================
-- POULTRY TABLES
-- ================================================

create table ihsan_p_flocks (
  id text primary key,
  name text,
  type text,
  count numeric default 0,
  current_count numeric default 0,
  age text,
  purchase_date date,
  cost numeric default 0,
  supplier text,
  pen text,
  note text,
  mortality_log jsonb default '[]',
  created_at timestamptz default now()
);

create table ihsan_p_eggs (
  id text primary key,
  flock_id text,
  flock_name text,
  count numeric default 0,
  bad_eggs numeric default 0,
  good_eggs numeric default 0,
  collection_time text,
  note text,
  created_at timestamptz default now()
);

create table ihsan_p_feed (
  id text primary key,
  flock_id text,
  flock_name text,
  type text,
  qty numeric default 0,
  cost numeric default 0,
  supplier text,
  note text,
  created_at timestamptz default now()
);

create table ihsan_p_health (
  id text primary key,
  flock_id text,
  flock_name text,
  type text,
  description text,
  birds_affected numeric default 0,
  cost numeric default 0,
  status text,
  vet text,
  note text,
  created_at timestamptz default now()
);

create table ihsan_p_psales (
  id text primary key,
  flock_id text,
  flock_name text,
  type text,
  qty numeric default 0,
  price numeric default 0,
  total numeric default 0,
  payment text default 'cash',
  buyer text,
  phone text,
  note text,
  created_at timestamptz default now()
);

create table ihsan_p_pexpenses (
  id text primary key,
  description text,
  cat text,
  amount numeric default 0,
  flock_id text,
  flock_name text,
  note text,
  created_at timestamptz default now()
);

-- ================================================
-- ROW LEVEL SECURITY - Allow all access via anon key
-- ================================================

alter table ihsan_sales enable row level security;
alter table ihsan_expenses enable row level security;
alter table ihsan_stock enable row level security;
alter table ihsan_restocks enable row level security;
alter table ihsan_credits enable row level security;
alter table ihsan_customers enable row level security;
alter table ihsan_suppliers enable row level security;
alter table ihsan_p_flocks enable row level security;
alter table ihsan_p_eggs enable row level security;
alter table ihsan_p_feed enable row level security;
alter table ihsan_p_health enable row level security;
alter table ihsan_p_psales enable row level security;
alter table ihsan_p_pexpenses enable row level security;

create policy "public access" on ihsan_sales for all to anon using (true) with check (true);
create policy "public access" on ihsan_expenses for all to anon using (true) with check (true);
create policy "public access" on ihsan_stock for all to anon using (true) with check (true);
create policy "public access" on ihsan_restocks for all to anon using (true) with check (true);
create policy "public access" on ihsan_credits for all to anon using (true) with check (true);
create policy "public access" on ihsan_customers for all to anon using (true) with check (true);
create policy "public access" on ihsan_suppliers for all to anon using (true) with check (true);
create policy "public access" on ihsan_p_flocks for all to anon using (true) with check (true);
create policy "public access" on ihsan_p_eggs for all to anon using (true) with check (true);
create policy "public access" on ihsan_p_feed for all to anon using (true) with check (true);
create policy "public access" on ihsan_p_health for all to anon using (true) with check (true);
create policy "public access" on ihsan_p_psales for all to anon using (true) with check (true);
create policy "public access" on ihsan_p_pexpenses for all to anon using (true) with check (true);

-- Done! All 13 tables created successfully.
select 'IHSAN database setup complete!' as status;
