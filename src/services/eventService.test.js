import MockAdapter from 'axios-mock-adapter';
import api from './api';
import { DEFAULT_PER_PAGE, fetchEventPage, isOrganizedBy, parseListResponse } from './eventService';

describe('parseListResponse', () => {
  it('reads X-Total-Count and reports that more pages exist', () => {
    const result = parseListResponse({
      data: new Array(50).fill({}),
      headers: { 'x-total-count': '62', 'x-page': '1', 'x-per-page': '50' },
    });

    expect(result.items).toHaveLength(50);
    expect(result.total).toBe(62);
    expect(result.hasMore).toBe(true);
  });

  it('reports no more pages on the last page', () => {
    const result = parseListResponse({
      data: new Array(12).fill({}),
      headers: { 'x-total-count': '62', 'x-page': '2', 'x-per-page': '50' },
    });

    expect(result.page).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('degrades to "what we got is all there is" when the headers are absent', () => {
    const result = parseListResponse({ data: [{ id: 1 }], headers: {} });

    expect(result.total).toBe(1);
    expect(result.perPage).toBe(DEFAULT_PER_PAGE);
    expect(result.hasMore).toBe(false);
  });

  it('treats a non-array body as an empty list rather than crashing', () => {
    expect(parseListResponse({ data: '', headers: {} }).items).toEqual([]);
  });
});

describe('fetchEventPage', () => {
  let mock;
  beforeEach(() => {
    mock = new MockAdapter(api);
  });
  afterEach(() => mock.restore());

  it('sends page and per_page to the API', async () => {
    mock.onGet('/api/v1/events').reply(200, [], { 'x-total-count': '0' });

    await fetchEventPage('organized', { page: 3, perPage: 25 });

    expect(mock.history.get[0].params).toEqual({ page: 3, per_page: 25 });
  });

  it('rejects an unknown collection name', async () => {
    await expect(fetchEventPage('nonsense')).rejects.toThrow('Unknown event collection');
  });
});

describe('isOrganizedBy', () => {
  it('is true only when organizer_id matches the signed-in user', () => {
    expect(isOrganizedBy({ organizer_id: 1 }, { id: 1 })).toBe(true);
    expect(isOrganizedBy({ organizer_id: 2 }, { id: 1 })).toBe(false);
  });

  it('is false when either side is missing rather than defaulting to permissive', () => {
    expect(isOrganizedBy({ organizer_id: 1 }, null)).toBe(false);
    expect(isOrganizedBy({}, { id: 1 })).toBe(false);
    expect(isOrganizedBy(null, { id: 1 })).toBe(false);
  });
});
