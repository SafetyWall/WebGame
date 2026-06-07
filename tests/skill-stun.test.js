import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { isStunned } from '../src/engine/effects.js'

test('isStunned = stun effect 보유', () => {
  assert.strictEqual(isStunned({ effects: [] }), false)
  assert.strictEqual(isStunned({ effects: [{ type: 'stun', value: 1 }] }), true)
})

test('분쇄 = 딜 + 적 stun effect 부여', () => {
  assert.strictEqual(SKILLS.warrior_crush.effects[0].type, 'stun')
  assert.ok(SKILLS.warrior_crush.power > 0)
  const w = makeUnit(JOBS.warrior, 1, null, {}, ['warrior_crush']); w.mana = 100
  const mob = makeMob({ name: 'D', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  runBattle([w], mob, { maxTicks: 200 })   // 전사 1행동(분쇄)
  assert.ok(mob.effects.some(e => e.type === 'stun'), '몹 stun 부여됨')
})

test('스턴 중 몹은 게이지 안 차오르고 행동 못 함', () => {
  // 고속 몹(spd100)에 stun 직접 부여 → 게이지 동결 → 행동 0.
  const t = makeUnit(JOBS.guardian, 1); t.hp = 1e6
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 50, def: 0, spd: 100, traits: [] })
  mob.effects.push({ type: 'stun', value: 1, source: 0, expireTick: 99999 })
  const r = runBattle([t], mob, { maxTicks: 500 })
  const acted = r.rounds.flatMap(x => x.log).some(l => l.includes('M 공격') || l.includes('M 광역'))
  assert.strictEqual(acted, false, '스턴 몹은 행동 없음')
  assert.strictEqual(mob.gauge, 0, '게이지 동결')
})

test('전사 키트 = 4 액티브(갑옷부수기/강타/분쇄/방벽) + 평타', () => {
  assert.deepStrictEqual(JOBS.warrior.skills,
    ['warrior_cleave', 'warrior_heavy', 'warrior_crush', 'guardian_barrier', 'melee_strike'])
})
