import MockAdapter from 'axios-mock-adapter';
import { createApiClient, describeApiError } from './api';
import { createMemoryTokenStore } from './tokenStore';

describe('api client', () => {
  it('attaches the stored token verbatim, without adding a second Bearer prefix', async () => {
    const tokenStore = createMemoryTokenStore();
    tokenStore.save({ token: 'Bearer abc.def.ghi', user: { id: 1 } });
    const client = createApiClient({ tokenStore });
    const mock = new MockAdapter(client);
    mock.onGet('/api/v1/events').reply(200, []);

    await client.get('/api/v1/events');

    expect(mock.history.get[0].headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('never sends a token to /login or /signup', async () => {
    const tokenStore = createMemoryTokenStore();
    tokenStore.save({ token: 'Bearer stale', user: null });
    const client = createApiClient({ tokenStore });
    const mock = new MockAdapter(client);
    mock.onPost('/login').reply(200, {});
    mock.onPost('/signup').reply(200, {});

    await client.post('/login', {});
    await client.post('/signup', {});

    expect(mock.history.post[0].headers.Authorization).toBeUndefined();
    expect(mock.history.post[1].headers.Authorization).toBeUndefined();
  });

  it('omits the header entirely when there is no session', async () => {
    const client = createApiClient({ tokenStore: createMemoryTokenStore() });
    const mock = new MockAdapter(client);
    mock.onGet('/api/v1/events').reply(200, []);

    await client.get('/api/v1/events');

    expect(mock.history.get[0].headers.Authorization).toBeUndefined();
  });

  it('clears the session and notifies on a 401', async () => {
    const tokenStore = createMemoryTokenStore();
    tokenStore.save({ token: 'Bearer expired', user: { id: 1 } });
    const onUnauthorized = jest.fn();
    const client = createApiClient({ tokenStore, onUnauthorized });
    const mock = new MockAdapter(client);
    mock.onGet('/api/v1/events').reply(401, { errors: ['You need to sign in.'] });

    await expect(client.get('/api/v1/events')).rejects.toBeDefined();

    expect(tokenStore.getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});

describe('describeApiError', () => {
  const asError = (data) => ({ response: { data } });

  it('reads the {errors: []} envelope', () => {
    expect(describeApiError(asError({ errors: ['Event not found'] }))).toBe('Event not found');
  });

  it('flattens the {attributes_errors: {}} envelope', () => {
    expect(describeApiError(asError({ attributes_errors: { name: ["can't be blank"] } }))).toBe(
      "name can't be blank"
    );
  });

  it("reads Devise's bare {status: []} array from /signup", () => {
    expect(describeApiError(asError({ status: ['Email has already been taken'] }))).toBe(
      'Email has already been taken'
    );
  });

  it('falls back when the response carries no recognised envelope', () => {
    expect(describeApiError(new Error('offline'), 'Could not load events.')).toBe(
      'Could not load events.'
    );
  });
});
