import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProduct } from '../api/products'
import { addToCart, tryOn } from '../api/shop'
import { useAuth } from '../context/AuthContext'
import { compressImage } from '../lib/compressImage'

export default function ProductDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [activeView, setActiveView] = useState('product') // 'product' or 'try-on'
  const [cartMessage, setCartMessage] = useState('')

  const [handFile, setHandFile] = useState(null)
  const [handPreview, setHandPreview] = useState(null)
  const [resultImage, setResultImage] = useState(null)
  const [tryOnError, setTryOnError] = useState('')
  const [tryOnLoading, setTryOnLoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualPoints, setManualPoints] = useState([])
  const imgRef = useRef(null)

  useEffect(() => {
    getProduct(slug).then(setProduct)
  }, [slug])

  if (!product) return (
    <div className="flex h-64 items-center justify-center">
      <p className="font-medium text-brand-400 flex items-center gap-2">
        <i aria-hidden="true" className="fa-solid fa-spinner fa-spin"></i> Loading...
      </p>
    </div>
  )

  async function handleAddToCart() {
    if (!user) return navigate('/login')
    await addToCart({ product_id: product.id, quantity: 1 })
    setCartMessage('Added to cart!')
    setTimeout(() => setCartMessage(''), 3000)
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setTryOnError('Please choose an image file (JPG, PNG, or WebP).')
      return
    }

    setTryOnLoading(true)
    try {
      const optimizedFile = await compressImage(file)
      setHandFile(optimizedFile)
      setHandPreview(URL.createObjectURL(optimizedFile))
      setResultImage(null)
      setTryOnError('')
      setManualMode(false)
      setManualPoints([])
      setActiveView('try-on')
    } catch {
      setTryOnError('This image could not be prepared. Please choose a JPG, PNG, or WebP file.')
    } finally {
      setTryOnLoading(false)
    }
  }

  async function runTryOn(extraPoints) {
    if (!handFile) return
    setTryOnLoading(true)
    setTryOnError('')
    try {
      const formData = new FormData()
      formData.append('product_id', product.id)
      formData.append('hand_image', handFile)
      if (extraPoints) {
        formData.append('wrist_x1', extraPoints[0].x)
        formData.append('wrist_y1', extraPoints[0].y)
        formData.append('wrist_x2', extraPoints[1].x)
        formData.append('wrist_y2', extraPoints[1].y)
        formData.append('force_manual', '1')
      }
      const data = await tryOn(formData)
      setResultImage(`data:image/png;base64,${data.image_base64}`)
      setManualMode(false)
      setActiveView('try-on')
    } catch (err) {
      if (err.response?.status === 422 && !extraPoints) {
        setManualMode(true)
        setTryOnError("Couldn't detect your wrist automatically - please tap both edges of your wrist on the photo to the left.")
      } else {
        setTryOnError('Something went wrong generating the preview. Please try another photo.')
      }
    } finally {
      setTryOnLoading(false)
    }
  }

  function onImageClick(e) {
    if (manualPoints.length >= 2 || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const scaleX = imgRef.current.naturalWidth / rect.width
    const scaleY = imgRef.current.naturalHeight / rect.height
    const point = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
    const next = [...manualPoints, point]
    setManualPoints(next)
    if (next.length === 2) runTryOn(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-16">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-14 items-start">
        
        {/* Left Column: Visual Area (Product Image OR Try-On Preview) */}
        <div className="w-full lg:w-[55%] flex flex-col gap-6">
          
          <div className={`surface r-organic-xl aspect-square w-full overflow-hidden !p-0 shadow-sm relative transition-all duration-500 ${activeView === 'try-on' && handPreview ? 'ring-4 ring-gold-200 shadow-xl' : 'group bg-white/50'}`}>
            {/* Subtle background texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
            
            {/* Try-On Result State */}
            {activeView === 'try-on' && resultImage ? (
               <div className="h-full w-full relative animate-fade-in">
                 <img src={resultImage} alt="Try-on result preview" className="h-full w-full object-cover" />
                 <div className="absolute bottom-4 left-4 bg-brand-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium shadow-sm flex items-center gap-1.5">
                   <i aria-hidden="true" className="fa-solid fa-wand-magic-sparkles text-gold-400"></i> AI Try-On Result
                 </div>
               </div>
            ) : 
            
            /* Try-On Uploaded State (Before Result) */
            activeView === 'try-on' && handPreview ? (
              <div className="h-full w-full relative animate-fade-in flex items-center justify-center bg-brand-50/50">
                <img
                  ref={imgRef}
                  src={handPreview}
                  alt="Your hand"
                  onClick={manualMode ? onImageClick : undefined}
                  className={`h-full w-full object-cover transition-opacity ${tryOnLoading ? 'opacity-50' : 'opacity-100'} ${manualMode ? 'cursor-crosshair' : ''}`}
                />
                {manualPoints.map((p, i) => (
                  <span
                    key={i}
                    className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/80 ring-4 ring-white shadow-xl animate-pulse backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-bold"
                    style={{
                      left: `${(p.x / (imgRef.current?.naturalWidth || 1)) * 100}%`,
                      top: `${(p.y / (imgRef.current?.naturalHeight || 1)) * 100}%`,
                    }}
                  >{i + 1}</span>
                ))}
                {tryOnLoading && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm gap-4">
                      <div className="w-16 h-16 border-4 border-white/50 border-t-gold-500 rounded-full animate-spin shadow-lg"></div>
                      <span className="font-display font-semibold text-brand-900 bg-white/80 px-4 py-1.5 rounded-full shadow-sm text-sm">Applying bracelet...</span>
                   </div>
                )}
                {manualMode && (
                   <div className="absolute top-4 left-0 right-0 flex justify-center">
                      <div className="bg-brand-900/90 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-md animate-bounce">
                        Tap both edges of your wrist ({manualPoints.length}/2)
                      </div>
                   </div>
                )}
              </div>
            ) : 
            
            /* Default Product Image State */
            product.image_urls?.length ? (
              <img 
                src={product.image_urls[activeImage]} 
                alt={product.title} 
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 relative z-10 animate-fade-in" 
              />
            ) : (
              <div className="flex h-full items-center justify-center text-brand-200 relative z-10 animate-fade-in">
                <i aria-hidden="true" className="fa-solid fa-ring text-6xl drop-shadow-sm opacity-50" />
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {(product.image_urls?.length > 1 || handPreview) && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {/* Virtual Try-On Thumbnail */}
              {handPreview && (
                 <button
                   onClick={() => setActiveView('try-on')}
                   className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${activeView === 'try-on' ? 'border-gold-400 shadow-sm scale-95' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-95'}`}
                 >
                   <img src={resultImage || handPreview} alt="Try-on" className="h-full w-full object-cover" />
                   <div className="absolute inset-0 bg-brand-900/20 flex items-end justify-center pb-1 pointer-events-none">
                      <i className="fa-solid fa-wand-magic-sparkles text-white text-[10px] drop-shadow-md"></i>
                   </div>
                 </button>
              )}
              
              {/* Product Thumbnails */}
              {product.image_urls?.map((url, i) => (
                <button
                  key={url}
                  onClick={() => {
                     setActiveImage(i)
                     setActiveView('product')
                  }}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${activeView === 'product' && i === activeImage ? 'border-gold-400 shadow-sm scale-95' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-95'}`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details, Cart, and Compact Try-On Controls */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-28 flex flex-col pb-10">
          
          <h1 className="font-display text-4xl font-semibold text-brand-800 leading-tight">
            {product.title}
          </h1>
          
          <p className="mt-3 text-sm text-wood/70 flex items-center font-medium">
            <span className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center mr-2 text-brand-600">
               <i aria-hidden="true" className="fa-solid fa-hand-holding-heart text-[9px]" />
            </span>
            Crafted by <span className="text-brand-800 ml-1 underline decoration-brand-200 underline-offset-4">{product.seller?.name}</span>
          </p>
          
          <p className="mt-5 font-display text-3xl font-semibold text-gold-600 drop-shadow-sm">
            LKR {Number(product.price).toLocaleString()}
          </p>

          <p className="mt-5 text-[15px] text-wood/80 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              ...(product.colors || []).map((t) => ({ ...t, group: 'color' })),
              ...(product.materials || []).map((t) => ({ ...t, group: 'material' })),
              ...(product.style_tags || []).map((t) => ({ ...t, group: 'style' })),
            ].map((t) => (
              <span key={`${t.group}-${t.id}`} className="chip shadow-sm border-line/60 bg-white !px-3 !py-1 text-xs">
                {t.name}
              </span>
            ))}
          </div>

          {/* Add to Cart Area */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <button 
              onClick={handleAddToCart} 
              disabled={product.stock < 1} 
              className="btn-primary w-full sm:flex-1 !py-3 text-base shadow-md hover:shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <i aria-hidden="true" className="fa-solid fa-basket-shopping" />
                {product.stock < 1 ? 'Out of stock' : 'Add to cart'}
              </span>
            </button>
            
            {cartMessage && (
              <div className="animate-fade-up px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center gap-2 shadow-sm w-full sm:w-auto">
                <i aria-hidden="true" className="fa-solid fa-circle-check text-gold-500" />
                <span className="text-sm font-semibold text-brand-800">{cartMessage}</span>
              </div>
            )}
          </div>

          <hr className="my-8 border-line/50" />

          {/* Compact Virtual Try-On Control Panel */}
          <div className={`rounded-2xl p-6 transition-all duration-500 ${handPreview ? 'bg-gold-50/50 border border-gold-200/60 shadow-inner' : 'bg-brand-50/40 border border-brand-100 shadow-sm hover:shadow-md'}`}>
             <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${handPreview ? 'bg-gold-100 text-gold-600' : 'bg-white text-gold-500'}`}>
                   <i aria-hidden="true" className={`fa-solid fa-wand-magic-sparkles text-lg ${tryOnLoading ? 'animate-pulse' : ''}`}></i>
                </div>
                <div>
                   <h3 className="font-display font-semibold text-brand-800 text-lg">Virtual Try-On</h3>
                   {!handPreview && <p className="text-xs text-wood/70 mt-0.5">See how this looks on your wrist instantly.</p>}
                </div>
             </div>

             {/* Upload Input State */}
             <input
                id="tryon-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileChange}
                disabled={tryOnLoading}
                className="hidden"
              />

             {/* Initial State: Ask for photo */}
             {!handPreview && (
                <label 
                  htmlFor="tryon-upload" 
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-200/80 rounded-xl p-4 bg-white/60 cursor-pointer hover:bg-white hover:border-gold-300 transition-all duration-300 group"
                >
                  <i aria-hidden="true" className="fa-solid fa-camera text-brand-400 group-hover:text-gold-500 transition-colors"></i>
                  <span className="text-sm font-medium text-brand-700">Upload wrist photo</span>
                </label>
             )}

             {/* Photo Uploaded, Pre-Generation State */}
             {handPreview && !resultImage && (
                <div className="flex flex-col gap-4 animate-fade-in">
                   {manualMode ? (
                      <div className="bg-white/80 p-3 rounded-lg border border-brand-100 text-sm text-brand-800 font-medium">
                        <i aria-hidden="true" className="fa-solid fa-hand-pointer text-gold-500 mr-2"></i>
                        Tap the edges of your wrist on the photo to the left to guide the AI.
                      </div>
                   ) : (
                      <button 
                        onClick={() => runTryOn()} 
                        disabled={tryOnLoading} 
                        className="w-full py-3 px-4 bg-brand-800 hover:bg-brand-900 text-cream rounded-xl font-medium text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        {tryOnLoading ? (
                           <><i className="fa-solid fa-circle-notch fa-spin"></i> Generating...</>
                        ) : (
                           <><i className="fa-solid fa-sparkles"></i> Apply Bracelet Now</>
                        )}
                      </button>
                   )}
                </div>
             )}

             {/* Success State */}
             {resultImage && (
                <div className="flex flex-col gap-3 animate-fade-in">
                   <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm font-medium flex items-center gap-2">
                     <i aria-hidden="true" className="fa-solid fa-circle-check"></i>
                     Successfully generated preview!
                   </div>
                </div>
             )}

             {/* Error Message */}
             {tryOnError && (
                <div className="mt-3 bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs font-medium flex items-start gap-2">
                  <i aria-hidden="true" className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                  <span>{tryOnError}</span>
                </div>
             )}

             {/* Reset / Change Photo Action */}
             {handPreview && (
                <div className="mt-4 flex justify-center">
                   <label 
                     htmlFor="tryon-upload" 
                     className={`text-xs font-medium underline-offset-2 hover:underline cursor-pointer ${tryOnLoading ? 'opacity-50 pointer-events-none' : 'text-brand-500 hover:text-brand-800'}`}
                   >
                     Upload a different photo
                   </label>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  )
}
