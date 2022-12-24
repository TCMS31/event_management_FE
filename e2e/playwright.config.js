const { defineConfig, devices } = require('@playwright/test');

/**
 * Captures the README screenshots against a real browser, a real production
 * bundle and the mock API in `tools/mock-api.js` — so the images show real,
 * fully populated screens and are reproducible with one command:
 *
 *   npm run build && npm run screenshots
 */
const APP_PORT = Number(process.env.SCREENSHOT_PORT || 8680);
const API_PORT = Number(process.env.MOCK_API_PORT || 8681);

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: /screenshots\.spec\.js/,
  outputDir: '../.playwright',
  reporter: [['list']],
  use: {
    // The device preset goes first: it carries its own 1280x720 viewport,
    // which would otherwise replace the one below.
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  },
  webServer: [
    {
      command: `node tools/mock-api.js`,
      cwd: `${__dirname}/..`,
      port: API_PORT,
      reuseExistingServer: false,
      env: { MOCK_API_PORT: String(API_PORT) },
    },
    {
      // `serve-build.js` serves the production bundle and proxies the API paths,
      // which is exactly what the deployed setup does.
      command: `node tools/serve-build.js`,
      cwd: `${__dirname}/..`,
      port: APP_PORT,
      reuseExistingServer: false,
      env: { SCREENSHOT_PORT: String(APP_PORT), MOCK_API_PORT: String(API_PORT) },
    },
  ],
});
