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

test('makeUnit defaults to level 1 = base stats', () => {
  const u = makeUnit(JOBS.warrior)
  assert.strictEqual(u.level, 1)
  assert.strictEqual(u.hp, 115)
  assert.strictEqual(u.atk, 22)
  assert.strictEqual(u.spd, 9)
})

test('makeUnit at higher level scales hp/atk (spd fixed)', () => {
  const u = makeUnit(JOBS.warrior, 3)
  assert.strictEqual(u.level, 3)
  assert.strictEqual(u.hp, 166)
  assert.strictEqual(u.atk, 31)
  assert.strictEqual(u.spd, 9) // spd 레벨 불변
})

test('priest heal scales with level', () => {
  assert.strictEqual(makeUnit(JOBS.priest, 1).heal, 30)
  assert.strictEqual(makeUnit(JOBS.priest, 3).heal, 43)
})

test('makeUnit throws a clear error for an undefined level', () => {
  assert.throws(() => makeUnit(JOBS.warrior, 99), /no stats for .* level 99/)
})
