import { test } from 'node:test'
import assert from 'node:assert'
import { SKILLS } from '../src/data/skills.js'
import { makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

// 멀티히트 스킬을 가진 최소 유닛 구성(rawUnit).
function striker(skill) {
  return {
    id: 1, name: 'S', hp: 1e6, maxHp: 1e6, atk: 20, spd: 1000, role: 'dps', heal: 0,
    skills: [skill], def: 0, gauge: 0, mana: 0, manaMax: 100, skillLevels: {}, cooldowns: {}, effects: [],
  }
}

test('hits 필드: 더블어택=2회, 연사=3회', () => {
  assert.strictEqual(SKILLS.rogue_double.hits, 2)
  assert.strictEqual(SKILLS.archer_rapid.hits, 3)
})

test('멀티히트 = 1행동에 hits회 타격(로그 hits개)', () => {
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  const r = runBattle([striker(SKILLS.archer_rapid)], mob, { maxTicks: 1 })  // spd1000 → 1틱 1행동
  const hits = (r.rounds.flatMap(x => x.log).join('\n').match(/→ M \(-/g) || []).length
  assert.strictEqual(hits, 3)   // 연사 3타
})

test('멀티히트 × 표식 시너지: 각 히트가 mark 발동', () => {
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  mob.effects.push({ type: 'mark', value: 100, source: 0, expireTick: 99999 })
  const before = mob.hp
  runBattle([striker(SKILLS.rogue_double)], mob, { maxTicks: 1 })
  // 더블어택 2히트 = (딜 floor(20×0.8)=16 + 표식100) ×2 = 232
  assert.strictEqual(before - mob.hp, (16 + 100) * 2)
})

test('단일타 스킬(hits 없음)은 1회', () => {
  const single = { id: 'x', name: '평타', kind: 'attack', range: 'melee', power: 1, manaGain: 25, cost: 0, cd: 0, effects: [] }
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  const r = runBattle([striker(single)], mob, { maxTicks: 1 })
  const hits = (r.rounds.flatMap(x => x.log).join('\n').match(/→ M \(-/g) || []).length
  assert.strictEqual(hits, 1)
})
