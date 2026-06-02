import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { hasIntercept } from '../src/engine/effects.js'

test('수호 = 자기 intercept effect 부여', () => {
  assert.strictEqual(SKILLS.guardian_guard.effects[0].type, 'intercept')
  assert.strictEqual(hasIntercept({ effects: [{ type: 'intercept', value: 1 }] }), true)
})

test('intercept 보유 가디언이 최저체력 아군 대신 피격', () => {
  // 저체력추적 몹 → 마법사(최저hp) 겨냥. 가디언이 intercept면 가디언이 대신 맞음.
  const g = makeUnit(JOBS.guardian, 1); g.hp = 5000
  g.effects.push({ type: 'intercept', value: 1, source: g.id, expireTick: 99999 })
  const m = makeUnit(JOBS.mage, 1); const mageHp0 = m.hp
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 30, def: 0, spd: 50, traits: ['low_hp_seek'] })
  runBattle([g, m], mob, { maxTicks: 300 })
  assert.strictEqual(m.hp, mageHp0, '마법사 무피해(가디언이 대신)')
  assert.ok(g.hp < 5000, '가디언이 대신 받음')
})

test('intercept 없으면 최저체력 아군이 그대로 피격', () => {
  const g = makeUnit(JOBS.guardian, 1); g.hp = 5000
  const m = makeUnit(JOBS.mage, 1); const mageHp0 = m.hp
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 30, def: 0, spd: 50, traits: ['low_hp_seek'] })
  runBattle([g, m], mob, { maxTicks: 300 })
  assert.ok(m.hp < mageHp0, '마법사 피격됨(intercept 없음)')
})

test('가디언 키트에 수호 포함', () => {
  assert.ok(JOBS.guardian.skills.includes('guardian_guard'))
})
