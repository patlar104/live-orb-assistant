import { expect, test } from '@playwright/test';

test('renders live audio controls', async ({ page }) => {
  await page.goto('/');

  const host = page.locator('gdm-live-audio');
  await expect(host).toHaveCount(1);

  await expect(host.locator('#startButton')).toBeEnabled();
  await expect(host.locator('#stopButton')).toBeDisabled();
  await expect(host.locator('#resetButton')).toBeEnabled();
  await expect(host.locator('gdm-live-audio-visuals-3d')).toHaveCount(1);
});

test('start and stop toggle recording state', async ({ page }) => {
  await page.goto('/');

  const host = page.locator('gdm-live-audio');
  const start = host.locator('#startButton');
  const stop = host.locator('#stopButton');

  await start.click();
  await expect(stop).toBeEnabled();
  await expect(start).toBeDisabled();

  await stop.click();
  await expect(start).toBeEnabled();
});
