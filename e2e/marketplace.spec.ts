import { test, expect } from '@playwright/test'

const CLIENT = { email: 'client@example.com', password: 'password' }
const TALENT = { email: 'talent@example.com', password: 'password' }

test.describe('Job marketplace critical flow', () => {
  const jobTitle = `E2E Test Job ${Date.now()}`

  test('1. Client posts a new job', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', CLIENT.email)
    await page.fill('#password', CLIENT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/dashboard/jobs/new')
    await page.fill('#title', jobTitle)
    await page.fill('#description', 'This is an automated E2E test job description.')
    await page.fill('#shortDescription', 'E2E test job')
    await page.selectOption('#type', 'full-time')
    await page.fill('#location', 'Remote')
    await page.fill('#skills', 'Playwright, TypeScript, Testing')
    await page.selectOption('#status', 'open')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Post a New Job')).not.toBeVisible({ timeout: 10000 })
  })

  test('2. Talent finds the job and applies', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', TALENT.email)
    await page.fill('#password', TALENT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/jobs')
    await page.waitForSelector(`text=${jobTitle}`)
    await page.click(`text=${jobTitle}`)
    await page.waitForURL(/\/jobs\//)

    await page.fill('#bidAmount', '500')
    await page.fill('#timeline', '14')
    await page.fill('#approach', 'I will complete this work using automated testing tools.')
    await page.fill('#coverLetter', 'I am experienced with these technologies and can deliver high quality results.')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=Submit Proposal')).not.toBeVisible({ timeout: 10000 })
  })

  test('3. Client reviews proposals and accepts', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', CLIENT.email)
    await page.fill('#password', CLIENT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/dashboard/applications')
    await page.waitForSelector(`text=${jobTitle}`)
    await page.click(`text=${jobTitle}`)
    await page.waitForURL(/\/dashboard\/applications\//)

    await page.waitForSelector('text=Accept Proposal')
    await page.click('text=Accept Proposal')

    await expect(page.locator('text=Accept Proposal')).not.toBeVisible({ timeout: 10000 })
  })

  test('4. Engagement is accessible', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', CLIENT.email)
    await page.fill('#password', CLIENT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/dashboard/engagements')
    await expect(page.locator(`text=${jobTitle}`).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText('Sign in')
  })

  test('shows validation error with wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'wrong@example.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Job browsing', () => {
  test('shows job listings page', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.locator('h1').or(page.locator('text=Jobs').first())).toBeVisible()
  })

  test('shows talent directory', async ({ page }) => {
    await page.goto('/talents')
    await expect(page.locator('h1').or(page.locator('text=Talents').first())).toBeVisible()
  })
})
