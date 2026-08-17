import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string | null
  slug: string
  max_stock?: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: CartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ storeSlug, children }: { storeSlug: string; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const storageKey = `storecraft:cart:${storeSlug}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      setItems([])
    }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.max_stock ?? Infinity) }
            : i,
        )
      }
      return [...prev, item]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.max_stock ?? Infinity)) }
          : i,
      ),
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((acc, i) => acc + i.quantity, 0)
    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
    return { items, count, subtotal, addItem, updateQuantity, removeItem, clearCart }
  }, [items, addItem, updateQuantity, removeItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
