import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecommendations, getStats, listCategories, listFilters } from '../api/products'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 2000; // 2 seconds
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo for smoother animation
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * value));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <>{count}</>;
}
const FEATURES = [
  {
    icon: 'fa-tags',
    image: '/img/feat-tagging.jpg',
    title: 'gentle AI tagging',
    body: "Sellers just describe their piece — the tags write themselves. No long forms.",
  },
  {
    icon: 'fa-heart',
    image: '/img/feat-feed.jpg',
    title: 'a feed that feels you',
    body: 'Colour, material, style and budget — every scroll feels curated by a friend.',
  },
  {
    icon: 'fa-eye',
    image: '/img/feat-tryon.jpg',
    title: 'see it on your wrist',
    body: 'Upload a photo and preview the piece on your own wrist before you commit.',
  },
  {
    icon: 'fa-hands-holding-circle',
    image: '/img/feat-makers.jpg',
    title: 'local makers, united',
    body: 'Compare, discover and support handmade sellers from all over Sri Lanka.',
  },
]

const STEPS = [
  { num: '01', icon: 'fa-store', title: 'seller joins', body: 'easy move from social pages' },
  { num: '02', icon: 'fa-wand-magic-sparkles', title: 'tag with care', body: 'AI reads the description' },
  { num: '03', icon: 'fa-heart', title: 'personal feed', body: 'your taste profile builds' },
  { num: '04', icon: 'fa-camera-retro', title: 'wrist preview', body: 'photo overlay try-on' },
  { num: '05', icon: 'fa-box-open', title: 'order & enjoy', body: 'cash on delivery or bank' },
]

const CATEGORY_ICONS = { Bracelet: 'fa-ring', Bangle: 'fa-circle-notch', Anklet: 'fa-link' }

const PREMIUM_COLORS = {
  'gold': 'bg-gradient-to-br from-[#FDE047] to-[#EAB308] border-yellow-400',
  'rose gold': 'bg-gradient-to-br from-[#FECDD3] to-[#F43F5E] border-rose-300',
  'silver': 'bg-gradient-to-br from-[#F1F5F9] to-[#94A3B8] border-slate-300',
  'white': 'bg-white border-gray-200',
  'pink': 'bg-gradient-to-br from-[#FBCFE8] to-[#EC4899] border-pink-300',
  'blue': 'bg-gradient-to-br from-[#BAE6FD] to-[#0EA5E9] border-sky-300',
  'black': 'bg-gradient-to-br from-[#334155] to-[#0F172A] border-slate-700',
  'green': 'bg-gradient-to-br from-[#A7F3D0] to-[#10B981] border-emerald-300',
  'red': 'bg-gradient-to-br from-[#FECACA] to-[#EF4444] border-red-300',
  'purple': 'bg-gradient-to-br from-[#E9D5FF] to-[#A855F7] border-purple-300',
}

