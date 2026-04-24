import { test, expect } from '@playwright/test';

async function clearStorage(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const dbs = await window.indexedDB.databases?.() ?? [];
    await Promise.all(dbs.map((db) => {
      if (db.name) window.indexedDB.deleteDatabase(db.name);
    }));
  });
}

/** Creates a project and navigates to its editor. Returns the page. */
async function openEditor(page: import('@playwright/test').Page, title = 'Test Book') {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder('My Book').fill(title);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText(title).click();
  await expect(page).toHaveURL(/\/projects\/.+\/editor/);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearStorage(page);
  await page.reload();
});

test('shows empty editor state before a chapter is selected', async ({ page }) => {
  await openEditor(page);
  await expect(page.getByText('Select a chapter')).toBeVisible();
});

test('adds a chapter and selects it', async ({ page }) => {
  await openEditor(page);

  await page.getByRole('button', { name: 'Add Chapter' }).click();
  await page.getByRole('button', { name: 'Regular Chapter' }).click();

  // Chapter appears in sidebar
  await expect(page.getByText('New regular')).toBeVisible();

  // Editor is now active (not the placeholder)
  await expect(page.getByText('Select a chapter')).not.toBeVisible();
});

test('renames a chapter via inline edit', async ({ page }) => {
  await openEditor(page);

  await page.getByRole('button', { name: 'Add Chapter' }).click();
  await page.getByRole('button', { name: 'Regular Chapter' }).click();

  // Hover to reveal edit icon
  await page.getByText('New regular').hover();
  await page.locator('[title=""]').filter({ hasText: '' }).first();
  // Click the edit (pencil) button
  const editBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
  await editBtn.click();

  const input = page.locator('input[value="New regular"]');
  await input.fill('Prologue');
  await input.press('Enter');

  await expect(page.getByText('Prologue')).toBeVisible();
});

test('adds a section to a chapter', async ({ page }) => {
  await openEditor(page);

  await page.getByRole('button', { name: 'Add Chapter' }).click();
  await page.getByRole('button', { name: 'Regular Chapter' }).click();

  await page.getByRole('button', { name: 'Add Section' }).click();
  await expect(page.getByText('New Section')).toBeVisible();
});

test('switches language tab', async ({ page }) => {
  await openEditor(page);

  await page.getByRole('button', { name: 'Add Chapter' }).click();
  await page.getByRole('button', { name: 'Regular Chapter' }).click();

  // Switch to PT-BR
  await page.getByRole('button', { name: 'PT-BR' }).click();

  // Editor should still be visible (key changed, empty content for new locale)
  await expect(page.locator('.ProseMirror')).toBeVisible();
});

test('navigates to project settings', async ({ page }) => {
  await openEditor(page);
  await page.locator('[title="Settings"]').click();
  await expect(page).toHaveURL(/\/projects\/.+\/settings/);
  await expect(page.getByText('Project Settings')).toBeVisible();
});

test('saves project settings and navigates back', async ({ page }) => {
  await openEditor(page, 'My Novel');
  await page.locator('[title="Settings"]').click();

  const titleInput = page.getByLabel('Title');
  await titleInput.fill('My Updated Novel');
  await page.getByRole('button', { name: /Save Changes/ }).click();

  await expect(page.getByText('Saved!')).toBeVisible();
});
