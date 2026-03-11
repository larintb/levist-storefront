export interface OrderInsert {
  customer_name: string
  customer_phone: string
  payment_method: string
  status: string
  subtotal: number
  discount_amount: number
  total: number
  user_id?: string | null
  school_id?: string | null
}

export interface OrderItemInsert {
  order_id: string
  inventory_id: string
  quantity: number
  price_at_sale: number
}

export interface CheckoutFormData {
  customer_name: string
  customer_phone: string
}
