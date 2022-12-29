import { createInitialState, eventReducer } from './eventReducer';

const seededState = () => {
  const state = createInitialState({ token: 'Bearer t', user: { id: 1 } });
  state.collections.joinable = {
    ...state.collections.joinable,
    items: [{ id: 10 }, { id: 11 }],
    total: 2,
    status: 'ready',
  };
  state.collections.joined = { ...state.collections.joined, items: [{ id: 5 }], total: 1 };
  state.collections.organized = {
    ...state.collections.organized,
    items: [{ id: 1, name: 'Old' }],
    total: 1,
  };
  return state;
};

describe('createInitialState', () => {
  it('is authenticated only when a token was persisted', () => {
    expect(createInitialState({ token: 'Bearer t' }).isAuthenticated).toBe(true);
    expect(createInitialState({}).isAuthenticated).toBe(false);
    expect(createInitialState().user).toBeNull();
  });
});

describe('eventReducer', () => {
  it('SIGN_OUT drops every cached collection, not just the auth flag', () => {
    const next = eventReducer(seededState(), { type: 'SIGN_OUT' });

    expect(next.isAuthenticated).toBe(false);
    expect(next.user).toBeNull();
    expect(next.collections.joinable.items).toEqual([]);
    expect(next.collections.joined.items).toEqual([]);
    expect(next.collections.organized.items).toEqual([]);
  });

  it('COLLECTION_LOADED replaces on page 1 and appends when asked to', () => {
    const loaded = eventReducer(createInitialState(), {
      type: 'COLLECTION_LOADED',
      collection: 'joinable',
      payload: { items: [{ id: 1 }], page: 1, perPage: 50, total: 2, hasMore: true },
    });
    expect(loaded.collections.joinable.items).toHaveLength(1);

    const appended = eventReducer(loaded, {
      type: 'COLLECTION_LOADED',
      collection: 'joinable',
      append: true,
      payload: { items: [{ id: 2 }], page: 2, perPage: 50, total: 2, hasMore: false },
    });
    expect(appended.collections.joinable.items.map((e) => e.id)).toEqual([1, 2]);
    expect(appended.collections.joinable.hasMore).toBe(false);
  });

  it('EVENT_JOINED moves the event from joinable to joined in one step', () => {
    const next = eventReducer(seededState(), { type: 'EVENT_JOINED', payload: { id: 10 } });

    expect(next.collections.joinable.items.map((e) => e.id)).toEqual([11]);
    expect(next.collections.joinable.total).toBe(1);
    expect(next.collections.joined.items.map((e) => e.id)).toEqual([10, 5]);
    expect(next.collections.joined.total).toBe(2);
  });

  it('EVENT_DELETED removes the row and decrements the total', () => {
    const next = eventReducer(seededState(), { type: 'EVENT_DELETED', id: 1 });

    expect(next.collections.organized.items).toEqual([]);
    expect(next.collections.organized.total).toBe(0);
  });

  it('EVENT_UPDATED merges into the matching row only', () => {
    const state = seededState();
    state.collections.organized.items = [
      { id: 1, name: 'Old' },
      { id: 2, name: 'Untouched' },
    ];

    const next = eventReducer(state, { type: 'EVENT_UPDATED', payload: { id: 1, name: 'New' } });

    expect(next.collections.organized.items).toEqual([
      { id: 1, name: 'New' },
      { id: 2, name: 'Untouched' },
    ]);
  });

  it('COLLECTION_FAILED records the message without clearing what is on screen', () => {
    const next = eventReducer(seededState(), {
      type: 'COLLECTION_FAILED',
      collection: 'joinable',
      error: 'Could not load events.',
    });

    expect(next.collections.joinable.status).toBe('error');
    expect(next.collections.joinable.error).toBe('Could not load events.');
    expect(next.collections.joinable.items).toHaveLength(2);
  });

  it('returns the same object for an unknown action', () => {
    const state = seededState();
    expect(eventReducer(state, { type: 'NOPE' })).toBe(state);
  });
});
