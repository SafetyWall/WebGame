import { test } from 'node:test'
import assert from 'node:assert'
import { levelCurve } from '../src/data/curve.js'
import { MONSTERS } from '../src/data/monsters.js'
import { STAGES } from '../src/data/stages.js'

const RARITIES = ['일반', '희귀', '영웅', '전설']

test('levelCurve(1) returns base stats', () => {
  assert.deepStrictEqual(levelCurve(1), { hp: 180, atk: 16, def: 3, spd: 6 })
})

test('levelCurve grows hp/atk/def with level', () => {
  assert.ok(levelCurve(2).hp > levelCurve(1).hp)
  assert.ok(levelCurve(3).atk > levelCurve(2).atk)
  assert.ok(levelCurve(3).def > levelCurve(1).def)
})

test('MONSTERS entries have name and mul for every stat', () => {
  for (const [k, m] of Object.entries(MONSTERS)) {
    assert.ok(m.name, `${k} name`)
    for (const s of ['hp', 'atk', 'def', 'spd']) {
      assert.ok(Number.isFinite(m.mul[s]), `${k}.mul.${s}`)
    }
  }
})

test('STAGES have numeric level and traitSlots of valid rarities', () => {
  for (const [k, s] of Object.entries(STAGES)) {
    assert.ok(Number.isFinite(s.level), `${k} level`)
    assert.ok(Array.isArray(s.traitSlots), `${k} traitSlots`)
    for (const r of s.traitSlots) assert.ok(RARITIES.includes(r), `${k} slot ${r}`)
  }
})
