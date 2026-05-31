import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runBattle, selectSkill } from '../src/engine/battle.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { JOBS } from '../src/data/jobs.js'
import { SLIME, OGRE, TURTLE } from './_fixtures.js'

test('selectSkill: 마나 부족 → 평타 fallback', () => {
  const u = makeUnit(JOBS.mage, 1)   // skills=[mage_nuke(cost50), ranged_strike(cost0)]
  u.mana = 0
  assert.equal(selectSkill(u, 0).id, 'ranged_strike')
})

test('selectSkill: 마나 충분 + 쿨 끝 → 발동스킬', () => {
  const u = makeUnit(JOBS.mage, 1)
  u.mana = 100
  assert.equal(selectSkill(u, 0).id, 'mage_nuke')
})

test('selectSkill: 쿨 중 → 평타', () => {
  const u = makeUnit(JOBS.mage, 1)
  u.mana = 100
  u.cooldowns['mage_nuke'] = 500
  assert.equal(selectSkill(u, 100).id, 'ranged_strike')   // tick100 < readyTick500
})

test('평타: 노비스 평타파티 결정론(마나/effect 무관)', () => {
  const a = runBattle([makeUnit(JOBS.novice, 1)], makeMob({ ...SLIME }))
  const b = runBattle([makeUnit(JOBS.novice, 1)], makeMob({ ...SLIME }))
  assert.equal(a.winner, b.winner)
  assert.equal(a.ticks, b.ticks)
})

test('mage_nuke: power 2.2 배율 딜 — 평타보다 빨리 처치', () => {
  const nukeMage = makeUnit(JOBS.mage, 1); nukeMage.mana = 100
  const plainMage = makeUnit(JOBS.mage, 1); plainMage.mana = 0
  plainMage.cooldowns['mage_nuke'] = 999999   // 발동 봉쇄(평타만)
  const withNuke = runBattle([nukeMage], makeMob({ ...TURTLE }), { maxTicks: 5000 })
  const noNuke = runBattle([plainMage], makeMob({ ...TURTLE }), { maxTicks: 5000 })
  assert.ok(withNuke.ticks < noNuke.ticks, `nuke ${withNuke.ticks} < plain ${noNuke.ticks}`)
})

test('warrior_cleave: 전투 완주(증뎀디버프 부여 경로)', () => {
  const w = makeUnit(JOBS.warrior, 1); w.mana = 100
  const r = runBattle([w], makeMob({ ...TURTLE }), { maxTicks: 5000 })
  assert.ok(['party', 'mob'].includes(r.winner))   // 크래시 없이 완주
})

test('guardian_taunt: 도발 effect로 어글 — 가디언이 맞음', () => {
  const g = makeUnit(JOBS.guardian, 1); g.mana = 100
  const m = makeUnit(JOBS.mage, 1)
  runBattle([g, m], makeMob({ ...SLIME }), { maxTicks: 1000 })
  assert.ok(g.hp < g.maxHp, '가디언 피격됨(도발 작동)')
})

test('priest_hot: HoT 틱루프 회복 — 크래시 없이 완주', () => {
  const party = [makeUnit(JOBS.priest, 3), makeUnit(JOBS.novice, 1)]
  party[0].mana = 100
  const r = runBattle(party, makeMob({ ...OGRE }), { maxTicks: 3000 })
  assert.ok(['party', 'mob'].includes(r.winner))
})
