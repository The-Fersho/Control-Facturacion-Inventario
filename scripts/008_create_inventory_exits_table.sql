-- Create inventory exits table
create table if not exists public.inventory_exits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null,
  reason text,
  notes text,
  user_id uuid not null references public.users(id),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.inventory_exits enable row level security;

-- RLS Policies
create policy "All users can view inventory exits"
  on public.inventory_exits for select
  using (auth.uid() is not null);

create policy "Admins and managers can insert inventory exits"
  on public.inventory_exits for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );
