-- Create sales table
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  user_id uuid not null references public.users(id),
  cashier_id uuid references public.cashiers(id) on delete set null,
  subtotal decimal(10, 2) not null,
  discount decimal(10, 2) default 0,
  iva decimal(10, 2) default 0,
  total decimal(10, 2) not null,
  payment_method text not null check (payment_method in ('efectivo', 'tarjeta', 'transferencia', 'credito')),
  status text not null check (status in ('completada', 'cancelada')) default 'completada',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.sales enable row level security;

-- RLS Policies
create policy "All users can view sales"
  on public.sales for select
  using (auth.uid() is not null);

create policy "All authenticated users can insert sales"
  on public.sales for insert
  with check (auth.uid() is not null);

create policy "Admins and managers can update sales"
  on public.sales for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );
