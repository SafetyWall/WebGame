import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { lowestHpAlly, selectMobTarget, damage } from '../src/engine/battle.js'

test('damage = max(1, atk - def)', () => {
  assert.strictEqual(damage(20, 5), 15)
  assert.strictEqual(damage(3, 10), 1) // 최소 1 보장
})

test('lowestHpAlly picks the alive ally with the lowest hp', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.priest)]
  const alive = party.filter(u => u.hp > 0)
  assert.strictEqual(alive.length, 2)
  assert.strictEqual(alive[0].name, '전사')
  assert.strictEqual(alive[1].name, '사제')
})

test('selectMobTarget prefers an ally with an active taunt effect', () => {
  // step5: 도발=발동스킬 effect(상시 taunt 아님). taunt effect 있는 아군을 우선 타게팅.
  const party = [makeUnit(JOBS.mage), makeUnit(JOBS.guardian)]
  party[1].effects.push({ type: 'taunt', value: 1, source: party[1].id, expireTick: 9999 })
  const t = selectMobTarget(party)
  assert.strictEqual(t.name, '가디언')
  assert.strictEqual(t.hp, makeUnit(JOBS.guardian).hp)
})

test('selectMobTarget targets the front-most (party-order first) ally when no taunt', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage)]
  assert.strictEqual(selectMobTarget(party).name, '전사')  // 앞열 = 배열 첫
})

test('selectMobTarget skips a dead front unit to the next alive', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage)]
  party[0].hp = 0
  assert.strictEqual(selectMobTarget(party).name, '마법사')
})

test('selectMobTarget with multiple taunters picks the front-most taunter', () => {
  const party = [makeUnit(JOBS.mage), makeUnit(JOBS.guardian), makeUnit(JOBS.warrior)]
  party[1].effects.push({ type: 'taunt', value: 1, source: party[1].id, expireTick: 9999 })
  party[2].effects.push({ type: 'taunt', value: 1, source: party[2].id, expireTick: 9999 })
  assert.strictEqual(selectMobTarget(party).name, '가디언')  // 앞열 도발자
})

test('selectMobTarget returns null for empty or all-dead party', () => {
  assert.strictEqual(selectMobTarget([]), null)
  const p = [makeUnit(JOBS.warrior)]; p[0].hp = 0
  assert.strictEqual(selectMobTarget(p), null)
})
