import api, { describeApiError } from './api';

/**
 * Every call the app makes to the events half of the API.
 *
 * Components never see axios: they call these functions and get back plain
 * data, which is what makes the list components testable without a network and
 * what stops the pagination contract from being re-implemented three times.
 */

/** Matches `Paginatable::DEFAULT_PER_PAGE` in the Rails API. */
export const DEFAULT_PER_PAGE = 50;

/** The three paginated list endpoints, keyed by the collection they return. */
export const EVENT_COLLECTIONS = {
  organized: '/api/v1/events',
  joinable: '/api/v1/events/get_events',
  joined: '/api/v1/events/joined_events',
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Normalises a list response into `{ items, page, perPage, total, hasMore }`.
 *
 * The API answers with a bare JSON array plus `X-Total-Count` / `X-Page` /
 * `X-Per-Page` headers. Reading `response.data` alone — which is what this
 * client used to do — silently truncates at the page size with no way for the
 * UI to know more rows exist.
 */
export const parseListResponse = (response, requestedPage = 1) => {
  const items = Array.isArray(response.data) ? response.data : [];
  const headers = response.headers || {};

  const perPage = toInt(headers['x-per-page'], DEFAULT_PER_PAGE);
  const page = toInt(headers['x-page'], requestedPage);
  // A server without the headers (an older deployment) still has to render, so
  // fall back to "what we received is all there is".
  const total = toInt(headers['x-total-count'], items.length);

  return { items, page, perPage, total, hasMore: page * perPage < total };
};

/**
 * Fetches one page of a collection.
 *
 * @param {keyof typeof EVENT_COLLECTIONS} collection
 * @param {{page?: number, perPage?: number, signal?: AbortSignal}} options
 */
export const fetchEventPage = async (
  collection,
  { page = 1, perPage = DEFAULT_PER_PAGE, signal } = {}
) => {
  const path = EVENT_COLLECTIONS[collection];
  if (!path) throw new Error(`Unknown event collection: ${collection}`);

  const response = await api.get(path, { params: { page, per_page: perPage }, signal });
  return parseListResponse(response, page);
};

export const fetchEvent = async (id, { signal } = {}) => {
  const response = await api.get(`/api/v1/events/${id}`, { signal });
  return response.data;
};

export const createEvent = async (event) => {
  const response = await api.post('/api/v1/events', { event });
  return response.data;
};

export const updateEvent = async (id, event) => {
  const response = await api.patch(`/api/v1/events/${id}`, { event });
  return response.data;
};

/** The API answers `204 No Content`; there is nothing to return. */
export const deleteEvent = async (id) => {
  await api.delete(`/api/v1/events/${id}`);
};

export const joinEvent = async (id) => {
  const response = await api.post(`/api/v1/events/add_user_to_events?event_id=${id}`);
  return response.data;
};

/** True when `event` was created by `user`. Drives every edit/delete control. */
export const isOrganizedBy = (event, user) =>
  Boolean(event && user && event.organizer_id != null && event.organizer_id === user.id);

export { describeApiError };
