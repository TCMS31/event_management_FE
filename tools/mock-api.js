#!/usr/bin/env node
/**
 * A stand-in for `event_management_app_BE`, implementing exactly the slice of
 * its contract this client uses — including the pagination headers, the 403 on
 * a cross-user write and the 404 on a missing event.
 *
 * It exists so the UI can be run, demonstrated and screenshotted without a
 * Rails app and a Postgres instance. It is a development tool: it is never
 * imported by `src/`, never bundled, and holds everything in memory.
 *
 *   node tools/mock-api.js            # listens on $MOCK_API_PORT (default 8681)
 */
const http = require('node:http');
const { URL } = require('node:url');

const seed = require('../src/testing/seedEvents.json');

const PORT = Number(process.env.MOCK_API_PORT || 8681);
const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 100;
const TOKEN = 'Bearer mock-session-token';
const DEMO_USER = seed.users[0];

/** Every event, keyed by id, plus who has joined what. */
const events = new Map();
[...seed.organized, ...seed.joined, ...seed.joinable].forEach((event) =>
  events.set(event.id, { ...event })
);
const joinedIds = new Set(seed.joined.map((event) => event.id));

const json = (res, status, body, headers = {}) => {
  const payload = body === null ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'Authorization, X-Total-Count, X-Page, X-Per-Page',
    ...headers,
  });
  res.end(payload);
};

const paginate = (res, rows, query) => {
  const page = Math.max(Number.parseInt(query.get('page') || '1', 10) || 1, 1);
  const requested = Number.parseInt(query.get('per_page') || '', 10);
  const perPage = Math.min(requested > 0 ? requested : DEFAULT_PER_PAGE, MAX_PER_PAGE);
  const slice = rows.slice((page - 1) * perPage, page * perPage);

  json(res, 200, slice, {
    'X-Total-Count': String(rows.length),
    'X-Page': String(page),
    'X-Per-Page': String(perPage),
  });
};

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

const isAuthed = (req) => req.headers.authorization === TOKEN;

const organizedRows = () => [...events.values()].filter((e) => e.organizer_id === DEMO_USER.id);
const joinedRows = () => [...events.values()].filter((e) => joinedIds.has(e.id));
const joinableRows = () =>
  [...events.values()].filter((e) => e.organizer_id !== DEMO_USER.id && !joinedIds.has(e.id));

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname, searchParams } = url;
  const method = req.method;

  if (method === 'OPTIONS') return json(res, 204, null);
  if (pathname === '/up') return json(res, 200, { status: 'ok' });

  if (pathname === '/login' && method === 'POST') {
    const body = await readBody(req);
    if (!body.user?.email || !body.user?.password) {
      return json(res, 401, { error: 'Invalid Email or password.' });
    }
    return json(
      res,
      200,
      { status: { code: 200, message: 'Logged in successfully.', data: { user: DEMO_USER } } },
      { Authorization: TOKEN }
    );
  }

  if (pathname === '/signup' && method === 'POST') {
    const body = await readBody(req);
    if (!body.user?.email) return json(res, 422, { status: ['Email is invalid'] });
    return json(res, 200, {
      status: { code: 200, message: 'Signed up successfully.' },
      data: DEMO_USER,
    });
  }

  if (pathname === '/logout' && method === 'DELETE') {
    if (!isAuthed(req))
      return json(res, 401, { status: 401, message: "Couldn't find an active session." });
    return json(res, 200, { status: 200, message: 'Logged out successfully.' });
  }

  if (!pathname.startsWith('/api/v1/events')) return json(res, 404, { errors: ['Not found'] });
  if (!isAuthed(req)) return json(res, 401, { errors: ['You need to sign in before continuing.'] });

  if (pathname === '/api/v1/events/get_events' && method === 'GET') {
    return paginate(res, joinableRows(), searchParams);
  }

  if (pathname === '/api/v1/events/joined_events' && method === 'GET') {
    return paginate(res, joinedRows(), searchParams);
  }

  if (pathname === '/api/v1/events/add_user_to_events' && method === 'POST') {
    const id = Number(searchParams.get('event_id'));
    const event = events.get(id);
    if (!event) return json(res, 404, { errors: ['Event not found'] });
    if (event.organizer_id === DEMO_USER.id)
      return json(res, 403, { errors: ['You are not allowed to do that.'] });
    joinedIds.add(id);
    return json(res, 201, { id, user_id: DEMO_USER.id, event_id: id });
  }

  if (pathname === '/api/v1/events' && method === 'GET') {
    return paginate(res, organizedRows(), searchParams);
  }

  if (pathname === '/api/v1/events' && method === 'POST') {
    const body = await readBody(req);
    const event = {
      id: Math.max(0, ...events.keys()) + 1,
      organizer_id: DEMO_USER.id,
      name: body.event?.name ?? '',
      description: body.event?.description ?? '',
      date: body.event?.date ?? new Date().toISOString(),
      location: body.event?.location ?? '',
    };
    if (!event.name) return json(res, 422, { attributes_errors: { name: ["can't be blank"] } });
    events.set(event.id, event);
    return json(res, 201, event);
  }

  const match = pathname.match(/^\/api\/v1\/events\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    const event = events.get(id);
    if (!event) return json(res, 404, { errors: ['Event not found'] });

    if (method === 'GET') return json(res, 200, event);

    // Fail-closed authorization, mirroring EventPolicy in the API.
    if (event.organizer_id !== DEMO_USER.id) {
      return json(res, 403, { errors: ['You are not allowed to do that.'] });
    }
    if (method === 'PATCH' || method === 'PUT') {
      const body = await readBody(req);
      const updated = { ...event, ...body.event, id, organizer_id: event.organizer_id };
      events.set(id, updated);
      return json(res, 200, updated);
    }
    if (method === 'DELETE') {
      events.delete(id);
      joinedIds.delete(id);
      return json(res, 204, null);
    }
  }

  return json(res, 404, { errors: ['Not found'] });
});

server.listen(PORT, () => {
  process.stdout.write(
    `mock API listening on http://localhost:${PORT} ` +
      `(${events.size} events, demo user ${DEMO_USER.email})\n`
  );
});
