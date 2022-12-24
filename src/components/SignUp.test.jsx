import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notify } from '../services/notify';
import SignUp from './SignUp';
import renderWithProviders from '../testing/renderWithProviders';
import { mockApi } from '../testing/mockApi';

let mock;
beforeEach(() => {
  mock = mockApi();
  vi.spyOn(notify, 'success').mockImplementation(() => {});
  vi.spyOn(notify, 'error').mockImplementation(() => {});
});
afterEach(() => {
  mock.restore();
  vi.restoreAllMocks();
});

const fillForm = async (user, { confirmation = 'correct horse' } = {}) => {
  await user.type(screen.getByLabelText('Name'), 'Grace Hopper');
  await user.type(screen.getByLabelText('Email'), 'grace@example.com');
  await user.type(screen.getByLabelText('Password'), 'correct horse');
  await user.type(screen.getByLabelText('Confirm password'), confirmation);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
};

describe('SignUp', () => {
  it('refuses mismatched passwords without calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });

    await fillForm(user, { confirmation: 'battery staple' });

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
    expect(mock.history.post).toHaveLength(0);
  });

  it("shows Devise's bare {status: [...]} error from /signup", async () => {
    const user = userEvent.setup();
    mock.onPost('/signup').reply(422, { status: ['Email has already been taken'] });
    renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });

    await fillForm(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email has already been taken');
    expect(JSON.parse(mock.history.post[0].data).user).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password_confirmation: 'correct horse',
    });
  });

  it('sends the user to sign in after a successful registration', async () => {
    const user = userEvent.setup();
    mock.onPost('/signup').reply(200, { status: { code: 200 } });
    renderWithProviders(<SignUp />, { route: '/signup', path: '/signup' });

    await fillForm(user);

    await waitFor(() =>
      expect(notify.success).toHaveBeenCalledWith('Account created. Please sign in.', 'Success')
    );
  });
});
