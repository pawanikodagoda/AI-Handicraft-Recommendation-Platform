import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listCategories, listFilters, listProducts } from '../api/products'
import ProductCard from '../components/ProductCard'

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [facets, setFacets] = useState({ materials: [], colors: [], price_min: 0, price_max: 0 })
  const [result, setResult] = useState({ data: [], current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)

  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const materials = searchParams.getAll('materials')
  const colors = searchParams.getAll('colors')
  const priceMin = searchParams.get('price_min') || ''
  const priceMax = searchParams.get('price_max') || ''
  const sort = searchParams.get('sort') || 'latest'
  const page = Number(searchParams.get('page') || 1)

  const [minDraft, setMinDraft] = useState(priceMin)
  const [maxDraft, setMaxDraft] = useState(priceMax)

  useEffect(() => setMinDraft(priceMin), [priceMin])
  useEffect(() => setMaxDraft(priceMax), [priceMax])

  const activeCount =
    materials.length + colors.length + (category ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (q ? 1 : 0)

  useEffect(() => {
    listCategories().then(setCategories)
    listFilters().then(setFacets)
  }, [])

  useEffect(() => {
    setLoading(true)
    listProducts({ q, category, materials, colors, price_min: priceMin, price_max: priceMax, sort, page })
      .then(setResult)
      .finally(() => setLoading(false))
  }, [q, category, materials.join(','), colors.join(','), priceMin, priceMax, sort, page])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function toggleMulti(key, value) {
    const next = new URLSearchParams(searchParams)
    const current = next.getAll(key)
    next.delete(key)
    if (current.includes(value)) {
      current.filter((v) => v !== value).forEach((v) => next.append(key, v))
    } else {
      ;[...current, value].forEach((v) => next.append(key, v))
    }
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(p) {
    const next = new URLSearchParams(searchParams)
    next.set('page', p)
    setSearchParams(next)
  }

  function applyPriceRange() {
    const next = new URLSearchParams(searchParams)
    // Swap reversed bounds rather than silently returning nothing.
    let min = minDraft === '' ? null : Number(minDraft)
    let max = maxDraft === '' ? null : Number(maxDraft)
    if (min !== null && max !== null && min > max) [min, max] = [max, min]

    if (min === null || Number.isNaN(min)) next.delete('price_min')
    else next.set('price_min', String(min))
    if (max === null || Number.isNaN(max)) next.delete('price_max')
    else next.set('price_max', String(max))

    next.delete('page')
    setSearchParams(next)
  }

  function clearFilters() {
    setMinDraft('')
    setMaxDraft('')
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 font-display text-4xl font-semibold text-brand-600">the shop</h1>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <i aria-hidden="true" className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-brand-300" />
          <input
            type="search"
            placeholder="Search bracelets, bangles..."
            defaultValue={q}
            onKeyDown={(e) => e.key === 'Enter' && updateParam('q', e.target.value)}
            className="field !pl-10 text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="field !w-auto text-sm"
        >
          <option value="latest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[230px_1fr]">
        <aside className="surface r-organic h-fit space-y-6 p-5">
          <div>
            <h3 className="mb-2.5 font-display text-lg font-semibold text-brand-700">Category</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => updateParam('category', '')} className={!category ? 'chip-active' : 'chip'}>
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateParam('category', c.slug)}
                  className={category === c.slug ? 'chip-active' : 'chip'}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {facets.materials.length > 0 && (
            <div>
              <h3 className="mb-2.5 font-display text-lg font-semibold text-brand-700">Material</h3>
              <div className="flex flex-wrap gap-2">
                {facets.materials.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleMulti('materials', m)}
                    className={materials.includes(m) ? 'chip-active' : 'chip'}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {facets.colors.length > 0 && (
            <div>
              <h3 className="mb-2.5 font-display text-lg font-semibold text-brand-700">Colour</h3>
              <div className="flex flex-wrap gap-2">
                {facets.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleMulti('colors', c)}
                    className={colors.includes(c) ? 'chip-active' : 'chip'}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2.5 font-display text-lg font-semibold text-brand-700">Price (LKR)</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                aria-label="Minimum price"
                placeholder={facets.price_min ? String(Math.floor(facets.price_min)) : 'Min'}
                value={minDraft}
                onChange={(e) => setMinDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                className="field min-w-0 !py-1.5 text-sm"
              />
              <span className="text-brand-300">–</span>
              <input
                type="number"
                min="0"
                aria-label="Maximum price"
                placeholder={facets.price_max ? String(Math.ceil(facets.price_max)) : 'Max'}
                value={maxDraft}
                onChange={(e) => setMaxDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                className="field min-w-0 !py-1.5 text-sm"
              />
            </div>
            <button onClick={applyPriceRange} className="btn-primary mt-3 w-full !py-2 text-xs">
              Apply price
            </button>
          </div>

          {activeCount > 0 && (
            <button onClick={clearFilters} className="btn-outline w-full !py-2 text-xs">
              <i aria-hidden="true" className="fa-solid fa-xmark" /> Clear all ({activeCount})
            </button>
          )}
        </aside>

        <div>
          {loading ? (
            <p className="text-brand-400">Loading...</p>
          ) : result.data.length === 0 ? (
            <div className="surface r-organic p-10 text-center">
              <i aria-hidden="true" className="fa-regular fa-face-frown text-3xl text-brand-300" />
              <p className="mt-3 text-wood/80">No products match your filters.</p>
              {activeCount > 0 && (
                <button onClick={clearFilters} className="mt-4 font-semibold text-gold-500 hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-wood/70">
                {result.total} product{result.total === 1 ? '' : 's'} found
              </p>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {result.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {result.last_page > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className="btn-outline !px-4 !py-2 text-sm"
                  >
                    <i aria-hidden="true" className="fa-solid fa-arrow-left" /> Previous
                  </button>
                  <span className="text-sm text-wood/70">
                    Page {result.current_page} of {result.last_page}
                  </span>
                  <button
                    disabled={page >= result.last_page}
                    onClick={() => goToPage(page + 1)}
                    className="btn-outline !px-4 !py-2 text-sm"
                  >
                    Next <i aria-hidden="true" className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
