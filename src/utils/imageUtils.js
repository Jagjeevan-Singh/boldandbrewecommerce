// Cloud Image Mapping for ImageKit CDN
const cloudImageMap = {
  'Pure Instant Coffee': 'https://ik.imagekit.io/3xnjrgh8n/100instant%20(1).jpg',
  'Vanilla Instant Coffee': 'https://ik.imagekit.io/3xnjrgh8n/Vanilla%20(1).jpg',
  'Hazelnut Instant Coffee': 'https://ik.imagekit.io/3xnjrgh8n/Hazelnut%20(1).jpg',
  'Strong Instant Coffee': 'https://ik.imagekit.io/3xnjrgh8n/7030instant%20(1).jpg',
  'Espresso': 'https://ik.imagekit.io/3xnjrgh8n/espresso%20(1).jpg',
};

// Default placeholder image
const defaultImage = '/assets/images/placeholder.jpg';

/**
 * Get the cloud-hosted image URL for a product
 * @param {string} productName - The product name
 * @returns {string} - The cloud image URL or default placeholder
 */
export const getCloudImageUrl = (productName) => {
  if (!productName) return defaultImage;
  return cloudImageMap[productName] || defaultImage;
};

/**
 * Get product image URL from item data (handles multiple field name patterns)
 * @param {object} item - Product/order item object
 * @returns {string} - The best available image URL
 */
export const getProductImageUrl = (item) => {
  if (!item) return defaultImage;
  
  // Extract product name from various possible fields
  const productName = item.name || item.productName || item.title || (item.product && item.product.name);
  
  // First try to get cloud image by product name
  if (productName && cloudImageMap[productName]) {
    return cloudImageMap[productName];
  }
  
  // Fallback to existing image fields if available
  if (item.mainImage) return item.mainImage;
  if (item.image) return item.image;
  if (item.product && item.product.mainImage) return item.product.mainImage;
  if (item.product && item.product.image) return item.product.image;
  
  // Return default placeholder
  return defaultImage;
};

export default {
  getCloudImageUrl,
  getProductImageUrl,
  cloudImageMap,
};
