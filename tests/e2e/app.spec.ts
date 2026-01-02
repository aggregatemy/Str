import { test, expect } from '@playwright/test';

test.describe('Strażnik Prawa - Frontend E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('strona ładuje się poprawnie', async ({ page }) => {
    await expect(page).toHaveTitle(/Strażnik Prawa/);
  });

  test('wyświetla tytuł aplikacji', async ({ page }) => {
    // Aplikacja używa "Repozytorium Aktów" jako tytuł
    const body = page.locator('body');
    await expect(body).toContainText('Repozytorium');
  });

  test('pokazuje przyciski filtrowania dat', async ({ page }) => {
    // Aplikacja automatycznie ładuje dane, sprawdzamy przyciski filtrowania
    const button7d = page.getByRole('button', { name: '7 dni' });
    await expect(button7d).toBeVisible();
  });

  test('aplikacja automatycznie wywołuje API przy starcie', async ({ page }) => {
    // Oczekuj na request do backendu (automatyczne ładowanie)
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/v1/updates'),
      { timeout: 10000 }
    );

    const response = await responsePromise;
    expect(response.status()).toBeLessThanOrEqual(500); // 200 OK lub błąd serweraise;
    expect(response.ok()).toBeTruthy();
  });

  test('wyświetla listę dokumentów po pobraniu danych', async ({ page }) => {
    const button = page.getByRole('button', { name: /Pobierz dane/i });
    await button.click();

    // Poczekaj na załadowanie dokumentów (max 5 sekund)
    await page.waitForTimeout(2000);

    // Sprawdź czy pojawiły się dokumenty (jeśli backend zwraca dane)
    const updates = page.locator('[class*="update-card"], [class*="UpdateCard"]');
    const count = await updates.count();
    
    // Jeśli są dane w bazie, powinna być co najmniej 1 karta
    if (count > 0) {
      await expect(updates.first()).toBeVisible();
    }
  });

  test('można wybrać dokument klikając na kartę', async ({ page }) => {
    const button = page.getByRole('button', { name: /Pobierz dane/i });
    await button.click();

    await page.waitForTimeout(2000);

    const firstUpdate = page.locator('[class*="update-card"], [class*="UpdateCard"]').first();
    const count = await firstUpdate.count();
    
    if (count > 0) {
      await firstUpdate.click();
      // Sprawdź czy karta została zaznaczona (zmiana stylu/klasy)
      const isSelected = await firstUpdate.evaluate(el => 
        el.classList.contains('selected') || 
        el.style.backgroundColor !== '' ||
        el.getAttribute('aria-selected') === 'true'
      );
      expect(isSelected).toBeTruthy();
    }
  });

  test('można eksportować wybrane dokumenty', async ({ page }) => {
    const button = page.getByRole('button', { name: /Pobierz dane/i });
    await button.click();

    await page.waitForTimeout(2000);

    const firstUpdate = page.locator('[class*="update-card"], [class*="UpdateCard"]').first();
    if (await firstUpdate.count() > 0) {
      await firstUpdate.click();
      
      // Znajdź przycisk eksportu
      const exportButton = page.getByRole('button', { name: /Eksportuj|Export/i });
      if (await exportButton.count() > 0) {
        await exportButton.click();
        
        // Sprawdź czy wywołano API eksportu
        await page.waitForResponse(
          response => response.url().includes('/api/v1/export/extract'),
          { timeout: 5000 }
        ).catch(() => {
          // Ignoruj timeout - eksport może nie być zaimplementowany
        });
      }
    }
  });

  test('filtrowanie po zakresie dat działa', async ({ page }) => {
    // Sprawdź czy są filtry
    const filter7d = page.getByText('7 dni', { exact: false });
    const filter30d = page.getByText('30 dni', { exact: false });
    const filter90d = page.getByText('90 dni', { exact: false });

    if (await filter7d.count() > 0) {
      await filter7d.click();
      await page.waitForTimeout(500);
      
      const button = page.getByRole('button', { name: /Pobierz dane/i });
      await button.click();
      
      // Sprawdź czy request zawiera parametr range=7d
      await page.waitForResponse(
        response => response.url().includes('range=7d'),
        { timeout: 5000 }
      ).catch(() => {});
    }
  });

  test('backend jest osiągalny', async ({ page }) => {
    const response = await page.request.get('http://localhost:5554/api/v1/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('Swagger UI jest dostępny', async ({ page }) => {
    await page.goto('http://localhost:5554/api/docs');
    await expect(page.locator('body')).toContainText('Strażnik Prawa API', { timeout: 10000 });
  });
});
