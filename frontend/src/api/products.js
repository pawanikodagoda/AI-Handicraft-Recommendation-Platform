import client from './client'

export const listProducts = (params) => client.get('/products', { params }).then((r) => r.data)
export const getProduct = (slug) => client.get(`/products/${slug}`).then((r) => r.data)
export const listCategories = () => client.get('/categories').then((r) => r.data)
export const listFilters = () => client.get('/filters').then((r) => r.data)
export const getStats = () => client.get('/stats').then((r) => r.data)
export const listMyProducts = (params) => client.get('/seller/products', { params }).then((r) => r.data)
export const getMyProduct = (id) => client.get(`/seller/products/${id}`).then((r) => r.data)

export const createProduct = (formData) =>
  // Let the browser set multipart/form-data, including its required boundary.
  // Supplying the header ourselves can cause PHP to receive an empty files bag.
  client.post('/products', formData).then((r) => r.data)

export const updateProduct = (id, formData) => {
  formData.append('_method', 'PUT')
  return client
    .post(`/products/${id}`, formData)
    .then((r) => r.data)
}

export const deleteProduct = (id) => client.delete(`/products/${id}`).then((r) => r.data)

export const suggestTags = (data) => client.post('/tagging/suggest', data).then((r) => r.data)

export const getRecommendations = (params) => client.get('/recommendations', { params }).then((r) => r.data)
