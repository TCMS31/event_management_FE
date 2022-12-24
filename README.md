# Event Management — React client

A browser client for the `event_management_app_BE` Rails API. A signed-in user sees
three lists — events they organize, events they have booked, and upcoming events
someone else is running — and can create, edit, delete or join one.

No database here and nothing server-rendered: this repo is one bundle that talks to
eleven JSON endpoints and stores a bearer token. Almost every decision below follows
from one detail of that API — **the token arrives in a response header, not the body.**

## The screens

Real renders at 1440×900 and at phone width (390×844), produced by
`npm run screenshots`: Playwright drives the production bundle against the in-repo
mock API, so the data is the seed fixture, not a mock-up. The "Load more (12
remaining)" button in the third shot is the whole pagination story in one control.

|                                                                                                    |                                                                            |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **The dashboard**<br>![Dashboard](docs/screenshots/01-dashboard.png)                               | **Events you organize**<br>![My events](docs/screenshots/02-my-events.png) |
| **A capped list, honest about the remainder**<br>![Pagination](docs/screenshots/03-pagination.png) | **Event detail**<br>![Event detail](docs/screenshots/04-event-detail.png)  |
| **Creating an event**<br>![Create event](docs/screenshots/05-create-event.png)                     | **Signing in**<br>![Sign in](docs/screenshots/06-sign-in.png)              |

<p>
  <img src="docs/screenshots/07-mobile-dashboard.png" alt="Dashboard at phone width" width="260" />
  &nbsp;
  <img src="docs/screenshots/08-mobile-event-detail.png" alt="Event detail at phone width" width="260" />
</p>

The look is a community noticeboard: warm paper, ink, a deep green for actions,
vermilion and mustard for what should catch the eye, Fraunces for headings and
Atkinson Hyperlegible for body text. Every card reuses the one stock photograph,
tinted from the event id so a grid stays readable.

## Run it

Node 22 (see `.nvmrc`). Two terminals; no database, no Docker, no Rails.

```bash
npm ci
npm run mock-api          # terminal 1 — stand-in API on :8681
npm start                 # terminal 2 — the app on :8680
```

Open <http://localhost:8680> and sign in as `ada@example.com`. The mock accepts any
non-empty password — it checks that the fields are present, nothing more.

Or the whole thing in containers, built exactly as it would ship (nginx serving the
bundle and proxying the API to the stand-in):

```bash
docker compose --profile mock up --build      # http://localhost:8680
```

Against the real Rails API instead:

```bash
API_PROXY_TARGET=http://localhost:3000 npm start
```

## The token never touches the body

`POST /login` answers `200` with the JWT in an `Authorization` **response header**,
already prefixed with `Bearer `. Three consequences are baked into
`src/services/api.js`: the value is replayed verbatim (adding a second `Bearer ` is
the classic bug), the interceptor deliberately skips `/login` and `/signup`, and a
cross-origin deployment is broken until the API sends
`Access-Control-Expose-Headers: Authorization` — because without it the browser
hides the header, the request still succeeds, and you get a logged-in-looking app
that 401s on everything.

```mermaid
sequenceDiagram
  actor User
  participant SignIn
  participant Auth as authService
  participant Client as api (axios)
  participant Store as tokenStore
  participant Hook as useEventCollection
  participant API as Rails API

  User->>SignIn: submit email + password
  SignIn->>Auth: login
  Auth->>Client: POST /login
  Note over Client: request interceptor sends NO token here
  Client->>API: POST /login
  API-->>Client: 200 + Authorization header
  alt header absent
    Auth-->>SignIn: AuthError — no session token
    SignIn-->>User: stay on the form, show the error
  else header present
    Auth-->>SignIn: token + user
    SignIn->>Store: save
    SignIn->>User: navigate to the dashboard
  end

  Hook->>Client: GET /api/v1/events?page=1&per_page=50
  Client->>Store: getToken
  Client->>API: GET with Authorization
  API-->>Client: 200 array + X-Total-Count
```

`src/services/tokenStore.js` is the only module that touches `localStorage`, and it
is an interface — `getToken` / `getUser` / `save` / `clear` — with a
`localStorage` and an in-memory implementation. `createApiClient` and
`EventProvider` each take one by injection, which is what lets the test suite run the
**real** interceptors against an isolated session, and what a move to `HttpOnly`
cookies would replace.

