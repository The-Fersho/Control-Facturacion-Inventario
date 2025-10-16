-- Create credits table
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  total_amount decimal(10, 2) not null,
  paid_amount decimal(10, 2) default 0,
  balance decimal(10, 2) not null,
  due_date date,
  status text not null check (status in ('pendiente', 'pagado', 'vencido')) default 'pendiente',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.credits enable row level security;

-- RLS Policies
create policy "All users can view credits"
  on public.credits for select
  using (auth.uid() is not null);

create policy "All authenticated users can insert credits"
  on public.credits for insert
  with check (auth.uid() is not null);

create policy "All authenticated users can update credits"
  on public.credits for update
  using (auth.uid() is not null);
