import apiClient from './apiClient';

const ProductService = {
  createProduct: async (productData) => {
    // Prepare FormData for multipart/form-data
    const formData = new FormData();
    // Remove imageUrls and videoUrls from productData before sending
    const cleanProductData = { ...productData };
    delete cleanProductData.imageUrls;
    delete cleanProductData.videoUrls;
    delete cleanProductData.imageFiles;
    delete cleanProductData.videoFile;
    delete cleanProductData.videoFiles;
    formData.append('product', JSON.stringify(cleanProductData));
    // Append image files
    if (productData.imageFiles) {
      productData.imageFiles.forEach(file => formData.append('files', file));
    }
    // Append video files
    if (productData.videoFiles) {
      productData.videoFiles.forEach(file => formData.append('files', file));
    }
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
    // Prepare FormData for multipart/form-data
    const formData = new FormData();
    // Remove imageUrls, videoUrls, imageFiles, videoFiles from productData before sending
    const cleanProductData = { ...productData };
    delete cleanProductData.imageUrls;
    delete cleanProductData.videoUrls;
    delete cleanProductData.imageFiles;
    delete cleanProductData.videoFile;
    delete cleanProductData.videoFiles;
    formData.append('product', JSON.stringify(cleanProductData));
    if (productData.imageFiles) {
      productData.imageFiles.forEach(file => formData.append('files', file));
    }
    if (productData.videoFiles) {
      productData.videoFiles.forEach(file => formData.append('files', file));
    }
    const response = await apiClient.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
