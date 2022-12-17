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
import { test, expect } from './fixture'
import { format } from 'date-fns'

test.use({
  toolPath: '/tools/limitsmonitor',
  toolName: 'Limits Monitor',
})

test('saves and opens the configuration', async ({ page, utils }) => {
  await expect
    .poll(
      () =>
        page
          .locator('[data-test=limits-row]:has-text("GROUND1STATUS")')
          .count(),
      {
        timeout: 60000,
      }
    )
    .toBeGreaterThan(0)
  await expect
    .poll(
      () =>
        page
          .locator('[data-test=limits-row]:has-text("GROUND2STATUS")')
          .count(),
      {
        timeout: 60000,
      }
    )
    .toBeGreaterThan(0)

  // Ignore so we have something to check
  await page
    .locator('[data-test=limits-row]:has-text("GROUND1STATUS") button >> nth=1')
    .click()
  await page
    .locator('[data-test=limits-row]:has-text("GROUND2STATUS") button >> nth=1')
    .click()

  let config = 'spec' + Math.floor(Math.random() * 10000)
  await page.locator('[data-test=cosmos-limits-monitor-file]').click()
  await page.locator('text=Save Configuration').click()
  await page.locator('[data-test=name-input-save-config-dialog]').fill(config)
  await page.locator('button:has-text("Ok")').click()

  // Reload page
  await page.reload()
  await page.locator('[data-test=cosmos-limits-monitor-file]').click()
  await page.locator('text=Open Configuration').click()
  await page.locator(`td:has-text("${config}")`).click()
  await page.locator('button:has-text("Ok")').click()
  await utils.sleep(2000) // Let the page re-render .. not sure how else to wait

  await page.locator('[data-test=cosmos-limits-monitor-file]').click()
  await page.locator('text=Show Ignored').click()
  await expect(
    page.locator('div[role="dialog"]:has-text("Ignored Items")')
  ).toContainText('GROUND1STATUS')
  await expect(
    page.locator('div[role="dialog"]:has-text("Ignored Items")')
  ).toContainText('GROUND2STATUS')
  await page.locator('button:has-text("Ok")').click()

  // Delete this test configuation
  await page.locator('[data-test=cosmos-limits-monitor-file]').click()
  await page.locator('text=Open Configuration').click()
  await page.locator(`tr:has-text("${config}") [data-test=item-delete]`).click()
  await page.locator('button:has-text("Delete")').click()
  await page.locator('[data-test=open-config-cancel-btn]').click()
})

//
// Test the Limits Tab
//
test('temporarily hides items', async ({ page, utils }) => {
  // Since we're checking count() which is instant we need to poll
  await expect
    .poll(
      () => page.locator('[data-test=limits-row]:has-text("TEMP2")').count(),
      {
        timeout: 60000,
      }
    )
    .toBe(2)

  // Hide both TEMP2s
  await page
    .locator('[data-test=limits-row]:has-text("TEMP2") button >> nth=2')
    .click()
  await page
    .locator('[data-test=limits-row]:has-text("TEMP2") button >> nth=2')
    .click()

  // Now wait for them to come back
  // Since we're checking count() which is instant we need to poll
  await expect
    .poll(
      () => page.locator('[data-test=limits-row]:has-text("TEMP2")').count(),
      {
        timeout: 60000,
      }
    )
    .toBe(2)
})

test('ignores items', async ({ page, utils }) => {
  await expect
    .poll(
      () => page.locator('[data-test=limits-row]:has-text("TEMP2")').count(),
      {
        timeout: 60000,
      }
    )
    .toBe(2)

  // Ignore both TEMP2s
  await page
    .locator('[data-test=limits-row]:has-text("TEMP2") button >> nth=1')
    .click()
  await page
    .locator('[data-test=limits-row]:has-text("TEMP2") button >> nth=1')
    .click()
  await expect(
    page.locator('[data-test=limits-row]:has-text("TEMP2")')
  ).not.toBeVisible()
  expect(await page.inputValue('[data-test=overall-state]')).toMatch(
    'Some items ignored'
  )

  // Check the menu
  await page.locator('[data-test=cosmos-limits-monitor-file]').click()
  await page.locator('text=Show Ignored').click()
  await expect(page.locator('.v-dialog')).toContainText('TEMP2')
  // Find the items and delete them to restore them
  await page.locator('[data-test=remove-ignore-0]').click()
  await page.locator('[data-test=remove-ignore-0]').click()
  await page.locator('button:has-text("Ok")').click()

  await page.locator('[data-test=cosmos-limits-monitor-file]').click()
  await page.locator('text=Show Ignored').click()
  await expect(page.locator('.v-dialog')).not.toContainText('TEMP2')
  await page.locator('button:has-text("Ok")').click()
  // Wait for the TEMP2 to show up again
  await expect
    .poll(
      () => page.locator('[data-test=limits-row]:has-text("TEMP2")').count(),
      {
        timeout: 60000,
      }
    )
    .toBe(2)
})

test('ignores entire packets', async ({ page, utils }) => {
  // The INST and INST2 targets both have VALUE2 & VALUE4 as red
  expect(
    await page.locator('[data-test=limits-row]:has-text("VALUE2")').count()
  ).toBe(2)
  expect(
    await page.locator('[data-test=limits-row]:has-text("VALUE4")').count()
  ).toBe(2)

  // Ignore the entire VALUE2 packet
  await page
    .locator('[data-test=limits-row]:has-text("VALUE2") button >> nth=0')
    .click()
  expect(
    await page.locator('[data-test=limits-row]:has-text("VALUE2")').count()
  ).toBe(1)
  expect(
    await page.locator('[data-test=limits-row]:has-text("VALUE4")').count()
  ).toBe(1)

  // Check the menu
  await page.locator('[data-test=cosmos-limits-monitor-file]').click()
  await page.locator('text=Show Ignored').click()
  await expect(page.locator('.v-dialog')).toContainText('PARAMS') // INST[2] PARAMS
  // Find the items and delete them to restore them
  await page.locator('[data-test=remove-ignore-0]').click()
  await expect(page.locator('.v-dialog')).not.toContainText('PARAMS') // INST[2] PARAMS
  await page.locator('button:has-text("Ok")').click()

  // Now we find both items again
  await expect
    .poll(
      () => page.locator('[data-test=limits-row]:has-text("VALUE2")').count(),
      {
        timeout: 10000,
      }
    )
    .toBe(2)
  await expect
    .poll(
      () => page.locator('[data-test=limits-row]:has-text("VALUE4")').count(),
      {
        timeout: 10000,
      }
    )
    .toBe(2)
})

//
// Test the log tab
//
test.only('displays the limits log', async ({ page, utils }) => {
  await page.getByRole('tab', { name: 'Log' }).click()
  await expect(page.getByText('Limits Events')).toBeVisible()
  // Just verify we see dates and the various red, yellow, green states
  await expect(page.locator('[data-test=limits-events]')).toContainText(
    format(new Date(), 'yyyy-MM-dd')
  )
  await expect(page.locator('[data-test=limits-events]')).toContainText('RED')
  await expect(page.locator('[data-test=limits-events]')).toContainText(
    'YELLOW'
  )
  await expect(page.locator('[data-test=limits-events]')).toContainText('GREEN')
  // Switch back to the main tab
  await page.getByRole('tab', { name: 'Limits' }).click()
  await expect(page.getByText('Overall Limits State')).toBeVisible()
})
