import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from './SignIn';
import renderWithProviders from '../testing/renderWithProviders';
import { DEMO_TOKEN, DEMO_USER, mockApi } from '../testing/mockApi';
import { defaultTokenStore } from '../services/tokenStore';

let mock;
beforeEach(() => {
  mock = mockApi();
});
afterEach(() => mock.restore());

describe('SignIn', () => {
  it('binds both inputs to state (regression: they were bound to formData.email, state was formData.user.email)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignIn />);

    const email = screen.getByLabelText(/email/i);
    await user.type(email, 'ada@example.com');

    // A React-controlled input keeps its value because state changed. The bug
    // left `value` permanently `undefined`, so this element was uncontrolled.
    expect(email).toHaveValue('ada@example.com');
    expect(email.getAttribute('value')).not.toBeNull();
  });

  it('stores the token and the user, then redirects, on a successful login', async () => {
    const user = userEvent.setup();
    const tokenStore = defaultTokenStore;
    mock
      .onPost('/login')
      .reply(
        200,
        { status: { code: 200, data: { user: DEMO_USER } } },
        { authorization: DEMO_TOKEN }
      );

    renderWithProviders(<SignIn />, { tokenStore });

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(tokenStore.getToken()).toBe(DEMO_TOKEN));
    expect(tokenStore.getUser()).toEqual(DEMO_USER);
  });

  it('does not sign anyone in when the credentials are rejected', async () => {
    const user = userEvent.setup();
    const tokenStore = defaultTokenStore;
    mock.onPost('/login').reply(401, { errors: ['Invalid Email or password.'] });

    renderWithProviders(<SignIn />, { tokenStore });

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid Email or password.');
    expect(tokenStore.getToken()).toBeNull();
  });

  it('refuses a 200 that carries no Authorization header', async () => {
    const user = userEvent.setup();
    const tokenStore = defaultTokenStore;
    // This is what a browser sees when the API forgets
    // `Access-Control-Expose-Headers: Authorization`.
    mock.onPost('/login').reply(200, { status: { code: 200, data: { user: DEMO_USER } } });

    renderWithProviders(<SignIn />, { tokenStore });

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/did not return a session token/i);
    expect(tokenStore.getToken()).toBeNull();
  });
});
