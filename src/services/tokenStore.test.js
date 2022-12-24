import { createLocalStorageTokenStore, createMemoryTokenStore } from './tokenStore';

describe('createLocalStorageTokenStore', () => {
  it('round-trips the token and the user', () => {
    const store = createLocalStorageTokenStore(window.localStorage);

    store.save({ token: 'Bearer abc', user: { id: 1, name: 'Ada' } });

    expect(store.getToken()).toBe('Bearer abc');
    expect(store.getUser()).toEqual({ id: 1, name: 'Ada' });

    store.clear();
    expect(store.getToken()).toBeNull();
    expect(store.getUser()).toBeNull();
  });

  it('degrades to "no session" when storage throws (private mode, blocked site data)', () => {
    const throwing = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const store = createLocalStorageTokenStore(throwing);

    expect(() => store.save({ token: 'Bearer abc', user: null })).not.toThrow();
    expect(store.getToken()).toBeNull();
    expect(store.getUser()).toBeNull();
    expect(() => store.clear()).not.toThrow();
  });

  it('treats a corrupted user entry as no user', () => {
    window.localStorage.setItem('user', '{not json');
    expect(createLocalStorageTokenStore(window.localStorage).getUser()).toBeNull();
  });
});

describe('createMemoryTokenStore', () => {
  it('keeps the session in memory only', () => {
    const store = createMemoryTokenStore();
    store.save({ token: 'Bearer m' });

    expect(store.getToken()).toBe('Bearer m');
    expect(store.getUser()).toBeNull();
    expect(window.localStorage.getItem('token')).toBeNull();
  });
});
