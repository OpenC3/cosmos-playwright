/*
# Copyright 2023 OpenC3, Inc.
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

// @ts-check
import { test, expect } from './fixture'

test.use({
  toolPath: '/tools/bucketexplorer',
  toolName: 'Bucket Explorer',
})

//
// Test the basic functionality of the application
//
test('navigate config', async ({ page, utils }) => {
  // Initially empty
  await expect(
    page.getByRole('cell', { name: 'No data available' })
  ).toBeVisible()

  await page.getByText('config').click()
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/config%2F/)
  await page.getByRole('cell', { name: 'DEFAULT' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText('/DEFAULT/')
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/config%2FDEFAULT%2F/)
  await page.getByRole('cell', { name: 'targets' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText(
    '/DEFAULT/targets/'
  )
  await expect(page).toHaveURL(
    /.*\/tools\/bucketexplorer\/config%2FDEFAULT%2Ftargets%2F/
  )
  await page.getByRole('cell', { name: 'INST' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText(
    '/DEFAULT/targets/INST/'
  )
  await expect(page).toHaveURL(
    /.*\/tools\/bucketexplorer\/config%2FDEFAULT%2Ftargets%2FINST%2F/
  )
  await expect(page.locator('tbody > tr')).toHaveCount(9)

  // Clicking a file should do nothing
  await page.getByRole('cell', { name: 'target.txt' }).click()
  await expect(page).toHaveURL(
    /.*\/tools\/bucketexplorer\/config%2FDEFAULT%2Ftargets%2FINST%2F/
  )
  await expect(page.locator('tbody > tr')).toHaveCount(9)
  // Download the file
  await utils.download(
    page,
    'tbody > tr:has-text("target.txt") >> button',
    function (contents) {
      expect(contents).toContain('REQUIRE')
      expect(contents).toContain('IGNORE_PARAMETER')
      expect(contents).toContain('IGNORE_ITEM')
    }
  )

  // codegen created this weird named button for back
  await page.getByRole('button', { name: '󰧙' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText(
    '/DEFAULT/targets/'
  )
  await expect(page).toHaveURL(
    /.*\/tools\/bucketexplorer\/config%2FDEFAULT%2Ftargets%2F/
  )
  await page.getByRole('button', { name: '󰧙' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText('/DEFAULT/')
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/config%2FDEFAULT%2F/)
  await page.getByRole('button', { name: '󰧙' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText('/')
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/config%2F/)
  // Back again just to show that doesn't break things
  await page.getByRole('button', { name: '󰧙' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText('/')
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/config%2F/)
})

test('navigate logs and tools', async ({ page, utils }) => {
  await page.getByText('logs').click()
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/logs%2F/)
  await page.getByRole('cell', { name: 'DEFAULT' }).click()
  await expect(page.locator('.v-data-table > span')).toHaveText('/DEFAULT/')
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/logs%2FDEFAULT%2F/)
  await expect(page.locator('tbody > tr').first()).toHaveText(/\w+_logs/)

  await page.getByText('tools').click()
  await expect(page).toHaveURL(/.*\/tools\/bucketexplorer\/tools%2F/)
  await expect(page.locator('tbody > tr')).toHaveCount(17)
})
