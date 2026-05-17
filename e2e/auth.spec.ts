import { test, expect } from '@playwright/test';

test.describe('Authentication and RBAC Workflow', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('successfully logs in with employee credentials and sees goals', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'priya.sharma@atomquest.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Check RBAC: Employee shouldn't see 'Team' link which is for managers
    const teamLink = page.locator('a:has-text("Team")');
    await expect(teamLink).toHaveCount(0);
  });
});
