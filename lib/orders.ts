'use server'

import { createServiceClient } from './supabase'
import type { CartItem } from '@/types/product'
import type { OrderInsert } from '@/types/order'

export async function createOrder(
  formData: { customer_name: string; customer_phone: string },
  cart: CartItem[],
  stripeSessionId?: string
): Promise<{ orderId: string | null; error: string | null }> {
  const client = createServiceClient()

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const orderPayload: OrderInsert = {
    customer_name: formData.customer_name,
    customer_phone: formData.customer_phone,
    payment_method: stripeSessionId ? 'stripe' : 'pending',
    status: stripeSessionId ? 'paid' : 'pending',
    subtotal,
    discount_amount: 0,
    total: subtotal,
    user_id: null,
    school_id: null,
  }

  const { data: order, error: orderError } = await client
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Order insert error:', orderError)
    return { orderId: null, error: orderError?.message ?? 'Failed to create order' }
  }

  const orderId = order.id

  const orderItems = cart.map((item) => ({
    order_id: orderId,
    inventory_id: item.inventory_id,
    quantity: item.quantity,
    price_at_sale: item.price,
  }))

  const { error: itemsError } = await client.from('order_items').insert(orderItems)

  if (itemsError) {
    console.error('Order items insert error:', itemsError)
    return { orderId: null, error: itemsError.message }
  }

  // Reduce inventory stock
  for (const item of cart) {
    await client.rpc('decrement_stock', {
      p_inventory_id: item.inventory_id,
      p_quantity: item.quantity,
    })
  }

  return { orderId, error: null }
}

export async function finalizeOrderAfterPayment(
  stripeSessionId: string,
  cart: CartItem[],
  customerName: string,
  customerPhone: string
): Promise<{ orderId: string | null; error: string | null }> {
  return createOrder(
    { customer_name: customerName, customer_phone: customerPhone },
    cart,
    stripeSessionId
  )
}
