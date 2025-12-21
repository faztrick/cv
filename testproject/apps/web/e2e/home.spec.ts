import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/FanHouse Vertical Slice/);
});

test('homepage has main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /FanHouse MVP/i })).toBeVisible();
});

test('can navigate to feed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Explore the feed/i }).click();
  await expect(page).toHaveURL(/.*\/feed/);
});
