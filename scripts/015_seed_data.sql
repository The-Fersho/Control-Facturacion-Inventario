-- Insert default company
insert into public.companies (name, rfc, address, phone, email)
values ('Mi Empresa', 'XAXX010101000', 'Dirección de la empresa', '555-1234', 'contacto@miempresa.com')
on conflict do nothing;

-- Insert default branch
insert into public.branches (name, address, phone, manager)
values ('Sucursal Principal', 'Dirección principal', '555-5678', 'Gerente General')
on conflict do nothing;

-- Insert default categories
insert into public.categories (name, description)
values 
  ('Electrónica', 'Productos electrónicos'),
  ('Ropa', 'Prendas de vestir'),
  ('Alimentos', 'Productos alimenticios'),
  ('Hogar', 'Artículos para el hogar')
on conflict do nothing;