## A list is a state machine, not an array

The API caps a list at 50 rows and reports the real size in `X-Total-Count`. A client
that renders `response.data` shows page one and quietly implies it is everything.
`parseListResponse` reads the headers instead and returns
`{items, page, perPage, total, hasMore}`; all three lists share one hook and one
component, so they cannot disagree.

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> loading: hook mounts, requests page 1
  loading --> ready: COLLECTION_LOADED
  loading --> error: COLLECTION_FAILED
  error --> loading: Try again
  ready --> loading: Load more, next page appended
  note right of ready
    Header shows 50 of 62 while hasMore is true.
    An empty array is an empty state, not a spinner.
    A 401 anywhere clears the session instead.
  end note
```

Those four states are `EventSection.jsx`, written once: skeleton cards, an error with
a working retry, an honest empty message, or rows plus the remainder button. The
`append` flag on `COLLECTION_LOADED` is how "Load more" grows a list without
refetching page one — `eventReducer.test.js` pins it, along with the transition that
moves a joined event out of _joinable_ and into _joined_ in a single step. (The
screenshot's arithmetic: the seed fixture holds 62 joinable events, so a 50-row first
page leaves the 12 the button offers.)

Page numbers are offsets on the server, so a local change moves them: join one event
from page one and every later row slides up a place. "Load more" therefore asks for
the page that follows from the number of rows already on screen, not "last page + 1",
and an appended page drops ids that are already listed. Without that, joining an
event and then loading more silently skipped one, and creating one repeated a row.

A `401` from any call clears the stored token **and** signs the UI out: the axios
client publishes "session expired", `EventProvider` dispatches `SIGN_OUT`, and
`ProtectedRoute` sends the user back to the sign-in form.

## Which buttons appear, and why

The API is the authority — a cross-user `PATCH` or `DELETE` is `403`, and the policy
behind it refuses `join` to the event's own organizer. The UI mirrors that rather
than guessing:

- `isOrganizedBy(event, user)` compares `event.organizer_id` with the signed-in
  user's id and **fails closed** when either is missing. Edit and delete hang off
  that, not off which list drew the card. `EventCard.test.jsx` includes _"hides the
  controls when the identity is unknown, rather than assuming ownership"_.
- "Join event" is offered only on a card marked joinable that the user does not
  organize. If the server refuses anyway, `describeApiError` unwraps whichever
  envelope came back — `{errors: [...]}` for the `403`, `{attributes_errors: {...}}`
  for the duplicate-booking `422`, and Devise's bare `{status: [...]}` from
  `/signup` — and the message goes into a toast.
- `ProtectedRoute` renders a `<Navigate>` rather than calling `navigate()` from an
  effect, so an anonymous visitor fires **zero** API requests, per `App.test.jsx`.

There is **no capacity or waitlist anywhere in this client**, because the API has no
seat-count column. Nothing here can tell you an event is full.

## Settings

Vite substitutes `VITE_*` at **build** time, so changing one means rebuilding, not
restarting. Copy `.env.example` to `.env.local`.

| Name               | Default                 | Purpose                                                                                               |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`     | `''` (same origin)      | Only needed for a cross-origin API, which then also needs CORS and the exposed `Authorization` header |
| `PORT`             | `8680`                  | Dev server. Not `3000`, which is the Rails API's                                                      |
| `API_PROXY_TARGET` | `http://localhost:8681` | Where the dev server's proxy (`vite.config.mjs`) forwards API calls                                   |
| `MOCK_API_PORT`    | `8681`                  | Port for `npm run mock-api`                                                                           |
| `SCREENSHOT_PORT`  | `8680`                  | Port `tools/serve-build.js` uses during a screenshot run                                              |
| `WEB_PORT`         | `8680`                  | Host port published by `docker-compose.yml`                                                           |

## Commands

```bash
npm start            # Vite dev server + API proxy
npm test             # Vitest, once
npm run test:watch   # Vitest in watch mode
npm run lint         # ESLint (react, hooks, jsx-a11y, Prettier as errors)
npm run format:check # Prettier, read-only
npm run build        # production bundle into build/
npm run preview      # serve build/ locally
npm run mock-api     # the stand-in API
npm run screenshots  # rebuild the images above (run `npm run build` first)
```

