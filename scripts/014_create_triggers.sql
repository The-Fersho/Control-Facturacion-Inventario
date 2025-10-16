-- Trigger to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'role', 'cajero')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Trigger to update product stock on inventory entry
create or replace function public.update_stock_on_entry()
returns trigger
language plpgsql
as $$
begin
  update public.products
  set stock = stock + new.quantity,
      updated_at = now()
  where id = new.product_id;
  return new;
end;
$$;

create trigger on_inventory_entry_created
  after insert on public.inventory_entries
  for each row
  execute function public.update_stock_on_entry();

-- Trigger to update product stock on inventory exit
create or replace function public.update_stock_on_exit()
returns trigger
language plpgsql
as $$
begin
  update public.products
  set stock = stock - new.quantity,
      updated_at = now()
  where id = new.product_id;
  return new;
end;
$$;

create trigger on_inventory_exit_created
  after insert on public.inventory_exits
  for each row
  execute function public.update_stock_on_exit();

-- Trigger to update client credit on credit creation
create or replace function public.update_client_credit_on_credit()
returns trigger
language plpgsql
as $$
begin
  update public.clients
  set current_credit = current_credit + new.total_amount
  where id = new.client_id;
  return new;
end;
$$;

create trigger on_credit_created
  after insert on public.credits
  for each row
  execute function public.update_client_credit_on_credit();

-- Trigger to update credit and client on payment
create or replace function public.update_credit_on_payment()
returns trigger
language plpgsql
as $$
declare
  v_credit_balance decimal(10, 2);
  v_client_id uuid;
begin
  -- Update credit
  update public.credits
  set paid_amount = paid_amount + new.amount,
      balance = balance - new.amount,
      status = case
        when balance - new.amount <= 0 then 'pagado'
        else status
      end
  where id = new.credit_id
  returning balance, client_id into v_credit_balance, v_client_id;
  
  -- Update client current credit
  update public.clients
  set current_credit = current_credit - new.amount
  where id = v_client_id;
  
  return new;
end;
$$;

create trigger on_payment_created
  after insert on public.payments
  for each row
  execute function public.update_credit_on_payment();
