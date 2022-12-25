#!/usr/bin/env node
/**
 * Serves `build/` as a single-page app and forwards the API paths to the mock
 * API, mirroring the production reverse proxy. Used by the screenshot run; it
 * is a development tool and is never bundled.
 */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const PORT = Number(process.env.SCREENSHOT_PORT || 8680);
const API_PORT = Number(process.env.MOCK_API_PORT || 8681);
const ROOT = path.join(__dirname, '..', 'build');
// `/api` and `/up` are always the API. `/login` and `/signup` are also client
// *routes*, so only the non-GET calls to them belong upstream — otherwise
// navigating to /login serves JSON instead of the app.
const API_PREFIXES = ['/api', '/up'];
const API_ONLY_WHEN_WRITING = ['/login', '/logout', '/signup'];

const isApiRequest = (req, pathname) =>
  API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  (req.method !== 'GET' && API_ONLY_WHEN_WRITING.includes(pathname));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(ROOT)) {
  console.error('build/ does not exist — run `npm run build` first.');
  process.exit(1);
}

const proxy = (req, res) => {
  const upstream = http.request(
    { host: '127.0.0.1', port: API_PORT, path: req.url, method: req.method, headers: req.headers },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ errors: ['Mock API unreachable'] }));
  });
  req.pipe(upstream);
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (isApiRequest(req, url.pathname)) return proxy(req, res);

    const candidate = path.join(ROOT, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''));
    const file =
      fs.existsSync(candidate) && fs.statSync(candidate).isFile()
        ? candidate
        : path.join(ROOT, 'index.html');

    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`serving build/ on http://127.0.0.1:${PORT}`));