`npm run build` produces an entry bundle of roughly **100 kB gzipped** plus a
**45 kB** chunk holding the date-picker-heavy event form, which is fetched only when
the modal opens. `EventDetails` and `SignUp` are split out the same way, since both
are reached by a click.

A real curl transcript against the Docker Compose stack (nginx in front, mock API
behind): a sign-in returning the header, the second page of a list declaring
`X-Total-Count: 62`, a cross-user `403`, a tokenless `401`, and the caching and
security headers nginx adds. It is in
[`docs/captured/compose-session.txt`](docs/captured/compose-session.txt).

## Where the code lives

```
src/services/       nothing below this line imports React
  api.js            axios instance, the two interceptors, error envelopes,
                    the "session expired" signal
  tokenStore.js     the session seam (localStorage | memory)
  eventService.js   every endpoint, parseListResponse, isOrganizedBy
  notify.js         toast publisher; components/Toaster.jsx renders it
src/context/        EventContext provider + the pure eventReducer
src/hooks/          useEventCollection — loads and pages one collection
src/components/     EventSection (the four states), EventCard (ownership
                    gating), EventForm (lazy), ProtectedRoute, auth screens
src/layouts/Home.jsx the signed-in dashboard, three sections
src/testing/        test helpers and the shared seed fixture
tools/mock-api.js   stand-in API for dev, demo and screenshots
e2e/                Playwright screenshot capture
docker/nginx.conf   runtime server and reverse proxy
vite.config.mjs     build, dev proxy and Vitest settings
```

## What the tests hold down

`npm test` → **68 tests across 13 files, all passing** (Vitest + Testing Library on
jsdom, run on this tree).
Every test mocks at the axios adapter on the app's _own_ instance, so the real
request and response interceptors execute; nothing reaches the network and nothing
needs Rails.

Two test names carry their own history, which is worth more than a claim in prose:

- _"binds both inputs to state (regression: they were bound to `formData.email`,
  state was `formData.user.email`)"_ — the sign-in form's fields.
- _"renders the empty state for the API's `200 []` (it used to answer `204`)"_ — the
  list contract.

The rest: token attached verbatim and withheld from `/login`, the `401` sweep, all
three error envelopes, pagination parsing including the header-less fallback, the
reducer's transitions, ownership gating, the four list states, "Load more" after a
join, `404` versus `500` on the detail page, the event form's create/edit/error paths,
sign-up validation, storage that throws, toasts, and full sign-in → dashboard →
sign-out and expired-token drives in `App.test.jsx`.

## Shipping it

```bash
docker compose --profile mock up --build     # app + the stand-in API
```

Multi-stage image (Node 22 build, nginx 1.30 runtime), unprivileged user, a
`HEALTHCHECK` on `/healthz`, and an nginx config that serves the SPA and proxies the
API so the browser sees one origin. Without `--profile mock` the `web` service expects
the Rails API on the `api` hostname of a shared network.

Running it for the first time turned up three bugs that a parse-only check could
not: nginx as the unprivileged user could not write its pid file, a location that set
`Cache-Control` silently dropped the security headers, and a `HEAD /login` was
proxied to the API instead of serving the app. All three are fixed, and the stack
comes up healthy.

## Known gaps

- **`public/_redirects` points at a placeholder API host** (`api.example.com`). Replace
  it with your own Rails deployment before publishing to Netlify.
- **`tools/mock-api.js` is not Rails.** It reimplements the slice of the contract
  this client uses, in memory, with no real authentication — and it will not notice
  if the API changes. A contract test over shared fixtures would be the real fix.
- **Pagination is "load more", not deep paging.** No page numbers, no URL state, so a
  reload starts at page one. Deliberate for lists of tens of rows.
- **One stock photograph.** Cards are tinted deterministically from the event id so a
  grid is readable. There is no per-event image upload.
- **No capacity, and no way to add one from here.** See above.
- **`e2e/` captures screenshots; it asserts very little.** Behaviour is pinned by the
  unit suite, which mocks at the axios adapter, so nothing here runs against Rails.

## License

MIT, see [LICENSE](LICENSE).
