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
  toolPath: '/tools/autonomic',
  toolName: 'Autonomic',
})

test('test trigger groups', async ({ page, utils }) => {
  await page.locator('[data-test="delete-group"]').click()
  await expect(
    page.getByText('The DEFAULT trigger group can not be deleted.')
  ).toBeVisible()
  await page.locator('[data-test="add-group"]').click()
  await expect(page.locator('.v-dialog')).toBeVisible()
  await expect(page.getByText('Group name can not be blank.')).toBeVisible()
  await page.locator('[data-test="group-input-name"]').fill('DEFAULT')
  await expect(
    page.getByText('Group name must be unique. Duplicate name found: DEFAULT.')
  ).toBeVisible()
  await page.locator('[data-test="group-input-name"]').fill('TEST_THIS')
  await expect(
    page.getByText('Group name can not contain an underscore.')
  ).toBeVisible()
  await page.locator('[data-test="group-input-name"]').fill('TEST')
  await page.locator('[data-test="group-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger group TEST was created'
  )

  await page.getByRole('button', { name: 'Group DEFAULT' }).click()
  await page.getByRole('option', { name: 'TEST' }).click()

  await page.locator('[data-test="delete-group"]').click()
  await page.locator('[data-test="group-delete-submit-btn"]').click()
  await page.locator('[data-test="confirm-dialog-delete"]').click()
  await expect(
    page.getByText('TriggerGroup: TEST has been deleted')
  ).toBeVisible()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger group TEST was deleted'
  )
})

// This whole thing basically must be run top to bottom starting here
// There a lot of dependencies on previous tests

test('create item value trigger', async ({ page, utils }) => {
  // Create a trigger that will never activate
  await page.locator('[data-test="new-trigger"]').click()
  await page.locator('[data-test="trigger-operand-left-type"]').click()
  await page.getByText('Telemetry Item').click()
  await utils.selectTargetPacketItem('INST', 'HEALTH_STATUS', 'TEMP1')
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: '>' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page.locator('[data-test="trigger-operand-right-type"]').click()
  await page.getByRole('option', { name: 'Value' }).click()
  await page.locator('[data-test="trigger-operand-right-float"]').fill('100')
  await page.locator('[data-test="trigger-operand-right-float"]').press('Enter')
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS TEMP1 (CONVERTED) > 100'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG1 in group DEFAULT was created'
  )

  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=1')
  ).toContainText('TRIG1')
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=1')
  ).toContainText('TEMP1 > 100')
  await expect(
    page.locator(
      '[data-test="triggers-table"] >> tr >> nth=1 >> td >> nth=2 >> i'
    )
  ).not.toHaveClass(/mdi-bell-ring/)
})

test('create reaction', async ({ page, utils }) => {
  await page.getByRole('tab', { name: 'Reactions' }).click()
  await expect(page).toHaveURL(
    'http://localhost:2900/tools/autonomic/reactions'
  )
  await page.locator('[data-test="new-reaction"]').click()
  await page.getByText('Level Trigger').click() // Default is 'Edge Trigger'
  await page.locator('[data-test="reaction-select-triggers"]').click()
  await page.getByText('DEFAULT: TRIG1').click()
  await page.locator('[data-test="reaction-create-step-two-btn"]').click()
  await utils.sleep(500)
  // await page.getByText('Script').nth(1).click();
  await page.locator('label:has-text("Command")').click()
  // await page.getByText('Notify Only').click();
  await page.locator('[data-test="reaction-action-command"]').fill('INST ABORT')
  await page.locator('[data-test="reaction-notification"]').click()
  await page.getByText('serious').click()
  await page
    .locator('[data-test="reaction-notify-text"]')
    .fill('INST ABORT was sent')
  await page.locator('[data-test="reaction-create-step-three-btn"]').click()
  await utils.sleep(500)
  await page.locator('[data-test="reaction-snooze-input"]').fill('10')
  await page.locator('[data-test="reaction-create-submit-btn"]').click()
  await expect(
    page.locator('[data-test="reactions-table"] >> tr >> nth=1')
  ).toContainText('REACT1')
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Reaction REACT1 was created'
  )
})

