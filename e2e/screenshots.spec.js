const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SHOTS = path.join(__dirname, '..', 'docs', 'screenshots');

/** Scrolls `selector` to just under the fixed navigation bar. */
const scrollToSection = async (page, selector, offset = 84) => {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off });
    },
    [selector, offset]
  );
};

const signIn = async (page) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Welcome back, Ada\./ })).toBeVisible();
  // Reload so the "signed in" toast is not covering the navigation bar. The
  // session lives in localStorage, so this stays signed in.
  await page.reload();
  await expect(page.getByRole('heading', { name: /Welcome back, Ada\./ })).toBeVisible();
};

test.describe('README screenshots', () => {
  test('dashboard', async ({ page }) => {
    await signIn(page);
    const mine = page.getByRole('region', { name: 'My events' });
    await expect(mine.getByRole('heading', { level: 3 }).first()).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, '01-dashboard.png') });
  });

  test('my events and joined events', async ({ page }) => {
    await signIn(page);
    await scrollToSection(page, '#my-events');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, '02-my-events.png') });
  });

  test('paginated joinable list', async ({ page }) => {
    await signIn(page);
    const section = page.getByRole('region', { name: 'Join upcoming events' });
    await expect(section.getByText('50 of 62')).toBeVisible();
    await page.getByRole('button', { name: /Load more/ }).scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, -240);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, '03-pagination.png') });
  });

  test('event detail', async ({ page }) => {
    await signIn(page);
    await page.goto('/events/1');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, '04-event-detail.png') });
  });

  test('create event form', async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Create an event' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Event name').fill('Reading Other People’s Code');
    await dialog
      .getByLabel('Description')
      .fill('A structured method for getting productive in an unfamiliar codebase in a week.');
    await dialog.getByLabel('Location').fill('Federation House, Manchester');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, '05-create-event.png') });
  });

  test('sign in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SHOTS, '06-sign-in.png') });
  });
});
