import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { NotificationManager } from 'react-notifications';
import App from './App';
import { EventProvider } from './context/EventContext';
import { defaultTokenStore } from './services/tokenStore';
import { DEMO_TOKEN, DEMO_USER, mockApi, pageOf, seedEvents } from './testing/mockApi';

/**
 * End-to-end-ish coverage of the auth flow through the real router: sign in,
 * make a protected call, sign out. Only the network is faked.
 */
const renderApp = (route = '/') =>
  render(
    <EventProvider tokenStore={defaultTokenStore}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </EventProvider>
  );

const stubLists = (mock) => {
  mock.onGet('/api/v1/events').reply(() => pageOf(seedEvents.organized));
  mock.onGet('/api/v1/events/joined_events').reply(() => pageOf(seedEvents.joined));
  mock.onGet('/api/v1/events/get_events').reply(() => pageOf(seedEvents.joinable));
};

let mock;
beforeEach(() => {
  mock = mockApi();
  jest.spyOn(NotificationManager, 'success').mockImplementation(() => {});
  jest.spyOn(NotificationManager, 'error').mockImplementation(() => {});
});
afterEach(() => {
  mock.restore();
  jest.restoreAllMocks();
});

describe('routing', () => {
  it('redirects an anonymous visitor away from the dashboard before it can fetch', async () => {
    stubLists(mock);

    renderApp('/');

    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
    expect(mock.history.get).toHaveLength(0);
  });

  it('guards the event detail route too', async () => {
    renderApp('/events/7');

    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('renders a 404 page for an unknown path', async () => {
    renderApp('/nope');

    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});

describe('auth flow', () => {
  it('signs in, loads the dashboard with a bearer token, and signs out again', async () => {
    const user = userEvent.setup();
    stubLists(mock);
    mock
      .onPost('/login')
      .reply(
        200,
        { status: { code: 200, data: { user: DEMO_USER } } },
        { authorization: DEMO_TOKEN }
      );
    mock.onDelete('/logout').reply(200, { status: 200 });

    renderApp('/');

    // 1. Anonymous: bounced to the sign-in form.
    await screen.findByRole('heading', { name: /^sign in$/i });

    await user.type(screen.getByLabelText(/email/i), DEMO_USER.email);
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // 2. Signed in: the dashboard renders and the lists load.
    expect(
      await screen.findByRole('heading', { name: /welcome back, ada\./i })
    ).toBeInTheDocument();
    const myEvents = screen.getByRole('region', { name: /my events/i });
    await waitFor(() =>
      expect(within(myEvents).getAllByRole('heading', { level: 3 })).toHaveLength(
        seedEvents.organized.length
      )
    );

    // 3. Every protected request carried the token, and /login carried none.
    expect(mock.history.get.length).toBeGreaterThanOrEqual(3);
    mock.history.get.forEach((request) => {
      expect(request.headers.Authorization).toBe(DEMO_TOKEN);
    });
    expect(mock.history.post[0].headers.Authorization).toBeUndefined();
    expect(defaultTokenStore.getToken()).toBe(DEMO_TOKEN);

    // 4. Sign out revokes server-side and clears the local session.
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(mock.history.delete).toHaveLength(1));
    expect(mock.history.delete[0].headers.Authorization).toBe(DEMO_TOKEN);
    expect(defaultTokenStore.getToken()).toBeNull();
    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('signs out locally even when the server rejects the revocation', async () => {
    const user = userEvent.setup();
    stubLists(mock);
    defaultTokenStore.save({ token: DEMO_TOKEN, user: DEMO_USER });
    mock
      .onDelete('/logout')
      .reply(401, { status: 401, message: "Couldn't find an active session." });

    renderApp('/');

    await user.click(await screen.findByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(defaultTokenStore.getToken()).toBeNull());
    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('shows the signed-in identity in the navigation bar', async () => {
    stubLists(mock);
    defaultTokenStore.save({ token: DEMO_TOKEN, user: DEMO_USER });

    renderApp('/');

    const nav = await screen.findByRole('navigation');
    expect(within(nav).getByText(DEMO_USER.email)).toBeInTheDocument();
  });
});
