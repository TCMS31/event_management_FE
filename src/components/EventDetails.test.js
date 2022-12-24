import React from 'react';
import { screen } from '@testing-library/react';
import EventDetails from './EventDetails';
import renderWithProviders from '../testing/renderWithProviders';
import { DEMO_TOKEN, DEMO_USER, OTHER_USER, mockApi } from '../testing/mockApi';

const session = { token: DEMO_TOKEN, user: DEMO_USER };

const renderAt = (id) =>
  renderWithProviders(<EventDetails />, { route: `/events/${id}`, path: '/events/:id', session });

let mock;
beforeEach(() => {
  mock = mockApi();
});
afterEach(() => mock.restore());

describe('EventDetails', () => {
  it('renders the event', async () => {
    mock.onGet('/api/v1/events/7').reply(200, {
      id: 7,
      name: 'Zero Downtime Migrations',
      description: 'Shipping schema changes without a maintenance window.',
      date: '2026-11-02T18:00:00.000Z',
      location: 'Federation House, Manchester',
      organizer_id: OTHER_USER.id,
    });

    renderAt(7);

    expect(await screen.findByRole('heading', { name: 'Zero Downtime Migrations' })).toBeVisible();
    expect(screen.getByText(/2 November 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/you organize this event/i)).not.toBeInTheDocument();
  });

  it('badges an event the signed-in user organizes', async () => {
    mock
      .onGet('/api/v1/events/7')
      .reply(200, { id: 7, name: 'Mine', date: null, organizer_id: DEMO_USER.id });

    renderAt(7);

    expect(await screen.findByText(/you organize this event/i)).toBeInTheDocument();
  });

  it('renders "Event not found" on the API\'s 404', async () => {
    mock.onGet('/api/v1/events/999').reply(404, { errors: ['Event not found'] });

    renderAt(999);

    expect(await screen.findByRole('heading', { name: /event not found/i })).toBeInTheDocument();
  });

  it('distinguishes a server failure from a missing event', async () => {
    mock.onGet('/api/v1/events/5').reply(500, { errors: ['Boom.'] });

    renderAt(5);

    expect(
      await screen.findByRole('heading', { name: /something went wrong/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Boom.')).toBeInTheDocument();
  });

  it('reads the id from the route, not from window.location', async () => {
    mock.onGet('/api/v1/events/42').reply(200, { id: 42, name: 'Forty two', organizer_id: 9 });

    renderAt(42);

    await screen.findByRole('heading', { name: 'Forty two' });
    expect(mock.history.get[0].url).toBe('/api/v1/events/42');
  });
});
