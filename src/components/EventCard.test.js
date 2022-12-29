import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationManager } from 'react-notifications';
import EventCard from './EventCard';
import renderWithProviders from '../testing/renderWithProviders';
import { DEMO_TOKEN, DEMO_USER, OTHER_USER, mockApi } from '../testing/mockApi';

const ownEvent = {
  id: 7,
  name: 'Zero Downtime Migrations',
  description: 'Shipping schema changes without a maintenance window.',
  date: '2026-11-02T18:00:00.000Z',
  location: 'Federation House, Manchester',
  organizer_id: DEMO_USER.id,
};

const otherEvent = {
  ...ownEvent,
  id: 8,
  name: "Someone else's event",
  organizer_id: OTHER_USER.id,
};

const session = { token: DEMO_TOKEN, user: DEMO_USER };

let mock;
let notifyError;
beforeEach(() => {
  mock = mockApi();
  notifyError = jest.spyOn(NotificationManager, 'error').mockImplementation(() => {});
});
afterEach(() => {
  mock.restore();
  notifyError.mockRestore();
});

describe('EventCard ownership controls', () => {
  it('offers edit and delete on an event the signed-in user organizes', () => {
    renderWithProviders(<EventCard event={ownEvent} canJoin />, { session });

    expect(screen.getByRole('button', { name: /edit event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete zero downtime/i })).toBeInTheDocument();
    // The API answers 403 if an organizer tries to join their own event.
    expect(screen.queryByRole('button', { name: /^join event$/i })).not.toBeInTheDocument();
  });

  it("offers neither edit nor delete on another user's event", () => {
    renderWithProviders(<EventCard event={otherEvent} canJoin />, { session });

    expect(screen.queryByRole('button', { name: /edit event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join event/i })).toBeInTheDocument();
  });

  it('hides the controls when the identity is unknown, rather than assuming ownership', () => {
    renderWithProviders(<EventCard event={ownEvent} />, {
      session: { token: DEMO_TOKEN, user: null },
    });

    expect(screen.queryByRole('button', { name: /edit event/i })).not.toBeInTheDocument();
  });

  it('deletes through the API and only after the confirmation is accepted', async () => {
    const user = userEvent.setup();
    mock.onDelete('/api/v1/events/7').reply(204);

    renderWithProviders(<EventCard event={ownEvent} />, { session });

    await user.click(screen.getByRole('button', { name: /delete zero downtime/i }));
    expect(mock.history.delete).toHaveLength(0);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /delete event/i }));

    await waitFor(() => expect(mock.history.delete).toHaveLength(1));
    expect(mock.history.delete[0].headers.Authorization).toBe(DEMO_TOKEN);
  });

  it('shows the API error message when joining is refused', async () => {
    const user = userEvent.setup();
    mock
      .onPost('/api/v1/events/add_user_to_events?event_id=8')
      .reply(403, { errors: ['You are not allowed to do that.'] });

    renderWithProviders(<EventCard event={otherEvent} canJoin />, { session });

    await user.click(screen.getByRole('button', { name: /join event/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /join event/i }));

    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith('You are not allowed to do that.', 'Error')
    );
  });
});
