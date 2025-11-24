/**
 * Centralized API Client for MANGU Publishing
 *
 * All API calls should go through this module to ensure:
 * - Consistent base URL configuration
 * - Centralized error handling
 * - Easy mocking for tests
 * - Single source of truth for API endpoints
 */

// Official port assignments - DO NOT CHANGE without updating server
const DEFAULT_API_URL = 'http://localhost:3002';

// Get API URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/api/books')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }

  return response.json();
}

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional fetch options
 */
export async function get(endpoint, options = {}) {
  return apiRequest(endpoint, { method: 'GET', ...options });
}

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @param {object} options - Additional fetch options
 */
export async function post(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @param {object} options - Additional fetch options
 */
export async function put(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional fetch options
 */
export async function del(endpoint, options = {}) {
  return apiRequest(endpoint, { method: 'DELETE', ...options });
}

// =============================================================================
// BOOKS API
// =============================================================================

export const booksApi = {
  /** Get all books */
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/api/books${query ? `?${query}` : ''}`);
  },

  /** Get a single book by ID */
  getById: (id) => get(`/api/books/${id}`),

  /** Get featured book */
  getFeatured: () => get('/api/books/featured'),

  /** Get trending books */
  getTrending: (limit = 10) => get(`/api/books/trending?limit=${limit}`),

  /** Search books */
  search: (query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters });
    return get(`/api/books/search?${params}`);
  },

  /** Create a new book (admin) */
  create: (bookData) => post('/api/books', bookData),

  /** Update a book (admin) */
  update: (id, bookData) => put(`/api/books/${id}`, bookData),

  /** Delete a book (admin) */
  delete: (id) => del(`/api/books/${id}`),
};

// =============================================================================
// CATEGORIES API
// =============================================================================

export const categoriesApi = {
  /** Get all categories */
  getAll: () => get('/api/categories'),
};

// =============================================================================
// HEALTH API
// =============================================================================

export const healthApi = {
  /** Check API health */
  check: () => get('/api/health'),

  /** Simple health check */
  ping: () => fetch(`${API_BASE_URL}/health`).then(r => r.text()),
};

// Export base URL for debugging
export { API_BASE_URL };

// Default export with all APIs
export default {
  books: booksApi,
  categories: categoriesApi,
  health: healthApi,
  get,
  post,
  put,
  del,
  API_BASE_URL,
};
