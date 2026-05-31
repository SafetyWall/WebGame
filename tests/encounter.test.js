import { test } from 'node:test'
import assert from 'node:assert'
import { generateEncounter } from '../src/engine/encounter.js'
import { makeRng } from '../src/engine/rng.js'
import { MONSTERS } from '../src/data/monsters.js'
import { TRAITS } from '../src/data/traits.js'
import { levelCurve } from '../src/data/curve.js'

test('same (stage, seed) produces the same encounter', () => {
  const a = generateEncounter(4, makeRng(42))
  const b = generateEncounter(4, makeRng(42))
  assert.deepStrictEqual(a, b)
})

test('encounter monster is from the pool', () => {
  const names = Object.values(MONSTERS).map(m => m.name)
  const e = generateEncounter(3, makeRng(11))
  assert.ok(names.includes(e.name))
})

test('encounter stats = round(levelCurve(level) × monster mul)', () => {
  const e = generateEncounter(3, makeRng(11))
  const mon = Object.values(MONSTERS).find(m => m.name === e.name)
  const c = levelCurve(3)
  assert.strictEqual(e.hp,  Math.round(c.hp  * mon.mul.hp))
  assert.strictEqual(e.atk, Math.round(c.atk * mon.mul.atk))
  assert.strictEqual(e.def, Math.round(c.def * mon.mul.def))
  assert.strictEqual(e.spd, Math.round(c.spd * mon.mul.spd))
})

test('trait count equals the stage slot count and traits are distinct', () => {
  const e = generateEncounter(4, makeRng(3)) // stage 4 = ['일반','희귀']
  assert.strictEqual(e.traits.length, 2)
  assert.strictEqual(new Set(e.traits).size, 2) // distinct
})

test('drawn traits match the slot rarities in order', () => {
  const e = generateEncounter(4, makeRng(3)) // ['일반','희귀']
  assert.strictEqual(TRAITS[e.traits[0]].rarity, '일반')
  assert.strictEqual(TRAITS[e.traits[1]].rarity, '희귀')
})

test('stage 1 attaches no traits', () => {
  const e = generateEncounter(1, makeRng(99))
  assert.deepStrictEqual(e.traits, [])
})

test('일반 조우는 일반 풀에서만(보스 아님, aoe 없음)', () => {
  const normalNames = Object.values(MONSTERS).map(m => m.name)
  for (let seed = 1; seed <= 20; seed++) {
    const e = generateEncounter(3, makeRng(seed))
    assert.ok(normalNames.includes(e.name), `seed${seed}: ${e.name} 일반풀`)
    assert.strictEqual(e.aoe, false)
    assert.strictEqual(e.boss, false)
  }
})

test('보스 조우(명시 monId): 고정 aoe + 추가(bonus) 트레잇 슬롯 + boss 플래그', () => {
  // stage3 슬롯=['일반'], 오우거 bonus=['희귀'] → 트레잇 2개(일반+희귀), aoe true, boss true
  const e = generateEncounter(3, makeRng(1), 'ogre')
  assert.strictEqual(e.name, '오우거')
  assert.strictEqual(e.aoe, true)
  assert.strictEqual(e.boss, true)
  assert.strictEqual(e.traits.length, 2)
})
