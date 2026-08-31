import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  const image = product.image_urls?.[0]

  return (
    <Link
      to={`/products/${product.slug}`}
      className="surface r-organic group flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-gold-400 hover:shadow-2xl active:scale-[0.98]"
    >
      <div className="aspect-square w-full overflow-hidden bg-sand">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-200">
            <i aria-hidden="true" className="fa-solid fa-ring text-3xl" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-display text-base font-semibold text-brand-800">
          {product.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {product.colors?.slice(0, 3).map((c) => (
            <span key={c.id} className="chip !px-2.5 !py-0.5 !text-[11px]">
              {c.name}
            </span>
          ))}
        </div>

        <p className="mt-auto pt-1 font-semibold text-brand-600">
          LKR {Number(product.price).toLocaleString()}
        </p>
      </div>
    </Link>
  )
}
