import client from './client'

export const getDashboard = () => client.get('/admin/dashboard').then((r) => r.data)
export const listAllProducts = (params) => client.get('/admin/products', { params }).then((r) => r.data)
export const updateProductStatus = (id, status) =>
  client.patch(`/admin/products/${id}/status`, { status }).then((r) => r.data)
export const listUsers = (params) => client.get('/admin/users', { params }).then((r) => r.data)
