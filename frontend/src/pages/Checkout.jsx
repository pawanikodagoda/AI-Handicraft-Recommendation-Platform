import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, placeOrder } from '../api/shop'
import { useAuth } from '../context/AuthContext'

export default function Checkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [form, setForm] = useState({
    payment_method: 'cod',
    shipping_name: user?.name || '',
    shipping_phone: user?.phone || '',
    shipping_address: user?.address || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCart().then(setCart)
  }, [])

  const items = cart?.items || []
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const order = await placeOrder(form)
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place your order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (cart && items.length === 0) {
    return <p className="mx-auto max-w-2xl px-4 py-10 text-brand-500">Your cart is empty.</p>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold text-brand-800 capitalize tracking-wide">Checkout</h1>

      <form onSubmit={handleSubmit} className="surface r-organic mt-7 space-y-5 p-7">
        <div>
          <label htmlFor="checkout-name" className="mb-1.5 block text-sm font-medium text-brand-800">
            Full name
          </label>
          <input
            id="checkout-name"
            required
            value={form.shipping_name}
            onChange={(e) => setForm({ ...form, shipping_name: e.target.value })}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="checkout-phone" className="mb-1.5 block text-sm font-medium text-brand-800">
            Phone
          </label>
          <input
            id="checkout-phone"
            required
            value={form.shipping_phone}
            onChange={(e) => setForm({ ...form, shipping_phone: e.target.value })}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="checkout-address" className="mb-1.5 block text-sm font-medium text-brand-800">
            Delivery address
          </label>
          <textarea
            id="checkout-address"
            required
            rows={3}
            value={form.shipping_address}
            onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
            className="field"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">Payment method</label>
          <div className="flex gap-3">
            {[
              ['cod', 'Cash on delivery', 'fa-money-bill-wave'],
              ['bank_transfer', 'Bank transfer', 'fa-building-columns'],
            ].map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, payment_method: value })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition ${
                  form.payment_method === value
                    ? 'border-gold-400 bg-gold-100/50 font-semibold text-brand-700'
                    : 'border-line text-wood/80 hover:bg-white/60'
                }`}
              >
                <i aria-hidden="true" className={`fa-solid ${icon} mr-1.5`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-sand p-5 text-brand-800">
          <p className="flex justify-between text-sm">
            <span>{items.length} item(s)</span>
            <span>LKR {total.toLocaleString()}</span>
          </p>
          <p className="mt-2 flex justify-between font-display text-lg font-semibold">
            <span>Total</span>
            <span className="text-gold-500">LKR {total.toLocaleString()}</span>
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading || items.length === 0} className="btn-primary w-full">
          <i aria-hidden="true" className="fa-solid fa-circle-check" />
          {loading ? 'Placing order...' : 'Place order'}
        </button>
      </form>
    </div>
  )
}
