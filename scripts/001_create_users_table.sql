-- Create users profile table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'cajero', 'gerente')),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- RLS Policies
create policy "Users can view all users"
  on public.users for select
  using (true);

create policy "Only admins can insert users"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can update users"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can delete users"
  on public.users for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
