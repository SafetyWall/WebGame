import { test } from 'node:test'
import assert from 'node:assert'
import { SKILLS } from '../src/data/skills.js'

test('SKILLS entries have id(=key)/name/kind and valid range', () => {
  for (const [key, s] of Object.entries(SKILLS)) {
    assert.strictEqual(s.id, key, `${key} id matches key`)
    assert.ok(s.name, `${key} name`)
    assert.ok(['attack', 'heal'].includes(s.kind), `${key} kind`)
    assert.ok(['melee', 'ranged', null].includes(s.range), `${key} range`)
  }
})

test('attack skills carry a melee/ranged tag; heal skill has null range', () => {
  assert.strictEqual(SKILLS.melee_strike.range, 'melee')
  assert.strictEqual(SKILLS.ranged_strike.range, 'ranged')
  assert.strictEqual(SKILLS.basic_heal.kind, 'heal')
  assert.strictEqual(SKILLS.basic_heal.range, null)
})
