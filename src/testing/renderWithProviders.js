import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EventProvider } from '../context/EventContext';
import { defaultTokenStore } from '../services/tokenStore';

/**
 * Renders a component inside the providers the app really uses.
 *
 * The toast container is deliberately *not* mounted: `NotificationManager` is a
 * module-level singleton whose queue outlives a render, so a container would
 * leak notifications between tests. Tests assert on `NotificationManager`
 * directly instead.
 *
 * The default token store is the application's own — `setupTests.js` empties it
 * between tests. Sharing it with the `api` singleton is the point: a test that
 * passes a `session` genuinely causes the request interceptor to attach a
 * token, rather than asserting against a store nothing reads.
 */
export const renderWithProviders = (
  ui,
  { route = '/', path = null, session = null, tokenStore = defaultTokenStore } = {}
) => {
  if (session) tokenStore.save(session);

  const wrapped = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  const result = render(
    <EventProvider tokenStore={tokenStore}>
      <MemoryRouter initialEntries={[route]}>{wrapped}</MemoryRouter>
    </EventProvider>
  );

  return { ...result, tokenStore };
};

export default renderWithProviders;
