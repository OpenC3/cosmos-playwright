/*
# Copyright 2022 Ball Aerospace & Technologies Corp.
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
#
# Modified by OpenC3, Inc.
# All changes Copyright 2022, OpenC3, Inc.
# All Rights Reserved
*/

// @ts-check
import { test, expect } from './fixture';
import { Utilities } from '../utilities'

let utils
test.beforeEach(async ({ page }) => {
  await page.goto('/tools/tlmviewer')
  await expect(page.locator('.v-app-bar')).toContainText('Telemetry Viewer')
  await page.locator('.v-app-bar__nav-icon').click()
  utils = new Utilities(page)
  // Throw exceptions on any pageerror events
  page.on('pageerror', (exception) => {
    throw exception
  })
})

async function showScreen(page, target, screen, callback = null) {
  await page.locator('div[role="button"]:has-text("Select Target")').click()
  await page.locator(`.v-list-item__title:text-is("${target}")`).click()
  await page.locator('div[role="button"]:has-text("Select Screen")').click()
  await page.locator(`.v-list-item__title:text-is("${screen}")`).click()
  await page.locator('button:has-text("Show Screen")').click()
  await expect(page.locator(`.v-system-bar:has-text("${target} ${screen}")`)).toBeVisible()
  if (callback) {
    await callback()
  }
  await page.locator('[data-test=close-screen-icon]').click()
  await expect(page.locator(`.v-system-bar:has-text("${target} ${screen}")`)).not.toBeVisible()
}

test('displays INST ADCS', async ({ page }) => {
  await showScreen(page, 'INST', 'ADCS')
})

test('displays INST ARRAY', async ({ page }) => {
  await showScreen(page, 'INST', 'ARRAY')
})

test('displays INST BLOCK', async ({ page }) => {
  await showScreen(page, 'INST', 'BLOCK')
})
test('displays INST COMMANDING', async ({ page }) => {
  await showScreen(page, 'INST', 'COMMANDING')
})

test('displays INST GRAPHS', async ({ page }) => {
  await showScreen(page, 'INST', 'GRAPHS')
})

test('displays INST GROUND', async ({ page }) => {
  await showScreen(page, 'INST', 'GROUND')
})

test('displays INST HS', async ({ page }) => {
  await showScreen(page, 'INST', 'HS', async function () {
    await expect(page.locator('text=Health and Status')).toBeVisible()
    await page.locator('[data-test=minimize-screen-icon]').click()
    await expect(page.locator('text=Health and Status')).not.toBeVisible()
    await page.locator('[data-test=maximize-screen-icon]').click()
    await expect(page.locator('text=Health and Status')).toBeVisible()
  })
})

test('displays INST LATEST', async ({ page }) => {
  await showScreen(page, 'INST', 'LATEST')
})

test('displays INST LIMITS', async ({ page }) => {
  await showScreen(page, 'INST', 'LIMITS')
})

// OTHER not fully implemented
// test("displays INST OTHER", async ({ page }) => {
//   await showScreen(page, "INST", "OTHER");
// });

test('displays INST PARAMS', async ({ page }) => {
  await showScreen(page, 'INST', 'PARAMS')
})

test('displays INST SIMPLE', async ({ page }) => {
  const text = 'TEST' + Math.floor(Math.random() * 10000)
  await showScreen(page, 'INST', 'SIMPLE', async function () {
    await expect(page.locator(`text=${text}`)).not.toBeVisible()
    await page.locator('[data-test=edit-screen-icon]').click()
    await page.locator('[data-test=screen-text-input]').fill(`
    SCREEN AUTO AUTO 0.5
    LABEL ${text}
    BIG INST HEALTH_STATUS TEMP2
    `)
    await page.locator('button:has-text("Save")').click()
    await expect(page.locator(`text=${text}`)).toBeVisible()
    await page.locator('[data-test=edit-screen-icon]').click()
    await expect(page.locator(`.v-system-bar:has-text("Edit Screen")`)).toBeVisible()
    await utils.download(page, '[data-test=download-screen-icon]', function (contents) {
      expect(contents).toContain(`LABEL ${text}`)
      expect(contents).toContain('BIG INST HEALTH_STATUS TEMP2')
    })
    await page.locator('button:has-text("Cancel")').click()
    await expect(page.locator(`.v-system-bar:has-text("Edit Screen")`)).not.toBeVisible()
  })
})

test('displays INST TABS', async ({ page }) => {
  await showScreen(page, 'INST', 'TABS')
})

// Create the screen name as upcase because OpenC3 upcases the name
let screen = 'SCREEN' + Math.floor(Math.random() * 10000)
test('creates new screen', async ({ page }) => {
  await page.locator('div[role="button"]:has-text("Select Target")').click()
  await page.locator(`.v-list-item__title:text-is("INST")`).click()
  await utils.sleep(500)
  await page.locator('button:has-text("New Screen")').click()
  await expect(page.locator(`.v-system-bar:has-text("New Screen")`)).toBeVisible()
  // Spot check the list of existing screens
  await expect(page.locator(`.v-dialog:has-text("ADCS")`)).toBeVisible()
  await expect(page.locator(`.v-dialog:has-text("HS")`)).toBeVisible()
  await expect(page.locator(`.v-dialog:has-text("GROUND")`)).toBeVisible()
  await expect(page.locator(`.v-dialog:has-text("SIMPLE")`)).toBeVisible()
  await expect(page.locator(`.v-dialog:has-text("SIMPLE")`)).toBeVisible()
  // Check trying to create an existing screen
  await page.locator('[data-test=new-screen-name]').fill("ADCS")
  await expect(page.locator('.v-dialog')).toContainText('Screen ADCS already exists!')
  await page.locator('[data-test=new-screen-name]').fill(screen)
  await page.locator('button:has-text("Ok")').click()
  await expect(page.locator(`.v-system-bar:has-text("INST ${screen}")`)).toBeVisible()
})

test('deletes new screen', async ({ page }) => {
  await page.locator('div[role="button"]:has-text("Select Target")').click()
  await page.locator(`.v-list-item__title:text-is("INST")`).click()
  await page.locator('div[role="button"]:has-text("Select Screen")').click()
  await page.locator(`.v-list-item__title:text-is("${screen}")`).click()
  await page.locator('button:has-text("Show Screen")').click()
  await expect(page.locator(`.v-system-bar:has-text("INST ${screen}")`)).toBeVisible()
  await page.locator('[data-test=edit-screen-icon]').click()
  await page.locator('[data-test=delete-screen-icon]').click()
  await page.locator('button:has-text("Delete")').click()
  await page.locator('div[role="button"]:has-text("Select Screen")').click()
  await expect(page.locator(`.v-list-item__title:text-is("${screen}")`)).not.toBeVisible()
})
