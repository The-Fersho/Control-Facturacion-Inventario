-- Create branches table
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  manager text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.branches enable row level security;

-- RLS Policies
create policy "All users can view branches"
  on public.branches for select
  using (auth.uid() is not null);

create policy "Only admins can insert branches"
  on public.branches for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can update branches"
  on public.branches for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can delete branches"
  on public.branches for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
