-- Add missing columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price1 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price2 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price3 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price4 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add missing columns to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS iva_rate NUMERIC DEFAULT 16,
ADD COLUMN IF NOT EXISTS price_names JSONB DEFAULT '{"price1": "Precio General", "price2": "Precio con Descuento", "price3": "Precio Mayorista", "price4": "Precio Mayorista Especial"}'::jsonb;

-- Add missing columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES cashiers(id),
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Add missing columns to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'ticket';

-- Add missing columns to credits table
ALTER TABLE credits
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update RLS policies for new columns
DROP POLICY IF EXISTS "Users can view products" ON products;
CREATE POLICY "Users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins and managers can manage products" ON products;
CREATE POLICY "Admins and managers can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'gerente')
    )
  );
