-- Create payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid not null references public.credits(id) on delete cascade,
  amount decimal(10, 2) not null,
  payment_method text not null check (payment_method in ('efectivo', 'tarjeta', 'transferencia')),
  notes text,
  user_id uuid not null references public.users(id),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.payments enable row level security;

-- RLS Policies
create policy "All users can view payments"
  on public.payments for select
  using (auth.uid() is not null);

create policy "All authenticated users can insert payments"
  on public.payments for insert
  with check (auth.uid() is not null);
