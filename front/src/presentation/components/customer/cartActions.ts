interface CartProduct {
  id: string
  name: string
  price: number
  img: string
}

interface StoredCartItem extends CartProduct {
  quantity: number
}

const CART_KEY = 'checobarber-cart'

function isStoredCartItem(value: unknown): value is StoredCartItem {
  if (!value || typeof value !== 'object') return false
  return 'id' in value
    && typeof value.id === 'string'
    && 'name' in value
    && typeof value.name === 'string'
    && 'price' in value
    && typeof value.price === 'number'
    && 'img' in value
    && typeof value.img === 'string'
    && 'quantity' in value
    && typeof value.quantity === 'number'
}

function addProduct(button: HTMLButtonElement): void {
  const product: CartProduct = {
    id: button.dataset.productId ?? '',
    name: button.dataset.productName ?? '',
    price: Number(button.dataset.productPrice),
    img: button.dataset.productImg ?? '',
  }
  const root = button.closest('[data-cart-action-root]')
  const status = root?.querySelector<HTMLElement>('[data-cart-status]')

  try {
    if (!product.id || !product.name || !Number.isFinite(product.price) || product.price < 0) {
      throw new Error('El producto no tiene datos válidos para agregarse al carrito.')
    }

    const saved = localStorage.getItem(CART_KEY)
    const parsed: unknown = saved ? JSON.parse(saved) : { state: { items: [] } }
    if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) {
      throw new Error('Los datos guardados del carrito no tienen el formato esperado.')
    }
    const state = parsed.state
    if (!state || typeof state !== 'object' || !('items' in state) || !Array.isArray(state.items)
      || !state.items.every(isStoredCartItem)) {
      throw new Error('Los productos guardados en el carrito no tienen el formato esperado.')
    }

    const items = state.items
    const existing = items.find((item) => item.id === product.id)
    const updatedItems = existing
      ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { ...product, quantity: 1 }]

    localStorage.setItem(CART_KEY, JSON.stringify({ state: { ...state, items: updatedItems }, version: 0 }))
    window.dispatchEvent(new Event('checobarber:cart-change'))

    const stockValue = root?.querySelector<HTMLElement>('[data-stock-value]')
    const stockLabel = root?.querySelector<HTMLElement>('[data-stock-label]')
    if (stockValue && stockLabel) {
      const stock = Math.max(0, Number(stockValue.dataset.stockValue) - 1)
      stockValue.dataset.stockValue = String(stock)
      stockValue.textContent = String(stock)
      if (stock > 0) {
        stockLabel.replaceChildren(document.createTextNode('Stock disponible: '), stockValue, document.createTextNode(' unidades'))
      } else {
        stockLabel.textContent = 'Agotado'
      }
      button.disabled = stock === 0
    }

    if (status) status.textContent = 'Producto agregado al carrito.'
  } catch (error) {
    console.error('[carrito] No se pudo agregar el producto.', error)
    if (status) status.textContent = 'No se pudo actualizar el carrito. Intenta de nuevo.'
  }
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest<HTMLButtonElement>('[data-add-to-cart]')
  if (!button || button.disabled) return
  addProduct(button)
})
