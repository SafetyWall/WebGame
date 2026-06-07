import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { hasIntercept } from '../src/engine/effects.js'

// intercept 메커니즘은 엔진에 보존(향후 2차전직용). 현재 이를 부여하는 직업 스킬은 없음(가디언 제거).
test('hasIntercept = intercept effect 보유 여부 (메커니즘 보존)', () => {
  assert.strictEqual(hasIntercept({ effects: [{ type: 'intercept', value: 1 }] }), true)
  assert.strictEqual(hasIntercept({ effects: [] }), false)
})

test('intercept 보유 유닛이 최저체력 아군 대신 피격', () => {
  // 저체력추적 몹 → 마법사(최저hp) 겨냥. 전사가 intercept면 전사가 대신 맞음.
  const g = makeUnit(JOBS.warrior, 1); g.hp = 5000
  g.effects.push({ type: 'intercept', value: 1, source: g.id, expireTick: 99999 })
  const m = makeUnit(JOBS.mage, 1); const mageHp0 = m.hp
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 30, def: 0, spd: 50, traits: ['low_hp_seek'] })
  runBattle([g, m], mob, { maxTicks: 300 })
  assert.strictEqual(m.hp, mageHp0, '마법사 무피해(전사가 대신)')
  assert.ok(g.hp < 5000, '전사가 대신 받음')
})

test('intercept 없으면 최저체력 아군이 그대로 피격', () => {
  const g = makeUnit(JOBS.warrior, 1); g.hp = 5000
  const m = makeUnit(JOBS.mage, 1); const mageHp0 = m.hp
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 30, def: 0, spd: 50, traits: ['low_hp_seek'] })
  runBattle([g, m], mob, { maxTicks: 300 })
  assert.ok(m.hp < mageHp0, '마법사 피격됨(intercept 없음)')
})
