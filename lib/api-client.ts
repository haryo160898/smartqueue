// lib/api-client.ts

import { getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api';
const BASE_API_URL = API_URL
  ? `${API_URL.replace(/\/$/, '')}${API_BASE_PATH.replace(/\/$/, '')}`
  : API_BASE_PATH.replace(/\/$/, '');

const buildUrl = (endpoint: string) =>
  `${BASE_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

const parseJsonResponse = async (res: Response) => {
  let data: any;
  try {
    data = await res.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response from ${res.url}: ${error}`);
  }

  if (!res.ok) {
    const message = data?.message || JSON.stringify(data);
    throw new Error(`API request failed ${res.status} ${res.statusText}: ${message}`);
  }

  return data;
};

export const apiClient = {
  async get(endpoint: string) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const url = buildUrl(endpoint);
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return parseJsonResponse(res);
  },

  async put(endpoint: string, data: any) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const url = buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return parseJsonResponse(res);
  },

  async post(endpoint: string, data: any) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const url = buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return parseJsonResponse(res);
  },

  async delete(endpoint: string) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const url = buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return parseJsonResponse(res);
  },
};

export default apiClient;