test('manually run a reaction', async ({ page, utils }) => {
  // Clear the notification
  await page.getByRole('button', { name: 'Badge' }).click()
  await page.locator('[data-test="clear-notifications"]').click()

  await page.getByRole('tab', { name: 'Reactions' }).click()
  await page.getByRole('button', { name: '󰅀' }).click()
  await expect(page.getByText('command: INST ABORT')).toBeVisible()
  await expect(page.getByText('notify: INST ABORT was sent')).toBeVisible()
  await page.locator('[data-test="execute-actions"]').click()
  await expect(
    page.getByText('reaction: REACT1 has manually executed its actions.')
  ).toBeVisible()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Reaction REACT1 was executed'
  )
  // Check the notification
  await page.getByRole('button', { name: 'Badge' }).click()
  await expect(page.locator('[data-test="notification-list"]')).toContainText(
    'REACT1 run'
  )
  await expect(page.locator('[data-test="notification-list"]')).toContainText(
    'INST ABORT was sent'
  )
})

test('edit a reaction', async ({ page, utils }) => {
  await page.getByRole('tab', { name: 'Reactions' }).click()
  await expect(page).toHaveURL(
    'http://localhost:2900/tools/autonomic/reactions'
  )
  await page.locator('[data-test="item-edit"]').click()
  await expect(page.locator('[data-test="level-trigger"]')).toHaveAttribute(
    'aria-checked',
    'true'
  )
  await expect(page.locator('span:has-text("TRIG1")')).toBeVisible()
  await page.locator('[data-test="reaction-create-step-two-btn"]').click()
  await utils.sleep(500)
  await page
    .locator('[data-test="reaction-action-option-script"]')
    .locator('..') // Can only click on the parent
    .click()
  await page.getByLabel('Select a script').click()
  await page.locator('[data-test="select-script"]').fill('stash')
  await utils.sleep(100)
  await page.getByText('INST/procedures/stash.rb').click()
  await page.locator('[data-test="reaction-notification"]').click()
  await page.getByText('caution').click()
  await page
    .locator('[data-test="reaction-notify-text"]')
    .fill('stash script run')
  await page.locator('[data-test="reaction-create-step-three-btn"]').click()
  await page.locator('[data-test="reaction-snooze-input"]').fill('15')
  await page.locator('[data-test="reaction-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Reaction REACT1 was updated'
  )
})

test('edit a trigger', async ({ page, utils }) => {
  await page.locator('[data-test="events-clear"]').click()
  await page.locator('[data-test="confirm-dialog-clear"]').click()

  // Edit and make a trigger that is always active
  await page.locator('[data-test="item-edit"]').nth(0).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.getByRole('button', { name: 'Operator >' }).click()
  await page.getByRole('option', { name: '<=' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS TEMP1 (CONVERTED) <= 100'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG1 in group DEFAULT was updated'
  )

  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=1')
  ).toContainText('TRIG1')
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=1')
  ).toContainText('TEMP1 <= 100')
  await utils.sleep(1000)
  await expect(
    page.locator(
      '[data-test="triggers-table"] >> tr >> nth=1 >> td >> nth=2 >> i'
    )
  ).toHaveClass(/mdi-bell-ring/)
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG1 in group DEFAULT was enabled'
  )
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Reaction REACT1 was run'
  )
})

test('activate & deactivate a trigger', async ({ page, utils }) => {
  await page.locator('[data-test="trigger-deactivate-icon"]').nth(0).click()
  await expect(
    page.getByText('Trigger: TEMP1 <= 100 has been deactivated.')
  ).toBeVisible()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG1 in group DEFAULT was deactivated'
  )
  // De-activating the trigger disables it
  await expect(
    page.locator(
      '[data-test="triggers-table"] >> tr >> nth=1 >> td >> nth=2 >> i'
    )
  ).not.toHaveClass(/mdi-bell-ring/)
  await page.locator('[data-test="trigger-activate-icon"]').click()
  await expect(
    page.locator(
      '[data-test="triggers-table"] >> tr >> nth=1 >> td >> nth=2 >> i'
    )
  ).toHaveClass(/mdi-bell-ring/)
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG1 in group DEFAULT was activated'
  )
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG1 in group DEFAULT was enabled'
  )
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Reaction REACT1 was run'
  )
})

