import { test } from 'node:test'
import assert from 'node:assert'
import { SKILLS } from '../src/data/skills.js'
import { makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

function striker(skill) {
  return {
    id: 1, name: 'S', hp: 1e6, maxHp: 1e6, atk: 50, spd: 10000, role: 'dps', heal: 0,
    skills: [skill], def: 0, gauge: 0, mana: 0, manaMax: 100, skillLevels: {}, cooldowns: {}, effects: [],
  }
}

function firstHit(skill, mobDef) {
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: mobDef, spd: 0, traits: [] })
  const r = runBattle([striker(skill)], mob, { maxTicks: 1 })
  const m = r.rounds.flatMap(x => x.log).join('\n').match(/→ M \(-(\d+)\)/)
  return Number(m[1])
}

test('방어무시 = ignoreDef 필드', () => {
  assert.strictEqual(SKILLS.rogue_pierce.ignoreDef, 1)
})

test('방어무시는 고방 적에게 def 무시 데미지', () => {
  // 고방(def 40) 몹: 일반 스킬 power1.2 atk50 → floor(60)→damage(60,40)=42.8→42. 방무 → damage(60,0)=60. (% 경감식)
  const normal = { id: 'n', name: 'n', kind: 'attack', range: 'melee', power: 1.2, manaGain: 25, cost: 0, cd: 0, effects: [] }
  const dPierce = firstHit(SKILLS.rogue_pierce, 40)
  const dNormal = firstHit(normal, 40)
  assert.strictEqual(dNormal, 42)
  assert.strictEqual(dPierce, 60)
  assert.ok(dPierce > dNormal)
})

test('저방 적엔 차이 작음(방어무시 가치 = 고방 상대)', () => {
  const normal = { id: 'n', name: 'n', kind: 'attack', range: 'melee', power: 1.2, manaGain: 25, cost: 0, cd: 0, effects: [] }
  assert.strictEqual(firstHit(SKILLS.rogue_pierce, 0), firstHit(normal, 0))  // def0 = 동일
})
