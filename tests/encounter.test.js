import { test } from 'node:test'
import assert from 'node:assert'
import { generateEncounter, conflicts } from '../src/engine/encounter.js'
import { makeRng } from '../src/engine/rng.js'
import { MONSTERS } from '../src/data/monsters.js'
import { TRAITS } from '../src/data/traits.js'
import { levelCurve } from '../src/data/curve.js'
import { STAGES } from '../src/data/stages.js'

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
  const stage = 9                       // S9 = [일반,일반,희귀] (스킵 없음: 일반풀3≥2·희귀풀2≥1)
  const e = generateEncounter(stage, makeRng(3))
  assert.strictEqual(e.traits.length, STAGES[stage].traitSlots.length)
  assert.strictEqual(new Set(e.traits).size, e.traits.length) // distinct
})

test('drawn traits match the slot rarities in order', () => {
  const stage = 9
  const e = generateEncounter(stage, makeRng(3))
  STAGES[stage].traitSlots.forEach((r, i) => assert.strictEqual(TRAITS[e.traits[i]].rarity, r, `slot ${i}`))
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

test('상호배제(conflicts): 한 범위 완전봉쇄 + 다른 범위 방어 동시 금지', () => {
  assert.strictEqual(conflicts(['melee_immune'], 'ranged_resist'), true)   // 풀근접봉쇄 + 원거리방어
  assert.strictEqual(conflicts(['melee_immune'], 'ranged_immune'), true)
  assert.strictEqual(conflicts(['ranged_immune'], 'melee_evade'), true)    // 풀원거리봉쇄 + 근접방어
  assert.strictEqual(conflicts(['melee_evade'], 'ranged_resist'), false)   // 부분+부분 = 양쪽 클리어 가능 → OK
  assert.strictEqual(conflicts(['melee_immune'], 'melee_evade'), false)    // 같은 범위(원거리 안 막음) → OK
  assert.strictEqual(conflicts(['self_heal'], 'melee_immune'), false)      // 비방어 트레잇 무관
})

test('보스 dragon: 고정 trait(regeneration) + aoe + 전딜봉쇄 조합 안 만듦', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const e = generateEncounter(3, makeRng(seed), 'dragon')
    assert.ok(e.traits.includes('regeneration'), `seed${seed} fixed regeneration`)
    assert.strictEqual(e.aoe, true)
    assert.ok(!(e.traits.includes('melee_immune') && e.traits.includes('ranged_immune')), `seed${seed} 양면역 금지`)
  }
})
