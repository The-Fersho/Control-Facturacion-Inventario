-- Create products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text unique,
  category_id uuid references public.categories(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  price decimal(10, 2) not null,
  cost decimal(10, 2),
  stock integer not null default 0,
  min_stock integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.products enable row level security;

-- RLS Policies
create policy "All users can view products"
  on public.products for select
  using (auth.uid() is not null);

create policy "Admins and managers can insert products"
  on public.products for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Admins and managers can update products"
  on public.products for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Only admins can delete products"
  on public.products for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
