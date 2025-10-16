-- Create sale items table
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  price decimal(10, 2) not null,
  subtotal decimal(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.sale_items enable row level security;

-- RLS Policies
create policy "All users can view sale items"
  on public.sale_items for select
  using (auth.uid() is not null);

create policy "All authenticated users can insert sale items"
  on public.sale_items for insert
  with check (auth.uid() is not null);
