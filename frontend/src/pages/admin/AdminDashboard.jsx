import { useEffect, useState } from 'react'
import { getDashboard, listAllProducts, updateProductStatus } from '../../api/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState(null)

  function refreshProducts() {
    listAllProducts().then((res) => setProducts(res.data))
  }

  useEffect(() => {
    getDashboard().then(setStats)
    refreshProducts()
  }, [])

  async function changeStatus(product, status) {
    await updateProductStatus(product.id, status)
    refreshProducts()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold text-brand-600">admin</h1>

      {stats && (
        <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Customers" value={stats.total_customers} icon="fa-users" />
          <Stat label="Sellers" value={stats.total_sellers} icon="fa-store" />
          <Stat label="Published" value={stats.published_products} icon="fa-ring" />
          <Stat label="Orders" value={stats.total_orders} icon="fa-box" />
        </div>
      )}

      <h2 className="mt-12 font-display text-2xl font-semibold text-brand-700">all listings</h2>
      {!products ? (
        <p className="mt-4 text-brand-400">Loading...</p>
      ) : (
        <div className="surface r-organic mt-5 divide-y divide-line/60 overflow-hidden">
          {products.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-[8rem] flex-1">
                <p className="font-display font-semibold text-brand-800">{product.title}</p>
                <p className="text-sm text-wood/70">by {product.seller?.name}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  product.status === 'published'
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-gold-100 text-gold-500'
                }`}
              >
                {product.status}
              </span>
              <button
                onClick={() => changeStatus(product, product.status === 'published' ? 'draft' : 'published')}
                className="text-sm font-medium text-brand-600 transition hover:text-gold-500"
              >
                {product.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon }) {
  return (
    <div className="surface r-organic p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400">
      <i aria-hidden="true" className={`fa-solid ${icon} text-lg text-gold-400`} />
      <p className="mt-2 font-display text-3xl font-semibold text-brand-700">{value}</p>
      <p className="text-sm text-wood/70">{label}</p>
    </div>
  )
}