const PREMIUM_MATERIALS = {
  'crystal': { icon: 'fa-gem', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
  'glass': { icon: 'fa-wine-glass', color: 'text-blue-400', bg: 'bg-blue-50 border-blue-100' },
  'metal': { icon: 'fa-link', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
  'pearl': { icon: 'fa-circle', color: 'text-brand-200', bg: 'bg-white border-brand-100' },
  'rose gold': { icon: 'fa-coins', color: 'text-rose-400', bg: 'bg-rose-50 border-rose-100' },
  'silver': { icon: 'fa-ring', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' },
  'charm': { icon: 'fa-star', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-100' },
  'gold': { icon: 'fa-coins', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-100' },
  'leather': { icon: 'fa-scroll', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
  'beads': { icon: 'fa-braille', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
  'gemstone': { icon: 'fa-gem', color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 border-fuchsia-100' },
}

export default function Home() {
  const { user } = useAuth()
  const [feed, setFeed] = useState({ personalized: false, data: [] })
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [facets, setFacets] = useState({ colors: [], materials: [] })
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    getRecommendations({ per_page: 8 })
      .then(setFeed)
      .finally(() => setLoading(false))
    getStats().then(setStats).catch(() => {})
    listCategories().then(setCategories).catch(() => {})
    listFilters().then(setFacets).catch(() => {})

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const hero = feed.data[0]
  
  // Filter for Bangles and Bracelets only. We check the categories list directly.
  const shownCategories = categories.filter((c) => 
    ['bangle', 'bracelet', 'bangles', 'bracelets'].includes(c.name.toLowerCase())
  )

  const validColors = (facets.colors || []).filter(c => PREMIUM_COLORS[c.toLowerCase()])
  const validMaterials = (facets.materials || []).filter(m => PREMIUM_MATERIALS[m.toLowerCase()])

  return (
    <div>
      {/* ---------------- hero ---------------- */}
      <section className="relative w-full h-[95vh] min-h-[700px] max-h-[1200px] overflow-hidden bg-brand-900 flex flex-col justify-between">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="/img/hero-cinematic.png" 
            alt="CeyCrafts handmade jewelry model" 
            className="w-full h-full object-cover object-top opacity-90 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-brand-900/95 mix-blend-multiply"></div>
        </div>

        {/* Massive Overlay Typography */}
        <div 
          className="relative z-10 w-full flex justify-center pt-12 sm:pt-20 pointer-events-none"
          style={{ 
            transform: `translateY(${scrollY * 0.45}px)`, 
            opacity: Math.max(0, 1 - scrollY / 600) 
          }}
        >
          <div className="animate-title-reveal">
            <h1 className="font-display text-[15vw] sm:text-[140px] md:text-[180px] lg:text-[220px] leading-none font-medium tracking-tighter text-white mix-blend-overlay drop-shadow-2xl">
              CEY<span className="font-light italic opacity-90">CRAFTS</span>
            </h1>
          </div>
        </div>

        {/* Content Container (Bottom/Lower section) */}
        <div className="relative z-20 w-full max-w-4xl mx-auto px-6 pb-16 sm:pb-24 flex flex-col items-center text-center mt-auto animate-fade-up">
          <p className="text-lg sm:text-2xl text-cream/90 font-light mb-10 drop-shadow-lg leading-relaxed max-w-2xl">
            Adorn your wrist with meaning. Exquisite handcrafted bangles and bracelets from the heart of Sri Lanka.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8">
            <Link to="/products" className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/30 text-white px-12 py-4 rounded-full hover:bg-white/20 transition-all duration-500 shadow-lg hover:shadow-2xl hover:-translate-y-1">
              <span className="relative z-10 text-[11px] font-bold tracking-[0.25em] uppercase">Explore Collection</span>
            </Link>
            {user?.role === 'customer' ? (
              <Link to="/onboarding" className="text-[10px] font-bold tracking-[0.2em] uppercase text-cream/80 hover:text-white transition-colors hover:scale-105 transform duration-300">
                Set Your Style
              </Link>
            ) : (
              !user && (
                <Link to="/register" className="text-[10px] font-bold tracking-[0.2em] uppercase text-cream/80 hover:text-white transition-colors hover:scale-105 transform duration-300">
                  Join as Artisan
                </Link>
              )
            )}
          </div>

          {stats && (
            <div className="mt-16 pt-12 border-t border-white/10 w-full max-w-2xl flex flex-wrap justify-center gap-12 sm:gap-24">
              {[
                [stats.products, 'Pieces Listed'],
                [stats.sellers, 'Local Artisans'],
                [stats.categories, 'Collections'],
              ].map(([value, label]) => (
                <div key={label} className="group cursor-default">
                  <p className="font-display text-4xl text-white/90 group-hover:text-gold-400 transition-colors duration-500">
                    <AnimatedCounter value={value} />
                  </p>
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/50 mt-2 group-hover:text-white/80 transition-colors duration-500">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- browse by category ---------------- */}
      {shownCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16">
          <h2 className="mb-8 font-display text-3xl font-semibold text-brand-800 capitalize tracking-wide flex justify-center items-center gap-3">
            <i aria-hidden="true" className="fa-solid fa-layer-group text-gold-500"></i> Shop by Category
          </h2>
          <div className="flex flex-wrap gap-5">
            {shownCategories.map((c) => {
              const inCategory = feed.data.filter((p) => p.category?.id === c.id)
              const sample = inCategory[0]
              return (
                <Link
                  key={c.id}
                  to={`/products?category=${c.slug}`}
                  className="surface r-organic group relative h-48 min-w-[16rem] flex-1 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                >
                  {sample?.image_urls?.[0] && (
                    <img
                      src={sample.image_urls[0]}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 text-cream">
                    <i aria-hidden="true" className={`fa-solid ${CATEGORY_ICONS[c.name] || 'fa-gem'} text-gold-200`} />
                    <p className="mt-1 font-display text-2xl font-semibold">{c.name}s</p>
                    <p className="text-sm text-cream/85">
                      {inCategory.length} {inCategory.length === 1 ? 'piece' : 'pieces'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ---------------- quick filter shortcuts ---------------- */}
      {(validColors.length > 0 || validMaterials.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-16">
          <div className="grid gap-12 sm:grid-cols-2">
            
            {validColors.length > 0 && (
              <div>
                <h2 className="mb-6 font-display text-2xl font-semibold text-brand-800 uppercase tracking-widest flex items-center justify-center gap-3">
                  <i aria-hidden="true" className="fa-solid fa-palette text-gold-500 text-lg"></i> Shop by Colour
                </h2>
                <div className="flex flex-wrap justify-center gap-6 pb-8">
                  {validColors.map((c) => (
                    <Link
                      key={c}
                      to={`/products?colors=${encodeURIComponent(c)}`}
                      className="group relative flex flex-col items-center"
                    >
                      <div className={`w-14 h-14 rounded-full shadow-sm border group-hover:scale-110 group-hover:shadow-md transition-all duration-300 ${PREMIUM_COLORS[c.toLowerCase()]}`}></div>
                      <span className="mt-2.5 text-xs font-semibold text-wood/80 group-hover:text-brand-800 transition-colors whitespace-nowrap">{c}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {validMaterials.length > 0 && (
              <div>
                <h2 className="mb-6 font-display text-2xl font-semibold text-brand-800 uppercase tracking-widest flex items-center justify-center gap-3">
                  <i aria-hidden="true" className="fa-solid fa-layer-group text-gold-500 text-lg"></i> Shop by Material
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {validMaterials.map((m) => {
                    const style = PREMIUM_MATERIALS[m.toLowerCase()]
                    return (
                      <Link
                        key={m}
                        to={`/products?materials=${encodeURIComponent(m)}`}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-brand-100 shadow-sm hover:shadow-md hover:border-gold-300 transition-all duration-300 group w-40"
                      >
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border transition-colors ${style.bg} ${style.color} group-hover:bg-gold-50 group-hover:border-gold-200 group-hover:text-gold-500`}>
                           <i aria-hidden="true" className={`fa-solid ${style.icon}`}></i>
                        </div>
                        <span className="text-sm font-semibold text-brand-800 truncate">{m}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------- feed ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="mb-8 flex flex-col items-center gap-2">
          <h2 className="font-display text-3xl font-semibold text-brand-800 tracking-wide flex justify-center items-center gap-3">
            <i aria-hidden="true" className="fa-solid fa-fire text-gold-500"></i> {feed.personalized ? 'Picked for You' : 'New & Popular'}
          </h2>
          {feed.personalized ? (
            <Link to="/onboarding" className="text-sm font-semibold text-gold-500 hover:underline">
              update your style →
            </Link>
          ) : (
            user?.role === 'customer' && (
              <Link to="/onboarding" className="text-sm font-semibold text-gold-500 hover:underline">
                tell us your style →
              </Link>
            )
          )}
        </div>

        {loading ? (
          <p className="text-brand-400">Loading...</p>
        ) : feed.data.length === 0 ? (
          <p className="text-brand-400">No products yet — check back soon.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {feed.data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/products" className="btn-outline">
                see everything <i aria-hidden="true" className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ---------------- features ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-10 text-center font-display text-4xl font-semibold text-brand-800 capitalize tracking-wide">
          Made for Human Connection
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="surface r-organic group overflow-hidden text-center transition-all duration-400 hover:-translate-y-3 hover:border-gold-400 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="h-32 overflow-hidden">
                <img
                  src={f.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <i
                  aria-hidden="true"
                  className={`fa-solid ${f.icon} text-3xl text-gold-400 transition-transform duration-300 group-hover:scale-120`}
                />
                <h3 className="mt-3 font-display text-xl font-semibold text-brand-800">{f.title}</h3>
                <p className="mt-2 text-sm text-wood/85">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- journey ---------------- */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="r-organic-xl border border-line bg-sand p-10 shadow-[var(--shadow-soft)]">
          <h2 className="mb-12 text-center font-display text-3xl font-semibold text-brand-800 uppercase tracking-widest">
            <i aria-hidden="true" className="fa-solid fa-seedling mr-3 text-gold-500" />
            How It Works
          </h2>

          <div className="flex flex-wrap justify-center gap-5">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="flex-1 basis-40 rounded-3xl border border-line bg-[#fffdf9] p-6 text-center transition-all duration-400 hover:-translate-y-2 hover:border-gold-400 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="font-display text-3xl font-bold text-gold-400">{s.num}</div>
                <i aria-hidden="true" className={`fa-solid ${s.icon} mt-2 text-lg text-brand-500`} />
                <h4 className="mt-2 font-semibold text-brand-800">{s.title}</h4>
                <p className="mt-1 text-xs text-wood/80">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- closing CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="r-organic-lg relative overflow-hidden bg-brand-600 p-12 text-center text-cream shadow-[var(--shadow-lift)]">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gold-400/20 blur-2xl"
          />
          <h2 className="relative font-display text-4xl font-semibold capitalize tracking-wide">
            {user?.role === 'seller' ? 'Ready to List Your Next Piece?' : 'Made Something Beautiful?'}
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-cream/85">
            {user?.role === 'seller'
              ? 'Describe it in your own words and let the tagger do the rest.'
              : 'Join the makers already selling handmade bracelets and bangles here — listing takes minutes.'}
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-4">
            {user?.role === 'seller' ? (
              <Link
                to="/seller/products/new"
                className="btn-outline !border-gold-200 !bg-cream/10 !text-cream hover:!bg-cream/20"
              >
                <i aria-hidden="true" className="fa-solid fa-plus" /> add a product
              </Link>
            ) : (
              <>
                <Link
                  to={user ? '/products' : '/register'}
                  className="btn-outline !border-gold-200 !bg-cream/10 !text-cream hover:!bg-cream/20"
                >
                  <i aria-hidden="true" className="fa-solid fa-store" />
                  {user ? 'keep browsing' : 'start selling'}
                </Link>
                {!user && (
                  <Link
                    to="/products"
                    className="btn-outline !border-cream/30 !bg-transparent !text-cream hover:!bg-cream/10"
                  >
                    just browsing
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
