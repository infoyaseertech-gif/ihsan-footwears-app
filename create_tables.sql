-- IHSAN FOOTWEARS TABLES
create table if not exists ihsan_sales (
  id text primary key, item text, qty numeric, price numeric, cost numeric,
  total_cost numeric, total numeric, payment text, customer text, phone text,
  note text, part_paid numeric default 0, stock_item_id text,
  created_at timestamptz default now()
);
create table if not exists ihsan_expenses (
  id text primary key, desc text, cat text, amount numeric, payment text,
  note text, created_at timestamptz default now()
);
create table if not exists ihsan_stock (
  id text primary key, name text, brand text, cat text, size text, colour text,
  qty numeric default 0, buy numeric, sell numeric, image text,
  created_at timestamptz default now()
);
create table if not exists ihsan_restocks (
  id text primary key, item text, qty numeric, cost numeric, supplier text,
  note text, created_at timestamptz default now()
);
create table if not exists ihsan_credits (
  id text primary key, name text, phone text, item text, total numeric,
  paid numeric default 0, balance numeric, due date, note text,
  payments jsonb default '[]', created_at timestamptz default now()
);
create table if not exists ihsan_customers (
  id text primary key, name text, phone text, address text, note text,
  created_at timestamptz default now()
);
create table if not exists ihsan_suppliers (
  id text primary key, name text, phone text, items text, location text,
  note text, created_at timestamptz default now()
);

-- POULTRY TABLES
create table if not exists ihsan_p_flocks (
  id text primary key, name text, type text, count numeric, current_count numeric,
  age text, purchase_date date, cost numeric, supplier text, pen text, note text,
  mortality_log jsonb default '[]', created_at timestamptz default now()
);
create table if not exists ihsan_p_eggs (
  id text primary key, flock_id text, flock_name text, count numeric,
  bad_eggs numeric default 0, good_eggs numeric, collection_time text,
  note text, created_at timestamptz default now()
);
create table if not exists ihsan_p_feed (
  id text primary key, flock_id text, flock_name text, type text, qty numeric,
  cost numeric, supplier text, note text, created_at timestamptz default now()
);
create table if not exists ihsan_p_health (
  id text primary key, flock_id text, flock_name text, type text, description text,
  birds_affected numeric, cost numeric, status text, vet text, note text,
  created_at timestamptz default now()
);
create table if not exists ihsan_p_psales (
  id text primary key, flock_id text, flock_name text, type text, qty numeric,
  price numeric, total numeric, payment text, buyer text, phone text, note text,
  created_at timestamptz default now()
);
create table if not exists ihsan_p_pexpenses (
  id text primary key, description text, cat text, amount numeric,
  flock_id text, flock_name text, note text, created_at timestamptz default now()
);

-- Enable Row Level Security but allow all for anon key
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

-- Allow full access via anon key
create policy "allow all" on ihsan_sales for all using (true) with check (true);
create policy "allow all" on ihsan_expenses for all using (true) with check (true);
create policy "allow all" on ihsan_stock for all using (true) with check (true);
create policy "allow all" on ihsan_restocks for all using (true) with check (true);
create policy "allow all" on ihsan_credits for all using (true) with check (true);
create policy "allow all" on ihsan_customers for all using (true) with check (true);
create policy "allow all" on ihsan_suppliers for all using (true) with check (true);
create policy "allow all" on ihsan_p_flocks for all using (true) with check (true);
create policy "allow all" on ihsan_p_eggs for all using (true) with check (true);
create policy "allow all" on ihsan_p_feed for all using (true) with check (true);
create policy "allow all" on ihsan_p_health for all using (true) with check (true);
create policy "allow all" on ihsan_p_psales for all using (true) with check (true);
create policy "allow all" on ihsan_p_pexpenses for all using (true) with check (true);
