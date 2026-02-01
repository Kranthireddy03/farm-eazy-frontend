import apiClient from './apiClient';

const ProductService = {
  createProduct: async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  getAllProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getProductsByCategory: async (category) => {
    const response = await apiClient.get(`/products/category/${category}`);
    return response.data;
  },

  getMyProducts: async () => {
    const response = await apiClient.get('/products/my-products');
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  updateProductStatus: async (id, status) => {
    const response = await apiClient.patch(`/products/${id}/status`, { status });
    return response.data;
  }
};

export default ProductService;
