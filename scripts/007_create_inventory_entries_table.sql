-- Create inventory entries table
create table if not exists public.inventory_entries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null,
  cost decimal(10, 2),
  notes text,
  user_id uuid not null references public.users(id),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.inventory_entries enable row level security;

-- RLS Policies
create policy "All users can view inventory entries"
  on public.inventory_entries for select
  using (auth.uid() is not null);

create policy "Admins and managers can insert inventory entries"
  on public.inventory_entries for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );
