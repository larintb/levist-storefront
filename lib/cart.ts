'use client'

import type { CartItem } from '@/types/product'

const CART_KEY = 'levist_cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart()
  const existing = cart.find((i) => i.inventory_id === item.inventory_id)
  if (existing) {
    // No superar el stock real
    existing.quantity = Math.min(existing.quantity + item.quantity, existing.stock)
  } else {
    cart.push({ ...item, quantity: Math.min(item.quantity, item.stock) })
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(inventory_id: string): CartItem[] {
  const cart = getCart().filter((i) => i.inventory_id !== inventory_id)
  saveCart(cart)
  return cart
}

export function updateQuantity(inventory_id: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeFromCart(inventory_id)
  const cart = getCart()
  const item = cart.find((i) => i.inventory_id === inventory_id)
  if (item) {
    // Respetar el stock máximo
    item.quantity = Math.min(quantity, item.stock)
    saveCart(cart)
  }
  return cart
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}
