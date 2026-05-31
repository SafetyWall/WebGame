import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SLIME } from './_fixtures.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'

test('makeUnit copies job stats into runtime unit', () => {
  const u = makeUnit(JOBS.warrior)
  assert.strictEqual(u.name, '전사')
  assert.strictEqual(u.hp, 115)
  assert.strictEqual(u.maxHp, 115)
  assert.strictEqual(u.gauge, 0)
  assert.strictEqual(u.def, 0)         // 플레이어 def 없음 → 0
  assert.strictEqual(u.taunt, false)   // 비탱은 false
})

test('makeUnit preserves taunt and heal', () => {
  assert.strictEqual(makeUnit(JOBS.guardian).taunt, true)
  assert.strictEqual(makeUnit(JOBS.priest).heal, 30)
})

test('makeMob sets runtime hp/gauge and def default', () => {
  const m = makeMob(SLIME)
  assert.strictEqual(m.hp, 200)
  assert.strictEqual(m.maxHp, 200)
  assert.strictEqual(m.gauge, 0)
  assert.strictEqual(m.def, 3)
})
