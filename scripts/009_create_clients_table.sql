-- Create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  rfc text,
  credit_limit decimal(10, 2) default 0,
  current_credit decimal(10, 2) default 0,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.clients enable row level security;

-- RLS Policies
create policy "All users can view clients"
  on public.clients for select
  using (auth.uid() is not null);

create policy "All authenticated users can insert clients"
  on public.clients for insert
  with check (auth.uid() is not null);

create policy "All authenticated users can update clients"
  on public.clients for update
  using (auth.uid() is not null);

create policy "Only admins can delete clients"
  on public.clients for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
