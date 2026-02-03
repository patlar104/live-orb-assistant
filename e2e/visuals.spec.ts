import { expect, test } from '@playwright/test';

test('visuals render consistently', async ({ page }) => {
  await page.goto('/');

  await page.addStyleTag({
    content:
      'gdm-live-audio, gdm-live-audio-visuals-3d { display: block; width: 100vw; height: 100vh; }',
  });

  await page.waitForTimeout(1000);
  await expect(page).toHaveScreenshot('live-audio-visuals.png', {
    fullPage: true,
  });
});
