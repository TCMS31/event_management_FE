import { DEFAULT_PER_PAGE } from '../services/eventService';

/**
 * The application's whole domain state, as a pure reducer.
 *
 * Keeping it in its own module (rather than inline in the provider) is what
 * makes it unit-testable without React, and it is where the cross-collection
 * rules live: joining an event has to remove it from "joinable" *and* add it to
 * "joined", and doing that in a component is how the two lists drift apart.
 */

export const COLLECTIONS = ['organized', 'joinable', 'joined'];

export const emptyCollection = () => ({
  items: [],
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  total: 0,
  hasMore: false,
  status: 'idle', // idle | loading | ready | error
  error: null,
});

export const createInitialState = (session = {}) => ({
  isAuthenticated: Boolean(session.token),
  user: session.user ?? null,
  collections: Object.fromEntries(COLLECTIONS.map((name) => [name, emptyCollection()])),
});

const patchCollection = (state, name, patch) => ({
  ...state,
  collections: {
    ...state.collections,
    [name]: { ...state.collections[name], ...patch },
  },
});

const mapCollection = (state, name, fn) =>
  patchCollection(state, name, { items: fn(state.collections[name].items) });

export const eventReducer = (state, action) => {
  switch (action.type) {
    case 'SIGN_IN':
      return {
        ...createInitialState({ token: action.payload.token, user: action.payload.user }),
      };

    case 'SIGN_OUT':
      return createInitialState();

    case 'COLLECTION_LOADING':
      return patchCollection(state, action.collection, { status: 'loading', error: null });

    case 'COLLECTION_LOADED': {
      const { items, page, perPage, total, hasMore } = action.payload;
      const previous = state.collections[action.collection].items;
      return patchCollection(state, action.collection, {
        // `append` is how "Load more" grows the list without refetching page 1.
        items: action.append ? [...previous, ...items] : items,
        page,
        perPage,
        total,
        hasMore,
        status: 'ready',
        error: null,
      });
    }

    case 'COLLECTION_FAILED':
      return patchCollection(state, action.collection, {
        status: 'error',
        error: action.error,
      });

    case 'EVENT_CREATED':
      return patchCollection(state, 'organized', {
        items: [action.payload, ...state.collections.organized.items],
        total: state.collections.organized.total + 1,
        status: 'ready',
      });

    case 'EVENT_UPDATED':
      return mapCollection(state, 'organized', (items) =>
        items.map((event) =>
          event.id === action.payload.id ? { ...event, ...action.payload } : event
        )
      );

    case 'EVENT_DELETED':
      return patchCollection(state, 'organized', {
        items: state.collections.organized.items.filter((event) => event.id !== action.id),
        total: Math.max(0, state.collections.organized.total - 1),
      });

    case 'EVENT_JOINED': {
      const joinable = state.collections.joinable;
      const joined = state.collections.joined;
      return {
        ...state,
        collections: {
          ...state.collections,
          joinable: {
            ...joinable,
            items: joinable.items.filter((event) => event.id !== action.payload.id),
            total: Math.max(0, joinable.total - 1),
          },
          joined: {
            ...joined,
            items: [action.payload, ...joined.items],
            total: joined.total + 1,
            status: 'ready',
          },
        },
      };
    }

    default:
      return state;
  }
};
