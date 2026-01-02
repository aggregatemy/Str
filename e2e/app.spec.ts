import { test, expect } from '@playwright/test';

test.describe('Application E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page title or header is present
    await expect(page.getByText('Repozytorium Aktów')).toBeVisible();
  });

  test('should have time range selector buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check for time range buttons
    await expect(page.getByText('7 dni')).toBeVisible();
    await expect(page.getByText('30 dni')).toBeVisible();
    await expect(page.getByText('90 dni')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation tabs
    await expect(page.getByText('Dane Faktograficzne')).toBeVisible();
    
    // Click on different tabs
    await page.getByText('Zarchiwizowane').click();
    await expect(page.getByText('Zarchiwizowane')).toBeVisible();
    
    await page.getByText('Parametry API').click();
    await expect(page.getByText('Architektura Ingestii Backendu')).toBeVisible();
  });

  test('should display API sources when on Parametry API tab', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to API parameters tab
    await page.getByText('Parametry API').click();
    
    // Check for API sources
    await expect(page.getByText(/ISAP ELI/i)).toBeVisible();
    await expect(page.getByText(/ZUS/i)).toBeVisible();
  });

  test('page should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test at different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText('Repozytorium Aktów')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Repozytorium Aktów')).toBeVisible();
  });
});
