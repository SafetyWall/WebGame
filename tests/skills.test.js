import { test } from 'node:test'
import assert from 'node:assert'
import { SKILLS } from '../src/data/skills.js'
import { JOBS } from '../src/data/jobs.js'
import { makeUnit } from '../src/engine/unit.js'

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

test('makeUnit resolves job.skills ids into shared SKILLS defs', () => {
  const mage = makeUnit(JOBS.mage)
  assert.strictEqual(mage.skills[0], SKILLS.ranged_strike) // 공유 def 참조(clone 아님)
  assert.strictEqual(mage.skills[0].range, 'ranged')
  assert.strictEqual(makeUnit(JOBS.priest).skills[0].kind, 'heal')
})

test('makeUnit no longer carries phys/magic type', () => {
  assert.strictEqual(makeUnit(JOBS.warrior).type, undefined)
})
