import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, removeCartItem, updateCartItem } from '../api/shop'

export default function Cart() {
  const [cart, setCart] = useState(null)
  const navigate = useNavigate()

  function refresh() {
    getCart().then(setCart)
  }

  useEffect(refresh, [])

  if (!cart) return <p className="mx-auto max-w-4xl px-4 py-10 text-brand-400">Loading...</p>

  const items = cart.items || []
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)

  async function changeQuantity(item, quantity) {
    if (quantity < 1) return
    await updateCartItem(item.id, { quantity })
    refresh()
  }

  async function remove(item) {
    await removeCartItem(item.id)
    refresh()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold text-brand-800 capitalize tracking-wide">Your Cart</h1>

      {items.length === 0 ? (
        <div className="surface r-organic mt-8 p-12 text-center">
          <i aria-hidden="true" className="fa-solid fa-basket-shopping text-4xl text-brand-200" />
          <p className="mt-4 text-wood/80">Your cart is empty.</p>
          <Link to="/products" className="btn-primary mt-5">
            <i aria-hidden="true" className="fa-solid fa-store" /> Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <div className="surface r-organic mt-8 divide-y divide-line/60 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-4 p-5">
                {item.product.image_urls?.[0] ? (
                  <img
                    src={item.product.image_urls[0]}
                    alt={item.product.title}
                    className="h-20 w-20 shrink-0 rounded-xl bg-sand object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-sand text-brand-300">
                    <i aria-hidden="true" className="fa-solid fa-ring text-xl" />
                  </div>
                )}
                <div className="min-w-[8rem] flex-1">
                  <p className="font-display font-semibold text-brand-800">{item.product.title}</p>
                  <p className="text-sm text-wood/70">
                    LKR {Number(item.product.price).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQuantity(item, item.quantity - 1)}
                    className="h-8 w-8 rounded-full border border-line text-brand-600 transition hover:border-gold-400 hover:bg-white"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => changeQuantity(item, item.quantity + 1)}
                    className="h-8 w-8 rounded-full border border-line text-brand-600 transition hover:border-gold-400 hover:bg-white"
                  >
                    +
                  </button>
                </div>
                <p className="w-28 text-right font-semibold text-brand-700">
                  LKR {(Number(item.product.price) * item.quantity).toLocaleString()}
                </p>
                <button
                  onClick={() => remove(item)}
                  className="text-sm text-red-500 transition hover:underline"
                >
                  <i aria-hidden="true" className="fa-solid fa-trash-can" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-2xl font-semibold text-brand-700">
              Total: <span className="text-gold-500">LKR {total.toLocaleString()}</span>
            </p>
            <button onClick={() => navigate('/checkout')} className="btn-primary">
              Checkout <i aria-hidden="true" className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
