import { test, expect } from '@playwright/test'

const JOB_ID = 'cmp8718ep003v07e60axvopdn'

test.describe('Job Proposals Page', () => {
  test('client can view proposals for their job', async ({ page }) => {
    // Login as client3 (has job posts with applications)
    await page.goto('/login')
    await page.fill('input[name="email"]', 'client3@vajobs.online')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    // Navigate directly to proposals page (clients get routed to onboarding)
    await page.goto(`/dashboard/jobs/${JOB_ID}/proposals`)
    await page.waitForLoadState('networkidle')

    // Should show the job title
    await expect(page.locator('h1').first()).toBeVisible()

    // Should have at least one actionable proposal with bid info
    await expect(page.locator('button:has-text("Accept")').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Reject")').first()).toBeVisible()
    await expect(page.locator('text=/\\$[\\d,]+/').first()).toBeVisible()
    await expect(page.locator('text=/\\d+ proposal/')).toBeVisible()
  })

  test('talent cannot view proposals page', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'talent1@vajobs.online')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto(`/dashboard/jobs/${JOB_ID}/proposals`)
    await page.waitForLoadState('networkidle')

    // Should redirect (talent is not the poster)
    expect(page.url()).not.toContain('/proposals')
  })

  test('redirects when job not found', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'client3@vajobs.online')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/dashboard/jobs/nonexistent-id/proposals')
    await page.waitForLoadState('networkidle')

    // Should redirect to /dashboard since job not found
    expect(page.url()).toContain('/dashboard')
  })
})
