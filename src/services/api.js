import axios from 'axios';
import { defaultTokenStore } from './tokenStore';

/**
 * Base URL for the Rails API.
 *
 * Empty string means "same origin", which is what production wants: the CDN /
 * reverse proxy in front of the built bundle forwards `/api`, `/login`,
 * `/logout` and `/signup` to the API. In development `src/setupProxy.js` does
 * the same job, so the default is correct in both places and `REACT_APP_API_URL`
 * only has to be set when the API lives on a different origin.
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/** Endpoints that must be called *without* an Authorization header. */
const UNAUTHENTICATED_PATHS = ['/login', '/signup'];

const isUnauthenticated = (url = '') => UNAUTHENTICATED_PATHS.some((path) => url.endsWith(path));

/**
 * Builds a configured axios instance.
 *
 * Exported as a factory so tests (and any future second client, e.g. one
 * pointed at a staging API) can supply their own token store rather than
 * mutating global `localStorage`.
 */
export const createApiClient = ({
  baseURL = API_BASE_URL,
  tokenStore = defaultTokenStore,
  onUnauthorized = null,
} = {}) => {
  const client = axios.create({ baseURL, headers: { Accept: 'application/json' } });

  client.interceptors.request.use((config) => {
    if (isUnauthenticated(config.url)) return config;

    const token = tokenStore.getToken();
    if (token) {
      // The API returns the value already prefixed with `Bearer `. Do not add
      // another prefix here — the backend contract calls this out explicitly.
      config.headers.Authorization = token;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        tokenStore.clear();
        onUnauthorized?.();
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Pulls a human-readable message out of either of the API's two error
 * envelopes (`{errors: [...]}` and `{attributes_errors: {field: [...]}}`),
 * falling back to a generic message.
 */
export const describeApiError = (error, fallback = 'Something went wrong.') => {
  const data = error?.response?.data;
  if (!data) return fallback;

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join(' ');
  }
  if (data.attributes_errors) {
    const messages = Object.entries(data.attributes_errors).map(
      ([field, errors]) => `${field} ${[].concat(errors).join(', ')}`
    );
    if (messages.length > 0) return messages.join('; ');
  }
  // Devise's signup endpoint predates the envelope and returns a bare array.
  if (Array.isArray(data.status) && data.status.length > 0) {
    return data.status.join(' ');
  }
  return fallback;
};

const api = createApiClient();

export default api;
