import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'http://localhost:8681';

  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT || 8680),
      strictPort: true,
      // The bundle calls the API on its own origin, as it does behind nginx in
      // production. `/login`, `/logout` and `/signup` are also client-side
      // routes, so only non-GET requests to them go upstream: a browser
      // navigating to /login must receive the app, not JSON.
      proxy: {
        '/api': { target, changeOrigin: true },
        '/up': { target, changeOrigin: true },
        '^/(login|logout|signup)$': {
          target,
          changeOrigin: true,
          bypass: (req) => (req.method === 'GET' ? req.url : undefined),
        },
      },
    },
    build: {
      // `build/static/` keeps the paths docker/nginx.conf and tools/serve-build.js expect.
      outDir: 'build',
      assetsDir: 'static',
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
      include: ['src/**/*.test.{js,jsx}'],
      css: false,
    },
  };
});
