-- Run this once in your Supabase SQL editor.
-- This function is called by the storefront webhook to reduce inventory after a paid order.

CREATE OR REPLACE FUNCTION decrement_stock(p_inventory_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory
  SET stock = GREATEST(stock - p_quantity, 0)
  WHERE id = p_inventory_id;
END;
$$;
