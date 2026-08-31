import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProduct, getMyProduct, suggestTags, updateProduct } from '../../api/products'
import TagInput from '../../components/TagInput'
import ProductCard from '../../components/ProductCard'
import { compressImage, compressImages } from '../../lib/compressImage'

export default function ProductForm({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [materials, setMaterials] = useState([])
  const [colors, setColors] = useState([])
  const [styleTags, setStyleTags] = useState([])
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [images, setImages] = useState([])

  const [existingImages, setExistingImages] = useState([])
  const [currentStatus, setCurrentStatus] = useState('draft')
  
  // For live preview
  const [previewImageUrl, setPreviewImageUrl] = useState(null)

  const [loading, setLoading] = useState(isEdit)
  const [preparing, setPreparing] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggested, setSuggested] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function uploadError(err) {
    const errors = err.response?.data?.errors
    if (errors) {
      return Object.values(errors).flat().join(' ')
    }

    if (err.response?.status === 413) {
      return 'The selected photo is too large. Please choose a smaller image.'
    }

    return err.response?.data?.message || 'Could not save this product. Please check the form and try again.'
  }

  useEffect(() => {
    if (!isEdit) return
    getMyProduct(id)
      .then((p) => {
        setTitle(p.title)
        setDescription(p.description)
        setCategory(p.category?.name || '')
        setMaterials(p.materials?.map((m) => m.name) || [])
        setColors(p.colors?.map((c) => c.name) || [])
        setStyleTags(p.style_tags?.map((s) => s.name) || [])
        setPrice(String(p.price))
        setStock(String(p.stock))
        setExistingImages(p.image_urls || [])
        setCurrentStatus(p.status)
        if (p.image_urls?.[0]) setPreviewImageUrl(p.image_urls[0])
      })
      .catch(() => setError('Could not load this product.'))
      .finally(() => setLoading(false))
  }, [isEdit, id])

  async function handleSuggest() {
    if (!description.trim()) return
    setSuggesting(true)
    setError('')
    try {
      const data = await suggestTags({ title, description })
      if (data.category && !category) setCategory(data.category)
      setMaterials(prev => Array.from(new Set([...prev, ...(data.materials || [])])))
      setColors(prev => Array.from(new Set([...prev, ...(data.colors || [])])))
      setStyleTags(prev => Array.from(new Set([...prev, ...(data.style_tags || [])])))
      setSuggested(true)
    } catch (err) {
      setError('Could not generate tags. Please check your connection or try again.')
    } finally {
      setSuggesting(false)
    }
  }

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewImageUrl && !previewImageUrl.startsWith('http')) {
        URL.revokeObjectURL(previewImageUrl)
      }
    }
  }, [previewImageUrl])

  async function handleImagesPicked(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const invalidFile = files.find((file) => !file.type.startsWith('image/'))
    if (invalidFile) {
      setError('Please choose image files only (JPG, PNG, or WebP).')
      return
    }

    setError('')
    setPreparing(true)
    try {
      const compressed = await compressImages(files)
      setImages(compressed)
      
      // Create local preview URL
      if (compressed.length > 0) {
        if (previewImageUrl && !previewImageUrl.startsWith('http')) {
          URL.revokeObjectURL(previewImageUrl)
        }
        setPreviewImageUrl(URL.createObjectURL(compressed[0]))
      }
    } catch {
      setError('This image could not be prepared. Please choose a JPG, PNG, or WebP file.')
    } finally {
      setPreparing(false)
    }
  }

  async function handleSubmit(e, status) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || price === '') {
      setError('Please fill in the title, description and price.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('stock', stock)
      formData.append('category', category || 'Bracelet')
      formData.append('status', status)
      materials.forEach((m) => formData.append('materials[]', m))
      colors.forEach((c) => formData.append('colors[]', c))
      styleTags.forEach((s) => formData.append('style_tags[]', s))
      images.forEach((img) => formData.append('images[]', img))


      if (isEdit) await updateProduct(id, formData)
      else await createProduct(formData)

      navigate('/seller')
    } catch (err) {
      setError(uploadError(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Create a mock product object for the preview card
  const previewProduct = {
    title: title || 'Product Title',
    price: price || '0.00',
    slug: '#', // Prevents broken link navigation
    colors: colors.map((c, i) => ({ id: i, name: c })),
    image_urls: previewImageUrl ? [previewImageUrl] : existingImages
  }

  if (loading) return <p className="mx-auto max-w-2xl px-4 py-10 text-brand-400">Loading...</p>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold text-brand-600">
          {isEdit ? 'Edit product' : 'Add a product'}
        </h1>
        <p className="mt-2 text-wood/80">
          Describe your piece naturally — we'll suggest the category, materials, colours and tags for you to review.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Left Column: Form */}
        <div className="w-full lg:w-[65%]">
          <form
            className="surface r-organic space-y-6 p-7"
            onSubmit={(e) => handleSubmit(e, currentStatus === 'published' ? 'published' : 'draft')}
          >
            <div>
              <label htmlFor="product-title" className="mb-1.5 block text-sm font-medium text-brand-800">
                Title
              </label>
              <input
                id="product-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ocean Breeze Bracelet"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="product-description" className="mb-1.5 block text-sm font-medium text-brand-800">
                Description
              </label>
              <textarea
                id="product-description"
                required
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setSuggested(false)
                }}
                placeholder="e.g. Blue and pink crystal bead bracelet with a silver finish, perfect gift for girls"
                className="field"
              />
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting || !description.trim()}
                className="btn-outline mt-3 !px-5 !py-2 text-sm"
              >
                <i aria-hidden="true" className="fa-solid fa-wand-magic-sparkles text-gold-400" />
                {suggesting ? 'Reading your description...' : 'Suggest tags'}
              </button>
              {suggested && (
                <span className="ml-2 text-xs font-medium text-brand-600">
                  Suggestions added below — review and edit as needed.
                </span>
              )}
            </div>

            <div>
              <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-brand-800">
                Category
              </label>
              <input
                id="product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Bracelet, Bangle, Anklet..."
                className="field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
              <div className="col-span-1 md:col-span-2">
                <TagInput label="Materials" tags={materials} onChange={setMaterials} />
              </div>
              <TagInput label="Colors" tags={colors} onChange={setColors} />
              <TagInput label="Style / occasion tags" tags={styleTags} onChange={setStyleTags} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium text-brand-800">
                  Price (LKR)
                </label>
                <input
                  id="product-price"
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="product-stock" className="mb-1.5 block text-sm font-medium text-brand-800">
                  Stock
                </label>
                <input
                  id="product-stock"
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-images" className="mb-1.5 block text-sm font-medium text-brand-800">
                Photos
              </label>

              {existingImages.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {existingImages.map((url) => (
                    <img key={url} src={url} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />
                  ))}
                </div>
              )}

              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImagesPicked(e.target.files)}
                disabled={preparing || submitting}
                className="w-full text-sm text-wood file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200 transition-colors"
              />
              <p className="mt-1.5 text-xs text-wood/65">
                {isEdit
                  ? 'Leave empty to keep the current photos. Choosing new ones replaces them.'
                  : 'Large photos are resized automatically before upload.'}
              </p>
              {images.length > 0 && (
                <p className="mt-1 text-xs font-medium text-brand-600">
                  <i aria-hidden="true" className="fa-solid fa-circle-check mr-1 text-gold-400" />
                  {images.length} photo(s) ready to upload.
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                <i aria-hidden="true" className="fa-solid fa-circle-exclamation mt-0.5"></i>
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line/40">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={submitting || preparing}
                className="btn-outline !py-2.5"
              >
                {isEdit && currentStatus === 'draft' ? 'Save draft' : 'Save as draft'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={submitting || preparing}
                className="btn-primary !py-2.5 flex-1 md:flex-none justify-center"
              >
                <i aria-hidden="true" className="fa-solid fa-circle-check" />
                {submitting ? 'Saving...' : isEdit && currentStatus === 'published' ? 'Save changes' : 'Publish Product'}
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => navigate('/seller')}
                  className="text-sm font-medium text-wood/70 hover:text-gold-500 ml-auto md:ml-2"
                >
                  Cancel
                </button>
              )}
              {preparing && <span className="text-sm text-brand-500 font-medium ml-auto"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Preparing photos...</span>}
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview */}
        <div className="w-full lg:w-[35%] lg:sticky lg:top-28">
          <div className="bg-gradient-to-b from-brand-50/50 to-transparent p-6 rounded-[32px] border border-brand-100/50 shadow-[var(--shadow-lift)] backdrop-blur-sm relative overflow-hidden group">
            {/* Ambient decorative glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-gold-200 opacity-20 blur-2xl pointer-events-none group-hover:opacity-40 transition-opacity duration-700"></div>
            
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-line/40 relative z-10">
              <i aria-hidden="true" className="fa-solid fa-eye text-gold-400 animate-pulse"></i>
              <h2 className="text-sm font-semibold text-brand-800 uppercase tracking-wider">Live Preview</h2>
            </div>
            
            <p className="text-xs text-wood/70 mb-5 relative z-10">
              This is how your product will look to customers on its detail page.
            </p>

            <div className="pointer-events-none flex flex-col gap-6 relative z-10">
              {/* Product Image */}
              <div className="surface r-organic-lg aspect-square w-full overflow-hidden !p-0 shadow-sm transition-transform duration-500 group-hover:-translate-y-1">
                {previewProduct.image_urls?.length ? (
                  <img src={previewProduct.image_urls[0]} alt={previewProduct.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-sand/30 text-brand-200">
                    <i aria-hidden="true" className="fa-solid fa-ring text-6xl opacity-50 drop-shadow-sm" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex flex-col">
                <h3 className="font-display text-2xl font-semibold text-brand-700 leading-tight">
                  {previewProduct.title}
                </h3>
                <p className="mt-1.5 text-xs text-wood/70 flex items-center">
                  <i aria-hidden="true" className="fa-solid fa-hand-holding-heart mr-1.5 text-gold-400" />
                  by <span className="underline decoration-line ml-1">You</span>
                </p>
                <p className="mt-3 font-display text-xl font-semibold text-gold-500">
                  LKR {Number(previewProduct.price || 0).toLocaleString()}
                </p>

                <p className="mt-3 text-sm text-wood/80 whitespace-pre-line line-clamp-3 leading-relaxed">
                  {description || <span className="italic text-wood/40">Your product description will appear here...</span>}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {[
                    ...(colors || []).map((t, i) => ({ id: `c-${i}`, name: t })),
                    ...(materials || []).map((t, i) => ({ id: `m-${i}`, name: t })),
                    ...(styleTags || []).map((t, i) => ({ id: `s-${i}`, name: t })),
                  ].slice(0, 6).map((t) => (
                    <span key={t.id} className="chip !px-2.5 !py-1 !text-[10px] shadow-sm bg-white border-line/60">
                      {t.name}
                    </span>
                  ))}
                </div>

                <button className="btn-primary w-full mt-6 text-sm !py-2.5 opacity-90 shadow-md">
                  <i aria-hidden="true" className="fa-solid fa-basket-shopping mr-1.5" />
                  Add to cart
                </button>

                {/* Try It On Mock Box */}
                <div className="surface r-organic mt-5 p-5 bg-gradient-to-br from-cream to-brand-50/50 border border-brand-200/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                     <i aria-hidden="true" className="fa-solid fa-wand-magic-sparkles text-4xl"></i>
                  </div>
                  <h4 className="font-display text-base font-semibold text-brand-800 flex items-center gap-2 relative z-10">
                    <i aria-hidden="true" className="fa-solid fa-wand-magic-sparkles text-gold-400 drop-shadow-sm" />
                    try it on
                  </h4>
                  <p className="mt-1.5 text-xs text-wood/80 leading-relaxed relative z-10 pr-4">
                    Upload a photo of your wrist to preview how this piece will look.
                  </p>
                  <div className="mt-4 text-[11px] font-medium text-wood/50 flex items-center gap-2">
                    <span className="bg-white border border-line rounded px-2 py-1 shadow-sm">Choose File</span>
                    No file chosen
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
