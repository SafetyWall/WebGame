import { test } from 'node:test'
import assert from 'node:assert'
import { SKILLS } from '../src/data/skills.js'
import { JOBS } from '../src/data/jobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { tickDoT } from '../src/engine/effects.js'

test('tickDoT: nextTick 도달 시 데미지 + nextTick 전진', () => {
  const mob = { name: 'M', hp: 100, effects: [{ type: 'dot', value: 10, interval: 100, nextTick: 100 }] }
  const log = []
  tickDoT(mob, 100, log)
  assert.strictEqual(mob.hp, 90)
  assert.strictEqual(mob.effects[0].nextTick, 200)   // 다음 틱 전진
  tickDoT(mob, 150, log)                              // 아직 nextTick(200) 전 → no-op
  assert.strictEqual(mob.hp, 90)
})

test('독화살(dot) = 틱당 데미지 정의', () => {
  assert.strictEqual(SKILLS.archer_poison.effects[0].type, 'dot')
  assert.ok(SKILLS.archer_poison.effects[0].valueRatio > 0)
  assert.ok(SKILLS.archer_poison.effects[0].interval > 0)
})

test('dot 걸린 몹은 시간에 따라 hp 감소(여러 틱)', () => {
  const t = makeUnit(JOBS.mage, 1); t.hp = 1e6   // 마법사 spd90 → 첫 행동 tick112(110틱 내 미행동)
  const mob = makeMob({ name: 'M', hp: 100000, atk: 0, def: 0, spd: 0, traits: [] })
  mob.effects.push({ type: 'dot', value: 20, interval: 100, nextTick: 100, source: 0, expireTick: 1050 })
  runBattle([t], mob, { maxTicks: 110 })   // dot 1회(tick100), 마법사 미행동(112>110) → dot만
  assert.strictEqual(mob.hp, 100000 - 20)
})