test('create item state trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="new-trigger"]').click()
  await page.locator('[data-test="trigger-operand-left-type"]').click()
  await page.getByText('Telemetry Item').click()
  await utils.selectTargetPacketItem('INST', 'HEALTH_STATUS', 'TEMP1')
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: '==' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page.locator('[data-test="trigger-operand-right-type"]').click()
  await page.getByRole('option', { name: 'Telemetry Limits State' }).click()
  await page.locator('[data-test="trigger-operand-right-color"]').click()
  await page.getByRole('option', { name: 'RED' }).click()
  await page.locator('[data-test="trigger-operand-right-limit"]').click()
  await page.getByRole('option', { name: 'HIGH' }).click()
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS TEMP1 (CONVERTED) == RED_HIGH'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG2 in group DEFAULT was created'
  )

  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=2')
  ).toContainText('TRIG2')
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=2')
  ).toContainText('TEMP1 == RED_HIGH')
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG2 in group DEFAULT was enabled',
    { timeout: 75000 } // Takes 1:15 to full cyle but worst case is about 1:10 for outside RED_HIGH
  )

  // Edit it to ensure the fields are populated correctly and we can change
  await page.locator('[data-test="item-edit"]').nth(1).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page.locator('[data-test="trigger-operand-right-limit"]').click()
  await page.getByRole('option', { name: 'LOW' }).click()
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS TEMP1 (CONVERTED) == RED_LOW'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG2 in group DEFAULT was updated'
  )
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=2')
  ).toContainText('TEMP1 == RED_LOW')
})

test('create item change trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="new-trigger"]').click()
  await page.locator('[data-test="trigger-operand-left-type"]').click()
  await page.getByText('Telemetry Item').click()
  await utils.selectTargetPacketItem('INST', 'HEALTH_STATUS', 'CCSDSVER')
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: 'DOES NOT CHANGE' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS CCSDSVER (CONVERTED) DOES NOT CHANGE'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG3 in group DEFAULT was created'
  )

  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=3')
  ).toContainText('TRIG3')
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=3')
  ).toContainText('CCSDSVER DOES NOT CHANGE')
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG3 in group DEFAULT was enabled'
  )

  // Edit it to ensure the fields are populated correctly and we can change
  await page.locator('[data-test="item-edit"]').nth(2).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: 'CHANGES' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS CCSDSVER (CONVERTED) CHANGES'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG3 in group DEFAULT was updated'
  )
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=3')
  ).toContainText('CCSDSVER CHANGES')
})

test('create item string trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="new-trigger"]').click()
  await page.locator('[data-test="trigger-operand-left-type"]').click()
  await page.getByText('Telemetry Item').click()
  await page.getByLabel('Select Target').click()
  await page.getByRole('option', { name: 'INST' }).click()
  await page.getByLabel('Select Packet').click()
  await page.getByRole('option', { name: 'HEALTH_STATUS' }).click()
  await page.getByLabel('Select Item').fill('gr')
  await utils.sleep(100)
  await page.getByRole('option', { name: 'GROUND1STATUS' }).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: '!=' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page.locator('[data-test="trigger-operand-right-type"]').click()
  await page.getByRole('option', { name: 'String' }).click()
  await page
    .locator('[data-test="trigger-operand-right-string"]')
    .fill('CONNECTED')
  await page
    .locator('[data-test="trigger-operand-right-string"]')
    .press('Enter')
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS GROUND1STATUS (CONVERTED) != CONNECTED'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG4 in group DEFAULT was created'
  )

  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=4')
  ).toContainText('TRIG4')
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=4')
  ).toContainText('GROUND1STATUS != CONNECTED')
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG4 in group DEFAULT was enabled',
    { timeout: 15000 } // 10s cycle
  )

  // Edit it to ensure the fields are populated correctly and we can change
  await page.locator('[data-test="item-edit"]').nth(3).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page
    .locator('[data-test="trigger-operand-right-string"]')
    .fill('UNAVAILABLE')
  await page
    .locator('[data-test="trigger-operand-right-string"]')
    .press('Enter')
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS GROUND1STATUS (CONVERTED) != UNAVAILABLE'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG4 in group DEFAULT was updated'
  )
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=4')
  ).toContainText('GROUND1STATUS != UNAVAILABLE')
})

