-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.categories enable row level security;

-- RLS Policies
create policy "All users can view categories"
  on public.categories for select
  using (auth.uid() is not null);

create policy "Admins and managers can insert categories"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Admins and managers can update categories"
  on public.categories for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Only admins can delete categories"
  on public.categories for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
