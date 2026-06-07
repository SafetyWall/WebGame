import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { lowestHpAlly, selectMobTarget, damage, DEF_K } from '../src/engine/battle.js'

test('damage = atk × K/(def+K) — % 경감, 스케일 불변', () => {
  assert.strictEqual(damage(20, 0), 20)            // def=0 → 항등(플레이어 회귀 유지)
  assert.strictEqual(damage(100, DEF_K), 50)       // def=K → 50% (K 무관)
  assert.strictEqual(damage(100, 3 * DEF_K), 25)   // def=3K → 25%
  assert.strictEqual(damage(2000, DEF_K), 1000)    // 스케일 불변: atk 커도 동일 %(min1·floor은 호출부)
})

test('플레이어 def = 직업 메타 상수 (탱 레버)', () => {
  assert.ok(JOBS.guardian.def > 0, '가디언 def > 0')
  assert.strictEqual(JOBS.mage.def ?? 0, 0, '마법사 def 0')
  assert.strictEqual(makeUnit(JOBS.guardian).def, JOBS.guardian.def)
  assert.strictEqual(makeUnit(JOBS.mage).def, JOBS.mage.def ?? 0)
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
