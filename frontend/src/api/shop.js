import client from './client'

export const getCart = () => client.get('/cart').then((r) => r.data)
export const addToCart = (data) => client.post('/cart/items', data).then((r) => r.data)
export const updateCartItem = (id, data) => client.put(`/cart/items/${id}`, data).then((r) => r.data)
export const removeCartItem = (id) => client.delete(`/cart/items/${id}`).then((r) => r.data)

export const getPreferences = () => client.get('/preferences').then((r) => r.data)
export const updatePreferences = (data) => client.put('/preferences', data).then((r) => r.data)

export const placeOrder = (data) => client.post('/orders', data).then((r) => r.data)
export const listOrders = (params) => client.get('/orders', { params }).then((r) => r.data)
export const getOrder = (id) => client.get(`/orders/${id}`).then((r) => r.data)

export const tryOn = (formData) =>
  client.post('/try-on', formData).then((r) => r.data)
