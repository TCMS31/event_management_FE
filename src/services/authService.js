import api, { describeApiError } from './api';
import { defaultTokenStore } from './tokenStore';

/**
 * Sign-up, sign-in and sign-out against the Devise endpoints.
 *
 * The token arrives in the `Authorization` *response header*, not the body —
 * see `docs/api-contract.md` in the API repo. It is already prefixed with
 * `Bearer `, so it is stored and replayed verbatim.
 */

export class AuthError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AuthError';
    this.cause = cause;
  }
}

/**
 * @returns {Promise<{token: string, user: object}>}
 * @throws {AuthError} on bad credentials, or when the API answers without a token.
 */
export const login = async ({ email, password }) => {
  let response;
  try {
    response = await api.post('/login', { user: { email, password } });
  } catch (error) {
    throw new AuthError(describeApiError(error, 'Login unsuccessful. Please try again.'), error);
  }

  const token = response.headers?.authorization;
  if (!token) {
    // Without `Access-Control-Expose-Headers: Authorization` the browser hides
    // this header, so the request succeeds and the session is still worthless.
    // Failing loudly here is the difference between "please try again" and a
    // logged-in-looking app that 401s on every subsequent call.
    throw new AuthError('The server did not return a session token.');
  }

  return { token, user: response.data?.status?.data?.user ?? null };
};

export const signUp = async ({ name, email, password, passwordConfirmation }) => {
  if (password !== passwordConfirmation) {
    throw new AuthError('Password and Confirm Password do not match.');
  }

  try {
    const response = await api.post('/signup', {
      user: { name, email, password, password_confirmation: passwordConfirmation },
    });
    return response.data;
  } catch (error) {
    throw new AuthError(describeApiError(error, 'Sign up unsuccessful. Please try again.'), error);
  }
};

/**
 * Revokes the token server-side, then clears it locally.
 *
 * The local session is cleared even when the request fails: a token the server
 * has already expired must not keep the UI looking signed in.
 */
export const logout = async ({ tokenStore = defaultTokenStore } = {}) => {
  try {
    await api.delete('/logout');
    return true;
  } catch {
    return false;
  } finally {
    tokenStore.clear();
  }
};