test('create item regex trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="new-trigger"]').click()
  await page.locator('[data-test="trigger-operand-left-type"]').click()
  await page.getByText('Telemetry Item').click()
  await utils.selectTargetPacketItem('INST', 'HEALTH_STATUS', 'ASCIICMD')
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: '==' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page.locator('[data-test="trigger-operand-right-type"]').click()
  await page.getByRole('option', { name: 'Regular Expression' }).click()
  await page
    .locator('[data-test="trigger-operand-right-regex"]')
    .fill('\\d\\d.*')
  await page.locator('[data-test="trigger-operand-right-regex"]').press('Enter')
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS ASCIICMD (CONVERTED) == \\d\\d.*'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG5 in group DEFAULT was created'
  )

  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=5')
  ).toContainText('TRIG5')
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=5')
  ).toContainText('ASCIICMD == \\d\\d.*')

  await page.goto('/tools/cmdsender/INST/ASCIICMD')
  await page
    .locator(`tr:has-text("STRING") [data-test=cmd-param-value]`)
    .first()
    .fill('TEST')
  await page.locator('[data-test=select-send]').click()
  await page.locator('text=cmd("INST ASCIICMD") sent')

  await page.goto('/tools/autonomic')
  await expect(page.locator('[data-test="log-messages"]')).not.toContainText(
    'Trigger TRIG5 in group DEFAULT was enabled'
  )

  await page.goto('/tools/cmdsender/INST/ASCIICMD')
  await page
    .locator(`tr:has-text("STRING") [data-test=cmd-param-value]`)
    .first()
    .fill('12TEST')
  await page.locator('[data-test=select-send]').click()
  await page.locator('text=cmd("INST ASCIICMD") sent')

  await page.goto('/tools/autonomic')
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG5 in group DEFAULT was enabled'
  )

  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()
  // Edit it to ensure the fields are populated correctly and we can change
  await page.locator('[data-test="item-edit"]').nth(4).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page.locator('[data-test="trigger-operand-right-regex"]').fill('*')
  await page.locator('[data-test="trigger-operand-right-regex"]').press('Enter')
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'INST HEALTH_STATUS ASCIICMD (CONVERTED) == *'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG5 in group DEFAULT was updated'
  )
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG5 in group DEFAULT was deactivated'
  )
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=5')
  ).toContainText('ASCIICMD == *')
})

test('create item dependent trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="new-trigger"]').click()
  await page.locator('[data-test="trigger-operand-left-type"]').click()
  await page.getByText('Existing Trigger').click()
  await page.locator('[data-test="trigger-operand-left-trigger"]').click()
  await page.getByRole('option', { name: 'TRIG1 (TEMP1 <= 100)' }).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: 'AND' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  await page.locator('[data-test="trigger-operand-right-trigger"]').click()
  await page
    .getByRole('option', { name: 'TRIG4 (GROUND1STATUS != UNAVAILABLE)' })
    .click()
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'TRIG1 (TEMP1 <= 100) AND TRIG4 (GROUND1STATUS != UNAVAILABLE)'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG6 in group DEFAULT was created'
  )

  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=6')
  ).toContainText('TRIG6')
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=6')
  ).toContainText('(TEMP1 <= 100) AND (GROUND1STATUS != UNAVAILABLE)')

  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG6 in group DEFAULT was enabled',
    { timeout: 15000 } // 10s cycle
  )

  // Edit it to ensure the fields are populated correctly and we can change
  await page.locator('[data-test="item-edit"]').nth(5).click()
  await page.locator('[data-test="trigger-create-step-two-btn"]').click()
  await page.locator('[data-test="trigger-create-select-operator"]').click()
  await page.getByRole('option', { name: 'OR' }).click()
  await page.locator('[data-test="trigger-create-step-three-btn"]').click()
  expect(await page.inputValue('[data-test="trigger-create-eval"]')).toMatch(
    'TRIG1 (TEMP1 <= 100) OR TRIG4 (GROUND1STATUS != UNAVAILABLE)'
  )
  await page.locator('[data-test="trigger-create-submit-btn"]').click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG6 in group DEFAULT was updated'
  )
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=6')
  ).toContainText('(TEMP1 <= 100) OR (GROUND1STATUS != UNAVAILABLE)')
})

test('delete a trigger dependent trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="item-delete"]').nth(3).click() // 4th item
  await page.locator('[data-test="confirm-dialog-delete"]').click()
  await expect(
    page.getByText('Failed to delete trigger TRIG4 from group DEFAULT.')
  ).toBeVisible()
  await expect(page.getByText('due to dependents: ["TRIG6"]')).toBeVisible()
})

test('delete a trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="item-delete"]').nth(5).click()
  await page.locator('[data-test="confirm-dialog-cancel"]').click()
  await expect(
    page.locator('[data-test="triggers-table"] >> tr >> nth=6')
  ).toContainText('TRIG6')

  await page.locator('[data-test="item-delete"]').nth(5).click()
  await page.locator('[data-test="confirm-dialog-delete"]').click()
  await expect(
    page.getByText(
      'Trigger: (TEMP1 <= 100) OR (GROUND1STATUS != UNAVAILABLE) has been deleted.'
    )
  ).toBeVisible()

  await expect(page.locator('[data-test="triggers-table"]')).not.toContainText(
    'TRIG6'
  )
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG6 in group DEFAULT was deleted'
  )
})

