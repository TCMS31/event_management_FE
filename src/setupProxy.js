/**
 * Development proxy.
 *
 * The bundle calls the API with same-origin paths (`/api/v1/...`, `/login`),
 * which is what the production deployment serves. Without this file the CRA dev
 * server answers those paths itself with `index.html`, so every request
 * resolves to HTML and every screen fails — the state this repository was in.
 *
 * Point it at the real Rails app, or at `npm run mock-api`:
 *
 *   API_PROXY_TARGET=http://localhost:3000 npm start
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

const TARGET = process.env.API_PROXY_TARGET || 'http://localhost:8681';

/** Always the API. */
const API_PATHS = ['/api', '/up'];

/**
 * Also client-side routes, so only the writes belong upstream: a browser
 * navigating to /login must receive the app, not JSON.
 */
const AUTH_PATHS = ['/login', '/logout', '/signup'];

module.exports = (app) => {
  const proxy = createProxyMiddleware({ target: TARGET, changeOrigin: true, logLevel: 'warn' });

  app.use(API_PATHS, proxy);
  app.use(AUTH_PATHS, (req, res, next) => (req.method === 'GET' ? next() : proxy(req, res, next)));
};
