import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

const dummyMob = () => makeMob({ name: 'D', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })

test('파티뎀버프 = 파티 전원에 dmgDealt 버프 부여(target allies)', () => {
  const p = makeUnit(JOBS.priest, 1, null, {}, ['priest_party_buff']); p.mana = 100
  const a = makeUnit(JOBS.warrior, 1)
  const b = makeUnit(JOBS.mage, 1)
  runBattle([p, a, b], dummyMob(), { maxTicks: 200 })   // 사제 1행동
  for (const u of [p, a, b]) {
    assert.ok(u.effects.some(e => e.type === 'dmgDealt' && e.value > 1), `${u.name} 버프`)
  }
})

test('파티힐 = 파티 전원에 hot 부여(target allies)', () => {
  const p = makeUnit(JOBS.priest, 1, null, {}, ['priest_party_heal']); p.mana = 100
  const a = makeUnit(JOBS.warrior, 1)
  runBattle([p, a], dummyMob(), { maxTicks: 200 })
  for (const u of [p, a]) {
    assert.ok(u.effects.some(e => e.type === 'hot'), `${u.name} hot`)
  }
})

test('사제 키트 = 4 액티브(치유/재생/파티힐/파티뎀버프) + 평타', () => {
  assert.deepStrictEqual(JOBS.priest.skills,
    ['priest_heal', 'priest_hot', 'priest_party_heal', 'priest_party_buff', 'holy_bolt'])
  assert.strictEqual(SKILLS.priest_party_heal.effects[0].target, 'allies')
  assert.strictEqual(SKILLS.priest_party_buff.effects[0].target, 'allies')
})
