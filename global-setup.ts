// global-setup.ts
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('/')
  try {
    // Check for Enterprise login
    await page
      .locator('text=Sign in to your account')
      .waitFor({ timeout: 5000 })
    await page.locator('input[name="username"]').fill('operator')
    await page.locator('input[name="password"]').fill('operator')
    await Promise.all([
      page.waitForNavigation(),
      page.locator('input:has-text("Sign In")').click(),
    ])
  } catch (error) {
    // We expect a TimeoutError if this is base OpenC3 (not Enterprise)
    // so if we don't get that then it's a real error and we throw it
    if (error.name !== 'TimeoutError') {
      throw error
    }

    await page.goto(`${baseURL}/login`)
    // Wait for the nav bar to populate
    for (let i = 0; i < 10; i++) {
      await page
        .locator('nav:has-text("CmdTlmServer")')
        .waitFor({ timeout: 30000 })
      // If we don't see CmdTlmServer then refresh the page
      if (!(await page.$('nav:has-text("CmdTlmServer")'))) {
        await page.reload()
      }
    }
    if (await page.$('text=Enter the password')) {
      await page.fill('data-test=new-password', 'password')
      await page.locator('button:has-text("Login")').click()
    } else {
      await page.fill('data-test=new-password', 'password')
      await page.fill('data-test=confirm-password', 'password')
      await page.click('data-test=set-password')
    }
  }

  // On the initial load you might get the Clock out of sync dialog
  if (await page.$('text=Clock out of sync')) {
    await page.locator("text=Don't show this again").click()
    await page.locator('button:has-text("Dismiss")').click()
  }

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: 'storageState.json' })
  await browser.close()
}

export default globalSetup
