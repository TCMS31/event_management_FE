import MockAdapter from 'axios-mock-adapter';
import api from '../services/api';
import seed from './seedEvents.json';

/**
 * Mounts a mock adapter on the *real* axios instance the app uses, so the
 * request and response interceptors — token attachment, 401 handling — are
 * exercised rather than bypassed.
 */
export const mockApi = () => new MockAdapter(api);

export const DEMO_TOKEN = 'Bearer test-session-token';
export const DEMO_USER = seed.users[0];
export const OTHER_USER = seed.users[1];

export const paginationHeaders = ({ page = 1, perPage = 50, total }) => ({
  'x-total-count': String(total),
  'x-page': String(page),
  'x-per-page': String(perPage),
});

/** One page of a collection, with the headers the real API sends. */
export const pageOf = (rows, { page = 1, perPage = 50 } = {}) => [
  200,
  rows.slice((page - 1) * perPage, page * perPage),
  paginationHeaders({ page, perPage, total: rows.length }),
];

export const seedEvents = seed;
