import { test, expect } from '@playwright/test';

/** Clear PouchDB data between tests so each test starts with a clean slate. */
async function clearStorage(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const dbs = await window.indexedDB.databases?.() ?? [];
    await Promise.all(dbs.map((db) => {
      if (db.name) window.indexedDB.deleteDatabase(db.name);
    }));
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearStorage(page);
  await page.reload();
});

test('shows empty state when there are no projects', async ({ page }) => {
  await expect(page.getByText('No projects yet')).toBeVisible();
});

test('creates a new project and shows it on the home page', async ({ page }) => {
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder('My Book').fill('The Great Novel');
  await page.getByPlaceholder('John Doe').fill('Jane Smith');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('The Great Novel')).toBeVisible();
  await expect(page.getByText('Jane Smith')).toBeVisible();
});

test('navigates to the book editor when clicking a project card', async ({ page }) => {
  // Create a project first
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder('My Book').fill('Editor Test Book');
  await page.getByRole('button', { name: 'Save' }).click();

  // Click the "Open" / project card link to the editor
  await page.getByText('Editor Test Book').click();
  await expect(page).toHaveURL(/\/projects\/.+\/editor/);
  await expect(page.getByText('Editor Test Book')).toBeVisible();
});

test('deletes a project after confirmation', async ({ page }) => {
  // Create a project
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder('My Book').fill('Delete Me');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Delete Me')).toBeVisible();

  // Accept the confirmation dialog that appears on delete
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('Delete Me')).not.toBeVisible();
  await expect(page.getByText('No projects yet')).toBeVisible();
});

test('shows project count', async ({ page }) => {
  await expect(page.getByText('0 projects')).toBeVisible();

  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByPlaceholder('My Book').fill('Book 1');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('1 project')).toBeVisible();
});
