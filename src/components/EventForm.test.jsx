import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notify } from '../services/notify';
import EventForm from './EventForm';
import renderWithProviders from '../testing/renderWithProviders';
import { DEMO_TOKEN, DEMO_USER, mockApi } from '../testing/mockApi';

const session = { token: DEMO_TOKEN, user: DEMO_USER };

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

describe('EventForm', () => {
  it('creates an event wrapped in the {event: {...}} envelope and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mock
      .onPost('/api/v1/events')
      .reply((config) => [201, { id: 99, ...JSON.parse(config.data).event }]);

    renderWithProviders(<EventForm onClose={onClose} />, { session });

    await user.type(screen.getByLabelText(/event name/i), 'Postgres Office Hours');
    await user.type(screen.getByLabelText(/description/i), 'Bring a slow query.');
    await user.type(screen.getByLabelText(/location/i), 'Leeds');
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    const body = JSON.parse(mock.history.post[0].data);
    expect(body.event).toMatchObject({
      name: 'Postgres Office Hours',
      description: 'Bring a slow query.',
      location: 'Leeds',
    });
    expect(Number.isNaN(Date.parse(body.event.date))).toBe(false);
  });

  it('edits with a PATCH to the event, prefilled from it', async () => {
    const user = userEvent.setup();
    const event = {
      id: 7,
      name: 'Old name',
      description: 'Kept',
      location: 'York',
      date: '2026-12-01T18:00:00.000Z',
      organizer_id: DEMO_USER.id,
    };
    mock.onPatch('/api/v1/events/7').reply(200, { ...event, name: 'New name' });

    renderWithProviders(<EventForm onClose={() => {}} event={event} />, { session });

    const name = screen.getByLabelText(/event name/i);
    expect(name).toHaveValue('Old name');
    await user.clear(name);
    await user.type(name, 'New name');
    await user.click(screen.getByRole('button', { name: 'Update event' }));

    await waitFor(() => expect(mock.history.patch).toHaveLength(1));
    expect(JSON.parse(mock.history.patch[0].data).event).toMatchObject({
      name: 'New name',
      location: 'York',
      date: '2026-12-01T18:00:00.000Z',
    });
  });

  it('keeps the form open and reports a validation error', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mock.onPost('/api/v1/events').reply(422, { attributes_errors: { name: ['is too short'] } });

    renderWithProviders(<EventForm onClose={onClose} />, { session });

    await user.type(screen.getByLabelText(/event name/i), 'X');
    await user.type(screen.getByLabelText(/description/i), 'Y');
    await user.type(screen.getByLabelText(/location/i), 'Z');
    await user.click(screen.getByRole('button', { name: 'Create event' }));

    await waitFor(() => expect(notify.error).toHaveBeenCalledWith('name is too short', 'Error'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Create event' })).toBeEnabled();
  });
});
