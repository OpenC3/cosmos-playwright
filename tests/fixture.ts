/*
# Copyright 2022 OpenC3, Inc.
# All Rights Reserved.
#
# This program is free software; you can modify and/or redistribute it
# under the terms of the GNU Affero General Public License
# as published by the Free Software Foundation; version 3 with
# attribution addendums as found in the LICENSE.txt
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
*/

import { expect, test as base } from '@playwright/test'
import { Utilities } from '../utilities'

// Extend the page fixture to goto the OpenC3 tool and wait for potential
// redirect to authentication login (Enterprise only).
// Login and click the hamburger nav icon to close the navigation drawer
export const test = base.extend({
  toolPath: '/tools/cmdtlmserver',
  toolName: 'CmdTlmServer',
  page: async ({ baseURL, toolPath, toolName, page }, use) => {
    // Object.getPrototypeOf(page).utils = new Utilities(page)
    page['utils'] = new Utilities(page)
    await page.goto(`${baseURL}${toolPath}`, {
      waitUntil: 'networkidle',
    })
    if (process.env.ENTERPRISE === '1') {
      // Check to see if we redirect to authenticate
      if (page.url().includes('/auth/')) {
        await page.locator('input[name="username"]').fill('operator')
        await page.locator('input[name="password"]').fill('operator')
        await Promise.all([
          page.waitForNavigation(),
          page.locator('input:has-text("Sign In")').click(),
        ])
        await page.context().storageState({ path: 'storageState.json' })
      }
    }
    await expect(page.locator('.v-app-bar')).toContainText(toolName)
    await page.locator('.v-app-bar__nav-icon').click()
    // This is like a yield in a Ruby block where we call back to the
    // test and execute the individual test code
    await use(page)
    if (toolName !== 'Administrator') {
      // Store off the updated token
      await page.context().storageState({ path: 'storageState.json' })
    }
  },
})
export { expect } from '@playwright/test'
