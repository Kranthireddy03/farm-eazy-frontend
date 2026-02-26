import apiClient from './apiClient';

const ProductService = {
  createProduct: async (productData) => {
    // Prepare FormData for multipart/form-data
    const formData = new FormData();
    // Extract file URLs if present (assume comma-separated URLs in imageUrls/videoUrls)
    // If you want to support actual file uploads, update Selling.jsx to pass File objects
    // For now, just send product JSON
    formData.append('product', JSON.stringify(productData));
    // If you have files, you can append them as:
    // productData.files?.forEach(file => formData.append('files', file));
    const response = await apiClient.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
