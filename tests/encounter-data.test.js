import { test } from 'node:test'
import assert from 'node:assert'
import { levelCurve } from '../src/data/curve.js'
import { MONSTERS, BOSSES } from '../src/data/monsters.js'
import { STAGES } from '../src/data/stages.js'

const RARITIES = ['일반', '희귀', '영웅', '전설']

test('levelCurve(1) returns base stats', () => {
  assert.deepStrictEqual(levelCurve(1), { hp: 180, atk: 16, def: 3, spd: 90 })
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

test('일반 MONSTERS는 고정 특성/aoe/bonus 없음(보스 아님)', () => {
  for (const [k, m] of Object.entries(MONSTERS)) {
    assert.ok(!m.aoe, `${k} no aoe`)
    assert.ok(!m.fixed, `${k} no fixed`)
    assert.ok(!m.bonus, `${k} no bonus`)
    assert.ok(!m.boss, `${k} not boss`)
  }
})

test('BOSSES entries = name/mul + boss:true + 고정특성(aoe|fixed) 보유', () => {
  assert.ok(Object.keys(BOSSES).length >= 1, '보스 1종 이상')
  for (const [k, b] of Object.entries(BOSSES)) {
    assert.ok(b.name, `${k} name`)
    for (const s of ['hp', 'atk', 'def', 'spd']) assert.ok(Number.isFinite(b.mul[s]), `${k}.mul.${s}`)
    assert.strictEqual(b.boss, true, `${k} boss flag`)
    assert.ok(b.aoe || (Array.isArray(b.fixed) && b.fixed.length), `${k} 고정특성(aoe 또는 fixed)`)
  }
})

test('STAGES have numeric level and traitSlots of valid rarities', () => {
  for (const [k, s] of Object.entries(STAGES)) {
    assert.ok(Number.isFinite(s.level), `${k} level`)
    assert.ok(Array.isArray(s.traitSlots), `${k} traitSlots`)
    for (const r of s.traitSlots) assert.ok(RARITIES.includes(r), `${k} slot ${r}`)
  }
})
