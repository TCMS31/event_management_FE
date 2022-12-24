/**
 * The one place the session token and the signed-in identity are persisted.
 *
 * Extensibility seam: everything else in the app talks to a *token store*
 * object, never to `localStorage` directly. Swap `defaultTokenStore` for an
 * in-memory store (tests), a cookie-backed store (if the API ever moves to
 * `HttpOnly` cookies) or a `sessionStorage` store without touching a component.
 *
 * Having exactly one owner of this state is deliberate: the original code read
 * `localStorage` from the reducer's initial state, from the axios interceptor
 * and from the sign-out handler, which let the three drift apart.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/** A store backed by `window.localStorage`, guarded for non-browser contexts. */
export const createLocalStorageTokenStore = (storage) => {
  const safe = (fn, fallback = null) => {
    try {
      return fn();
    } catch {
      // Private-mode Safari and disabled site data both throw here.
      return fallback;
    }
  };

  return {
    getToken: () => safe(() => storage.getItem(TOKEN_KEY)),
    getUser: () =>
      safe(() => {
        const raw = storage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      }),
    save: ({ token, user }) =>
      safe(() => {
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(USER_KEY, JSON.stringify(user ?? null));
      }),
    clear: () =>
      safe(() => {
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(USER_KEY);
      }),
  };
};

/** An in-memory store, used by the test suite and usable for SSR. */
export const createMemoryTokenStore = () => {
  let token = null;
  let user = null;

  return {
    getToken: () => token,
    getUser: () => user,
    save: (session) => {
      token = session.token;
      user = session.user ?? null;
    },
    clear: () => {
      token = null;
      user = null;
    },
  };
};

export const defaultTokenStore =
  typeof window !== 'undefined' && window.localStorage
    ? createLocalStorageTokenStore(window.localStorage)
    : createMemoryTokenStore();
