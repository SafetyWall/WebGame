import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { extraHitFrac } from '../src/engine/effects.js'

// 평타만 쓰는 최소 유닛(rawUnit). spd 10000 → 1틱 1행동.
function striker(skills, over = {}) {
  return {
    id: 1, name: 'S', hp: 1e6, maxHp: 1e6, atk: 20, spd: 10000, role: 'dps', heal: 0,
    skills, def: 0, gauge: 0, mana: 100, manaMax: 100, skillLevels: {}, cooldowns: {}, effects: [], ...over,
  }
}

test('extraHitFrac = extraHit effect 값 합(없으면 0)', () => {
  assert.strictEqual(extraHitFrac({ effects: [] }), 0)
  assert.strictEqual(extraHitFrac({ effects: [{ type: 'extraHit', value: 0.5 }] }), 0.5)
  assert.strictEqual(extraHitFrac({ effects: [{ type: 'dmgDealt', value: 1.2 }] }), 0)
})

test('더블어택 = 자기 extraHit 버프(value=레벨배율 비율)', () => {
  assert.strictEqual(SKILLS.rogue_double.effects[0].type, 'extraHit')
  assert.strictEqual(SKILLS.rogue_double.power, 0)   // 버프(즉발 딜 없음)
})

test('extraHit 버프 중 평타 = 추가타 1회(atk×비율)', () => {
  // 평타(power1, atk20) = 20. extraHit 0.5 → 추가타 floor(20×0.5)=10. 한 행동에 20+10=30.
  const u = striker([SKILLS.melee_strike])
  u.effects.push({ type: 'extraHit', value: 0.5, source: u.id, expireTick: 99999 })
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  const before = mob.hp
  runBattle([u], mob, { maxTicks: 1 })
  assert.strictEqual(before - mob.hp, 30)   // 평타20 + 추가타10
})

test('extraHit는 평타 한정 — 액티브(난무 등)엔 미적용', () => {
  // 난무(cost45) 4히트 atk20 power0.6 → 각 12, 4히트 48. extraHit 있어도 추가타 없음(cost>0).
  const u = striker([SKILLS.rogue_flurry, SKILLS.melee_strike])
  u.effects.push({ type: 'extraHit', value: 0.5, source: u.id, expireTick: 99999 })
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  const before = mob.hp
  runBattle([u], mob, { maxTicks: 1 })   // mana100 → 난무 발동
  assert.strictEqual(before - mob.hp, 48)   // 난무 4×12, 추가타 0(평타 아님)
})

test('마나절단(manaDrain) = 명중 시 적 마나 차감', () => {
  assert.strictEqual(SKILLS.rogue_manacut.manaDrain, 30)
  const u = striker([SKILLS.rogue_manacut, SKILLS.melee_strike])
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  mob.mana = 80
  runBattle([u], mob, { maxTicks: 1 })   // mana100 → 마나절단 발동
  assert.strictEqual(mob.mana, 50)        // 80 − 30
})

test('도적 기본 spd = 130(최고 유지, 150→130 하향)', () => {
  assert.strictEqual(JOBS.rogue.spd, 130)
})
