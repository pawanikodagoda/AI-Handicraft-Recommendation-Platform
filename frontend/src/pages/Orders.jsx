import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrder, listOrders } from '../api/shop'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function OrderList() {
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    listOrders().then((res) => setOrders(res.data))
  }, [])

  if (!orders) return <p className="mx-auto max-w-4xl px-4 py-10 text-brand-400">Loading...</p>

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold text-brand-800 capitalize tracking-wide">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="surface r-organic mt-8 p-12 text-center">
          <i aria-hidden="true" className="fa-solid fa-box-open text-4xl text-brand-200" />
          <p className="mt-4 text-wood/80">No orders yet.</p>
          <Link to="/products" className="btn-primary mt-5">
            <i aria-hidden="true" className="fa-solid fa-store" /> Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="surface r-organic flex items-center justify-between p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400 hover:shadow-[var(--shadow-lift)]"
            >
              <div>
                <p className="font-display font-semibold text-brand-800">Order #{order.id}</p>
                <p className="text-sm text-wood/70">
                  {order.items.length} item(s) · LKR {Number(order.total).toLocaleString()}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    getOrder(id).then(setOrder)
  }, [id])

  if (!order) return <p className="mx-auto max-w-4xl px-4 py-10 text-brand-400">Loading...</p>

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/orders" className="text-sm font-medium text-wood/70 hover:text-gold-500">
        <i aria-hidden="true" className="fa-solid fa-arrow-left mr-1.5" /> Back to orders
      </Link>

      <div className="mt-5 flex items-center justify-between">
        <h1 className="font-display text-4xl font-semibold text-brand-600">Order #{order.id}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="surface r-organic mt-7 divide-y divide-line/60 overflow-hidden">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-5">
            <div>
              <p className="font-display font-semibold text-brand-800">{item.product_title}</p>
              <p className="text-sm text-wood/70">Qty {item.quantity}</p>
            </div>
            <p className="font-semibold text-brand-700">
              LKR {(Number(item.price) * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
        <div className="flex justify-between bg-sand/60 p-5 font-display text-lg font-semibold text-brand-800">
          <span>Total</span>
          <span className="text-gold-500">LKR {Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      <div className="surface r-organic mt-6 p-6 text-sm text-wood/85">
        <p className="font-display text-base font-semibold text-brand-700">
          <i aria-hidden="true" className="fa-solid fa-truck mr-2 text-gold-400" />
          Delivery details
        </p>
        <p className="mt-2">{order.shipping_name}</p>
        <p>{order.shipping_phone}</p>
        <p>{order.shipping_address}</p>
        <p className="mt-2 capitalize">Payment: {order.payment_method.replace('_', ' ')}</p>
      </div>
    </div>
  )
}
