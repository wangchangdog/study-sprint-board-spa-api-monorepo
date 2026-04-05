import { expect, test } from '@playwright/test'

test('demo mode sign-in and navigation', async ({ page }) => {
  await page.goto('/signin')
  await expect(page.getByRole('heading', { name: 'サインイン' })).toBeVisible()

  await page.getByRole('button', { name: 'サインイン' }).click()
  await expect(page.getByRole('heading', { name: /Admin User さんの作業状況/ })).toBeVisible()

  await page.getByRole('link', { name: 'Tasks' }).click()
  await expect(page.getByRole('heading', { name: 'タスク一覧', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: '管理ビュー' })).toBeVisible()
})
