-- Create companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rfc text,
  address text,
  phone text,
  email text,
  logo text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.companies enable row level security;

-- RLS Policies - All authenticated users can view, only admins can modify
create policy "All users can view companies"
  on public.companies for select
  using (auth.uid() is not null);

create policy "Only admins can insert companies"
  on public.companies for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can update companies"
  on public.companies for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
