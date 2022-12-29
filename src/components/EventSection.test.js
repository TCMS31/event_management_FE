import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinEvent from './JoinEvent';
import EventList from './EventList';
import renderWithProviders from '../testing/renderWithProviders';
import { DEMO_TOKEN, DEMO_USER, mockApi, pageOf, seedEvents } from '../testing/mockApi';

const session = { token: DEMO_TOKEN, user: DEMO_USER };
const joinable = seedEvents.joinable;

let mock;
beforeEach(() => {
  mock = mockApi();
});
afterEach(() => mock.restore());

describe('paginated event lists', () => {
  it('renders the first page and says how many rows exist in total', async () => {
    mock.onGet('/api/v1/events/get_events').reply(() => pageOf(joinable, { page: 1 }));

    renderWithProviders(<JoinEvent />, { session });

    expect(await screen.findByText(`50 of ${joinable.length}`)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(50);
    expect(
      screen.getByRole('button', { name: `Load more (${joinable.length - 50} remaining)` })
    ).toBeInTheDocument();
  });

  it('requests page 2 and appends it', async () => {
    const user = userEvent.setup();
    mock
      .onGet('/api/v1/events/get_events')
      .reply((config) => pageOf(joinable, { page: config.params.page }));

    renderWithProviders(<JoinEvent />, { session });

    await user.click(await screen.findByRole('button', { name: /load more/i }));

    await waitFor(() => expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(62));
    expect(mock.history.get.map((r) => r.params.page)).toEqual([1, 2]);
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  it('shows a skeleton while the first page is in flight', async () => {
    mock.onGet('/api/v1/events').reply(() => new Promise(() => {}));

    renderWithProviders(<EventList />, { session });

    expect(screen.getByRole('status', { name: /loading my events/i })).toBeInTheDocument();
  });

  it("renders the empty state for the API's 200 [] (it used to answer 204)", async () => {
    mock.onGet('/api/v1/events').reply(200, [], { 'x-total-count': '0' });

    renderWithProviders(<EventList />, { session });

    expect(await screen.findByText(/have not created an event yet/i)).toBeInTheDocument();
  });

  it('surfaces a failure with a retry that really refetches', async () => {
    const user = userEvent.setup();
    mock.onGet('/api/v1/events').replyOnce(500, { errors: ['Boom.'] });
    mock.onGet('/api/v1/events').reply(() => pageOf(seedEvents.organized));

    renderWithProviders(<EventList />, { session });

    expect(await screen.findByRole('alert')).toHaveTextContent('Boom.');

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText(seedEvents.organized[0].name)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mock.history.get).toHaveLength(2);
  });
});
