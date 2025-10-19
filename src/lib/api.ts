// 🌐 Helper para requisições à API
// Este arquivo facilita as requisições HTTP para o backend

export const API_URL = 'http://localhost:3001/api';

// 🔐 Função auxiliar para fazer requisições autenticadas
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('flexi-token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro na requisição');
  }

  return response.json();
};

// 📦 API de Produtos
export const productsAPI = {
  getAll: () => fetchWithAuth('/products'),
  getById: (id: string) => fetchWithAuth(`/products/${id}`),
  create: (data: any) => fetchWithAuth('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchWithAuth(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchWithAuth(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// 📊 API de Movimentações
export const movementsAPI = {
  getAll: () => fetchWithAuth('/movements'),
  create: (data: any) => fetchWithAuth('/movements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getStats: () => fetchWithAuth('/movements/stats'),
};

// 🔔 API de Notificações
export const notificationsAPI = {
  getAll: () => fetchWithAuth('/notifications'),
  create: (data: any) => fetchWithAuth('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markAsRead: (id: string) => fetchWithAuth(`/notifications/${id}/read`, {
    method: 'PATCH',
  }),
  delete: (id: string) => fetchWithAuth(`/notifications/${id}`, {
    method: 'DELETE',
  }),
  deleteAllRead: () => fetchWithAuth('/notifications/read/all', {
    method: 'DELETE',
  }),
  deleteAll: () => fetchWithAuth('/notifications/all', {
    method: 'DELETE',
  }),
};

// 📅 API de Lotes
export const batchesAPI = {
  getAll: () => fetchWithAuth('/batches'),
  getByProduct: (productId: string) => fetchWithAuth(`/batches/product/${productId}`),
  create: (data: any) => fetchWithAuth('/batches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchWithAuth(`/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchWithAuth(`/batches/${id}`, {
    method: 'DELETE',
  }),
  getExpiringSoon: (days: number = 30) => fetchWithAuth(`/batches/expiring-soon/${days}`),
  getExpired: () => fetchWithAuth('/batches/expired'),
  syncProductStock: (productId: string) => fetchWithAuth(`/batches/sync-product-stock/${productId}`, {
    method: 'POST',
  }),
};

