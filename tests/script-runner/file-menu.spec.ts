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
import { test, expect } from './../fixture'

test.use({
  toolPath: '/tools/scriptrunner',
  toolName: 'Script Runner',
})

test('clears the editor on File->New', async ({ page, utils }) => {
  // Have to fill on an editable area like the textarea
  await page.locator('textarea').fill('this is a test')
  // But can't check on the textarea because it has an input
  await expect(page.locator('#editor')).toContainText('this is a test')
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=New File').click()
  await expect(page.locator('#editor')).not.toContainText('this is a test')
})

test('open a file', async ({ page, utils }) => {
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Open File').click()
  await utils.sleep(1000)
  await page.locator('[data-test=file-open-save-search]').type('dis')
  await utils.sleep(500)
  await page.locator('[data-test=file-open-save-search]').type('connect')
  await page.locator('text=disconnect >> nth=0').click() // nth=0 because INST, INST2
  await page.locator('[data-test=file-open-save-submit-btn]').click()
  expect(await page.locator('#sr-controls')).toContainText(
    `INST/procedures/disconnect.rb`
  )
})

test('handles File->Save new file', async ({ page, utils }) => {
  await page.locator('textarea').fill('puts "File Save new File"')
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Save File').click()
  // New files automatically open File Save As
  await page.locator('text=File Save As')
  await page.locator('[data-test=file-open-save-filename]').fill('save_new.rb')
  await page.locator('text=temp.rb is not a valid filename')
  await page
    .locator(
      '.v-dialog >> .v-treeview-node__root:has-text("INST") > button >> nth=0'
    )
    .click()
  await page.locator('text=procedures').click()
  await page.locator('[data-test=file-open-save-filename]').click()
  await page.type('[data-test=file-open-save-filename]', '/save_new.rb')
  await page.locator('[data-test=file-open-save-submit-btn]').click()
  expect(await page.locator('#sr-controls')).toContainText(
    'INST/procedures/save_new.rb'
  )

  // Delete the file
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Delete File').click()
  await page.locator('text=Permanently delete file')
  await page.locator('button:has-text("Delete")').click()
})

test('handles File Save overwrite', async ({ page, utils }) => {
  await page.locator('textarea').fill('puts "File Save overwrite"')
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Save File').click()
  await page
    .locator('[data-test=file-open-save-filename]')
    .fill('INST/procedures/save_overwrite.rb')
  await page.locator('[data-test=file-open-save-submit-btn]').click()
  expect(await page.locator('#sr-controls')).toContainText(
    'INST/procedures/save_overwrite.rb'
  )

  await page.locator('textarea').fill('# comment1')
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Save File').click()
  await page.locator('textarea').fill('# comment2')
  if (process.platform === 'darwin') {
    await page.locator('textarea').press('Meta+S') // Ctrl-S save
  } else {
    await page.locator('textarea').press('Control+S') // Ctrl-S save
  }

  // File->Save As
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Save As...').click()
  await page.locator('text=INST/procedures/save_overwrite.rb')
  await page.locator('[data-test=file-open-save-submit-btn]').click()
  // Confirmation dialog
  await page.locator('text=Are you sure you want to overwrite').click()
  await page.locator('button:has-text("Overwrite")').click()

  // Delete the file
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Delete File').click()
  await page.locator('text=Permanently delete file')
  await page.locator('button:has-text("Delete")').click()
})

test('handles Download', async ({ page, utils }) => {
  await page.locator('textarea').fill('download this')
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Save File').click()
  await page.fill('[data-test=file-open-save-filename]', 'INST/download.txt')
  await page.locator('[data-test=file-open-save-submit-btn]').click()
  expect(await page.locator('#sr-controls')).toContainText('INST/download.txt')
  // Download the file
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await utils.download(
    page,
    '[data-test=cosmos-script-runner-file-download]',
    function (contents) {
      expect(contents).toContain('download this')
    }
  )

  // Delete the file
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Delete File').click()
  await page.locator('text=Permanently delete file')
  await page.locator('button:has-text("Delete")').click()
})

test('can delete all temp files', async ({ page, utils }) => {
  // Create new file which when run will become a TEMP file
  await page.locator('textarea').fill('puts "temp11111111"')
  await page.locator('[data-test=start-button]').click()
  // Runs without stopping
  await expect(page.locator('[data-test=state]')).toHaveValue('stopped', {
    timeout: 20000,
  })
  await expect(page.locator('#sr-controls')).toContainText(
    /__TEMP__\/\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_\d{3}_temp.rb/
  )
  // Weird selector but it's how vuetify works
  let tempFile1 = await page
    .locator('#sr-controls >> input[type=hidden]')
    .inputValue()
  tempFile1 = tempFile1.split('/')[1]

  // New file
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=New File').click()
  await expect(page.locator('#sr-controls')).toContainText('<Untitled>')
  await page.locator('textarea').fill('puts "temp22222222"')
  await page.locator('[data-test=start-button]').click()
  // Runs without stopping
  await expect(page.locator('[data-test=state]')).toHaveValue('stopped', {
    timeout: 20000,
  })
  await expect(page.locator('#sr-controls')).toContainText(
    /__TEMP__\/\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_\d{3}_temp.rb/
  )
  let tempFile2 = await page
    .locator('#sr-controls >> input[type=hidden]')
    .inputValue()
  tempFile2 = tempFile2.split('/')[1]
  expect(tempFile1).not.toEqual(tempFile2)

  // Open file
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Open File').click()
  await page.locator('.v-dialog >> text=__TEMP__').click()
  await expect(page.locator(`.v-dialog >> text=${tempFile1}`)).toBeVisible()
  await expect(page.locator(`.v-dialog >> text=${tempFile2}`)).toBeVisible()

  // await page.locator('.v-treeview-node__append > .v-btn').click();
  await page
    .locator('.v-dialog >> .v-treeview-node:has-text("__TEMP__") >> .v-btn')
    .click()
  await page.locator('[data-test="confirm-dialog-delete"]').click()
  await page.locator('[data-test="file-open-save-cancel-btn"]').click()

  // Open file
  await page.locator('[data-test=cosmos-script-runner-file]').click()
  await page.locator('text=Open File').click()
  await expect(page.locator('.v-dialog--active')).toContainText('INST')
  await expect(page.locator('.v-dialog--active')).not.toContainText('__TEMP__')
  await page.locator('[data-test="file-open-save-cancel-btn"]').click()
})
