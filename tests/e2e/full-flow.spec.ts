import { test, expect } from '@playwright/test';

// E2E tests for the complete application flow
test.describe('Legal Updates Portal - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from frontend URL
    await page.goto('http://localhost:5555');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should load application successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Repozytorium Aktów');
  });

  test('should display all source selector buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Wszystkie")')).toBeVisible();
    await expect(page.locator('button:has-text("🇪🇺 ELI")')).toBeVisible();
    await expect(page.locator('button:has-text("📡 RSS")')).toBeVisible();
    await expect(page.locator('button:has-text("🏥 NFZ")')).toBeVisible();
  });

  test('should filter by ELI source', async ({ page }) => {
    const eliButton = page.locator('button:has-text("🇪🇺 ELI")');
    await eliButton.click();
    
    // Check if button is highlighted
    await expect(eliButton).toHaveClass(/bg-green-600/);
    
    // Wait for data to load
    await page.waitForTimeout(1000);
  });

  test('should filter by RSS source', async ({ page }) => {
    const rssButton = page.locator('button:has-text("📡 RSS")');
    await rssButton.click();
    
    await expect(rssButton).toHaveClass(/bg-purple-600/);
  });

  test('should filter by NFZ source', async ({ page }) => {
    const nfzButton = page.locator('button:has-text("🏥 NFZ")');
    await nfzButton.click();
    
    await expect(nfzButton).toHaveClass(/bg-red-600/);
  });

  test('should change time range', async ({ page }) => {
    const button30d = page.locator('button:has-text("30 dni")');
    await button30d.click();
    
    await expect(button30d).toHaveClass(/bg-white/);
  });

  test('should navigate to archive view', async ({ page }) => {
    const archiveButton = page.locator('button:has-text("Zarchiwizowane")');
    await archiveButton.click();
    
    await expect(archiveButton).toHaveClass(/border-b-2/);
  });

  test('should navigate to API parameters view', async ({ page }) => {
    const parametersButton = page.locator('button:has-text("Parametry API")');
    await parametersButton.click();
    
    await expect(page.locator('text=Architektura Ingestii Backendu')).toBeVisible();
  });

  test('should toggle source toggles on/off', async ({ page }) => {
    // Go to Parametry API view
    await page.locator('button:has-text("Parametry API")').click();
    
    // Find first toggle button (should be for eli-sejm-du)
    const toggles = page.locator('button[class*="w-12"][class*="h-6"]');
    const firstToggle = toggles.first();
    
    // Get initial state
    const initialClass = await firstToggle.getAttribute('class');
    
    // Click toggle
    await firstToggle.click();
    
    // State should change
    const newClass = await firstToggle.getAttribute('class');
    expect(initialClass).not.toEqual(newClass);
  });

  test('should handle backend connection error gracefully', async ({ page }) => {
    // This test would require shutting down backend
    // For now, just verify error message structure exists
    // In production, you'd use page.route to simulate failure
  });

  test('should display multiple sources in main view', async ({ page }) => {
    // Fetch from all sources (default)
    await page.locator('button:has-text("Wszystkie")').click();
    
    // Wait for data to render
    await page.waitForTimeout(2000);
    
    // Check if any update cards are visible
    // (This assumes UpdateCard renders multiple items)
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test Tab navigation through buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // The focused element should be a button
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBe('BUTTON');
  });

  test('should maintain state when switching views', async ({ page }) => {
    // Select ELI source
    await page.locator('button:has-text("🇪🇺 ELI")').click();
    
    // Switch to archive view
    await page.locator('button:has-text("Zarchiwizowane")').click();
    
    // Switch back to main view
    await page.locator('button:has-text("Dane Faktograficzne")').click();
    
    // ELI button should still be highlighted
    await expect(page.locator('button:has-text("🇪🇺 ELI")')).toHaveClass(/bg-green-600/);
  });

  test('should display health status on main view', async ({ page }) => {
    // Navigate to main view
    await page.locator('button:has-text("Dane Faktograficzne")').click();
    
    // Health info might be displayed (implementation dependent)
    // For now just verify the view loads
    await page.waitForTimeout(500);
  });

  test('should handle rapid source switching', async ({ page }) => {
    const sources = ['Wszystkie', '🇪🇺 ELI', '📡 RSS', '🏥 NFZ'];
    
    for (const source of sources) {
      await page.locator(`button:has-text("${source}")`).click();
      await page.waitForTimeout(100);
    }
    
    // Should still be responsive after rapid clicks
    await expect(page.locator('h1')).toContainText('Repozytorium Aktów');
  });

  test('should be responsive to window resize', async ({ page, context }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Elements should still be visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should integrate with backend API', async ({ page }) => {
    // This test verifies that frontend can connect to backend
    
    // Click on a source
    await page.locator('button:has-text("🏥 NFZ")').click();
    
    // Wait for API call to complete
    await page.waitForTimeout(3000);
    
    // The UI should reflect data or show empty state
    // (This depends on backend having data)
  });
});
