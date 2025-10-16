-- Create cashiers table
create table if not exists public.cashiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  branch_id uuid references public.branches(id) on delete set null,
  initial_amount decimal(10, 2) default 0,
  status text not null check (status in ('abierta', 'cerrada')) default 'cerrada',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.cashiers enable row level security;

-- RLS Policies
create policy "All users can view cashiers"
  on public.cashiers for select
  using (auth.uid() is not null);

create policy "Admins and managers can insert cashiers"
  on public.cashiers for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Admins and managers can update cashiers"
  on public.cashiers for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'gerente')
    )
  );

create policy "Only admins can delete cashiers"
  on public.cashiers for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