test('delete a reaction dependent trigger', async ({ page, utils }) => {
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()

  await page.locator('[data-test="item-delete"]').nth(0).click()
  await page.locator('[data-test="confirm-dialog-delete"]').click()
  await expect(
    page.getByText('Failed to delete trigger TRIG1 from group DEFAULT.')
  ).toBeVisible()
  await expect(page.getByText('due to dependents: ["REACT1"]')).toBeVisible()
})

test('delete a reaction', async ({ page, utils }) => {
  await page.getByRole('tab', { name: 'Reactions' }).click()
  await page.locator('[data-test="item-delete"]').nth(0).click()
  await page.locator('[data-test="confirm-dialog-cancel"]').click()
  await expect(page.locator('[data-test="reactions-table"]')).toContainText(
    'REACT1'
  )
  await page.locator('[data-test="item-delete"]').nth(0).click()
  await page.locator('[data-test="confirm-dialog-delete"]').click()
  await expect(
    page.getByText('Reaction: REACT1 has been deleted.')
  ).toBeVisible()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Reaction REACT1 was deleted'
  )

  // Now try to delete the reaction dependent trigger
  await page.getByRole('tab', { name: 'Triggers' }).click()
  // Manually change sorting from Updated At to Name so we have a consistent sort
  await page.getByText('Updated At').click()
  await page.getByText('Name').click()
  await page.locator('[data-test="item-delete"]').nth(0).click()
  await page.locator('[data-test="confirm-dialog-delete"]').click()
  await expect(
    page.getByText('Trigger: TEMP1 <= 100 has been deleted.')
  ).toBeVisible()

  await expect(page.locator('[data-test="triggers-table"]')).not.toContainText(
    'TRIG1'
  )
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'Trigger TRIG1 in group DEFAULT was deleted'
  )
})

test('event table', async ({ page, utils }) => {
  await page.locator('[data-test="pause"]').click() // pause
  await page.locator('[data-test="filter-type"]').click()
  await page.getByRole('option', { name: 'TRIGGER' }).click()
  await expect
    .poll(() => page.locator('[data-test="log-messages"] >> tr').count())
    .toBe(2) // Header plus No data available
  await page.locator('[data-test="pause"]').click() // resume
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'TRIGGER'
  )
  await expect(page.locator('[data-test="log-messages"]')).not.toContainText(
    'REACTION'
  )
  await expect(page.locator('[data-test="log-messages"]')).not.toContainText(
    'GROUP'
  )
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-test="events-download"]').click(),
  ])
  await page.locator('[data-test="filter-type"]').click()
  await page.getByRole('option', { name: 'REACTION' }).click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'REACTION'
  )
  await expect(page.locator('[data-test="log-messages"]')).not.toContainText(
    'TRIGGER'
  )
  await expect(page.locator('[data-test="log-messages"]')).not.toContainText(
    'GROUP'
  )
  await page.locator('[data-test="filter-type"]').click()
  await page.getByRole('option', { name: 'GROUP' }).click()
  await expect(page.locator('[data-test="log-messages"]')).toContainText(
    'GROUP'
  )
  await expect(page.locator('[data-test="log-messages"]')).not.toContainText(
    'REACTION'
  )
  await expect(page.locator('[data-test="log-messages"]')).not.toContainText(
    'TRIGGER'
  )
  await page.locator('[data-test="filter-type"]').click()
  await page.getByRole('option', { name: 'ALL' }).click()
  await page.locator('[data-test="search-log-messages"]').fill('TRIG3')
  await expect
    .poll(() => page.locator('[data-test="log-messages"] >> tr').count())
    .toBeLessThan(10)
  await page.locator('[data-test="search-log-messages"]').fill('')
  await expect
    .poll(() => page.locator('[data-test="log-messages"] >> tr').count())
    .toBeGreaterThan(20)
  await page.locator('[data-test="events-clear"]').click()
  await page.locator('[data-test="confirm-dialog-cancel"]').click()
  await expect
    .poll(() => page.locator('[data-test="log-messages"] >> tr').count())
    .toBeGreaterThan(20)
  await page.locator('[data-test="events-clear"]').click()
  await page.locator('[data-test="confirm-dialog-clear"]').click()
  await expect
    .poll(() => page.locator('[data-test="log-messages"] >> tr').count())
    .toBeLessThan(10)
})
