import { fetchAuthSession } from 'aws-amplify/auth';

const RAW_API_BASE = import.meta.env.VITE_API_URL || '/api';
const TRIMMED_API_BASE =
  RAW_API_BASE.length > 1 && RAW_API_BASE.endsWith('/')
    ? RAW_API_BASE.slice(0, -1)
    : RAW_API_BASE;
const FALLBACK_ORIGIN =
  typeof window !== 'undefined' && window.location
    ? window.location.origin
    : 'http://localhost:3000';
const ABSOLUTE_API_BASE = TRIMMED_API_BASE.startsWith('http')
  ? TRIMMED_API_BASE
  : `${FALLBACK_ORIGIN}${TRIMMED_API_BASE.startsWith('/') ? '' : '/'}${TRIMMED_API_BASE}`;

const isAbsoluteUrl = (path = '') => /^https?:\/\//i.test(path);
const jsonMime = 'application/json';
const MOCK_SESSION_KEY = 'mangu-demo-session';

const resolveUrl = (path = '') => {
  if (!path) {
    return ABSOLUTE_API_BASE;
  }
  if (isAbsoluteUrl(path)) {
    return path;
  }
  const base = ABSOLUTE_API_BASE.endsWith('/')
    ? ABSOLUTE_API_BASE.slice(0, -1)
    : ABSOLUTE_API_BASE;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const appendSearchParams = (url, params = {}) => {
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          urlObj.searchParams.append(key, item);
        }
      });
    } else {
      urlObj.searchParams.append(key, value);
    }
  });
  return urlObj.toString();
};

const normalizeBody = (body, headers) => {
  if (body === undefined || body === null) {
    return undefined;
  }

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;

  if (isFormData || isBlob || typeof body === 'string') {
    return body;
  }

  if (!headers['Content-Type']) {
    headers['Content-Type'] = jsonMime;
  }

  return JSON.stringify(body);
};

const defaultHeaders = {
  Accept: jsonMime,
};

function getMockSessionUser() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MOCK_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const user = parsed?.state?.user ?? parsed?.user ?? null;
    return user || null;
  } catch (error) {
    console.warn('[api] Unable to parse mock session', error);
    return null;
  }
}

async function fetchWithBase(path, options = {}) {
  const {
    params,
    headers = {},
    body,
    credentials = 'include',
    method = 'GET',
    ...rest
  } = options;

  const resolvedUrl = appendSearchParams(resolveUrl(path), params);
  const finalHeaders = {
    ...defaultHeaders,
    ...headers,
  };
  const normalizedBody = normalizeBody(body, finalHeaders);

  return fetch(resolvedUrl, {
    method,
    credentials,
    ...rest,
    headers: finalHeaders,
    body: normalizedBody,
  });
}

async function getAccessToken() {
  try {
    const session = await fetchAuthSession();
    return session?.tokens?.accessToken?.toString?.() ?? null;
  } catch (error) {
    console.warn('[api] Unable to fetch auth session', error);
    return null;
  }
}

export async function authedFetch(path, init = {}) {
  const token = await getAccessToken();
  const headers = {
    ...init.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    const mockUser = getMockSessionUser();
    if (mockUser) {
      headers.Authorization = headers.Authorization || `Bearer mock-${mockUser.id || 'user'}`;
      if (mockUser.email) {
        headers['X-Mock-Email'] = mockUser.email;
      }
      if (mockUser.name) {
        headers['X-Mock-Name'] = mockUser.name;
      }
      headers['X-Mock-User'] = mockUser.email || mockUser.name || 'mock-user';
      const roles = Array.isArray(mockUser.roles) ? mockUser.roles : [];
      if (roles.length > 0) {
        headers['X-Mock-Roles'] = roles.join(',');
      }
      if (mockUser.isAdmin || roles.includes('admin')) {
        headers['X-Mock-Admin'] = '1';
      }
    }
  }
  return fetchWithBase(path, { ...init, headers });
}

export class ApiError extends Error {
  constructor(message, { status, data, url } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.url = url;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes(jsonMime)) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    data = text || null;
  }

  if (!response.ok) {
    throw new ApiError(
      (data && (data.error || data.message)) ||
        response.statusText ||
        'Request failed',
      {
        status: response.status,
        data,
        url: response.url,
      }
    );
  }

  return data;
}

export async function apiRequest(path, options = {}) {
  const { auth = false, ...rest } = options;
  const response = auth
    ? await authedFetch(path, rest)
    : await fetchWithBase(path, rest);
  return parseResponse(response);
}

export const apiClient = {
  books: {
    list: (params = {}) => apiRequest('/books', { params }),
    featured: () => apiRequest('/books/featured'),
    trending: (params = {}) => apiRequest('/books/trending', { params }),
    newReleases: (params = {}) => apiRequest('/books/new-releases', { params }),
    search: (params = {}) => apiRequest('/books/search', { params }),
    get: (id) => apiRequest(`/books/${id}`),
    getReviews: (id, params = {}) => apiRequest(`/books/${id}/reviews`, { params }),
    create: (payload) =>
      apiRequest('/books', { method: 'POST', body: payload, auth: true }),
    update: (id, payload) =>
      apiRequest(`/books/${id}`, {
        method: 'PUT',
        body: payload,
        auth: true,
      }),
  },
  payments: {
    createCheckoutSession: (payload) =>
      apiRequest('/payments/create-checkout-session', {
        method: 'POST',
        body: payload,
        auth: true,
      }),
  },
  admin: {
    listBooks: (params = {}) =>
      apiRequest('/admin/books', { params, auth: true }).then((data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.items)) return data.items;
        return [];
      }),
    getBook: (id) => apiRequest(`/admin/books/${id}`, { auth: true }),
    createBook: (payload) =>
      apiRequest('/admin/books', {
        method: 'POST',
        body: payload,
        auth: true,
      }),
    deleteBook: (id) =>
      apiRequest(`/admin/books/${id}`, {
        method: 'DELETE',
        auth: true,
      }),
    updateBook: (id, payload) =>
      apiRequest(`/admin/books/${id}`, {
        method: 'PUT',
        body: payload,
        auth: true,
      }),
  },
  notion: {
    status: () => apiRequest('/notion/status'),
    generateDescription: (payload) =>
      apiRequest('/notion/generate-description', {
        method: 'POST',
        body: payload,
        auth: true,
      }),
    generateSummary: (payload) =>
      apiRequest('/notion/generate-summary', {
        method: 'POST',
        body: payload,
        auth: true,
      }),
    generateMarketing: (payload) =>
      apiRequest('/notion/generate-marketing', {
        method: 'POST',
        body: payload,
        auth: true,
      }),
    syncBook: (payload) =>
      apiRequest('/notion/sync-book', {
        method: 'POST',
        body: payload,
        auth: true,
      }),
  },
};
