-- Ejecutar una sola vez en el SQL Editor de Supabase
-- Agrega el campo customer_email a la tabla orders

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Vista para el panel admin del storefront
-- Muestra órdenes con sus artículos, productos y estado
CREATE OR REPLACE VIEW storefront_orders_view AS
SELECT
  o.id,
  o.created_at,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.status,
  o.payment_method,
  o.subtotal,
  o.discount_amount,
  o.total,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'order_item_id', oi.id,
      'inventory_id',  oi.inventory_id,
      'quantity',      oi.quantity,
      'price_at_sale', oi.price_at_sale,
      'product_name',  fid.product_name,
      'brand',         fid.brand,
      'color',         fid.color,
      'size',          fid.size,
      'sku',           fid.sku,
      'product_image', fid.product_image
    ) ORDER BY oi.id
  ) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN full_inventory_details fid ON fid.inventory_id = oi.inventory_id
WHERE o.payment_method = 'stripe'
GROUP BY o.id
ORDER BY o.created_at DESC;
