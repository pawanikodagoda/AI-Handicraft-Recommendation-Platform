import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProduct, listMyProducts, updateProduct } from '../../api/products'

export default function SellerDashboard() {
  const [products, setProducts] = useState(null)

  function refresh() {
    listMyProducts().then((res) => setProducts(res.data))
  }

  useEffect(refresh, [])

  async function toggleStatus(product) {
    const formData = new FormData()
    formData.append('status', product.status === 'published' ? 'draft' : 'published')
    await updateProduct(product.id, formData)
    refresh()
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.title}"? This can't be undone.`)) return
    await deleteProduct(product.id)
    refresh()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold text-brand-800 capitalize tracking-wide">My Shop</h1>
        <Link to="/seller/products/new" className="btn-primary">
          <i aria-hidden="true" className="fa-solid fa-plus" /> Add product
        </Link>
      </div>

      {!products ? (
        <p className="mt-8 text-brand-400">Loading...</p>
      ) : products.length === 0 ? (
        <div className="surface r-organic mt-8 p-12 text-center">
          <i aria-hidden="true" className="fa-solid fa-store text-4xl text-brand-200" />
          <p className="mt-4 text-wood/80">You haven't listed anything yet.</p>
          <Link to="/seller/products/new" className="btn-primary mt-5">
            <i aria-hidden="true" className="fa-solid fa-plus" /> Add your first product
          </Link>
        </div>
      ) : (
        <div className="surface r-organic mt-8 divide-y divide-line/60 overflow-hidden">
          {products.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center gap-4 p-5">
              {product.image_urls?.[0] ? (
                <img
                  src={product.image_urls[0]}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl bg-sand object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-sand text-brand-300">
                  <i aria-hidden="true" className="fa-regular fa-image text-lg" />
                  <span className="mt-0.5 text-[9px]">no photo</span>
                </div>
              )}
              <div className="min-w-[8rem] flex-1">
                <p className="font-display font-semibold text-brand-800">{product.title}</p>
                <p className="text-sm text-wood/70">
                  LKR {Number(product.price).toLocaleString()} · stock {product.stock}
                </p>
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
              <Link
                to={`/seller/products/${product.id}/edit`}
                className="text-sm font-medium text-brand-600 transition hover:text-gold-500"
              >
                <i aria-hidden="true" className="fa-solid fa-pen-to-square mr-1" /> Edit
              </Link>
              <button
                onClick={() => toggleStatus(product)}
                className="text-sm font-medium text-brand-600 transition hover:text-gold-500"
              >
                {product.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={() => handleDelete(product)}
                className="text-sm font-medium text-red-500 transition hover:underline"
              >
                <i aria-hidden="true" className="fa-solid fa-trash-can" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
