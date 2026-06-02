import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle, skillLevelMult, scaledEffectValue } from '../src/engine/battle.js'

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`)

test('skillLevelMult: L1=1.0, L3=1.5, L5=2.0', () => {
  close(skillLevelMult(1), 1.0)
  close(skillLevelMult(3), 1.5)
  close(skillLevelMult(5), 2.0)
  close(skillLevelMult(undefined), 1.0) // 미지정=1
})

test('scaledEffectValue: 버프/디버프는 1.0 기준 편차 ×mult, taunt 불변', () => {
  close(scaledEffectValue('dmgDealt', 1.3, 2), 1.6)   // +30% → +60%
  close(scaledEffectValue('dmgTaken', 0.6, 2), 0.2)   // -40% → -80%
  close(scaledEffectValue('dmgDealt', 1.3, 1), 1.3)   // L1 = 원본
  assert.strictEqual(scaledEffectValue('taunt', 1, 2), 1)
})

// 통합: 동일 더미몹에 파이어볼 1회 — 스킬 레벨5 데미지 = 레벨1의 2배(power 스케일).
function nukeDmg(skillLevels) {
  const u = makeUnit(JOBS.mage, 1, null, skillLevels)
  u.mana = 100                              // 첫 행동에 파이어볼(cost50) 발동되게
  const mob = makeMob({ name: 'D', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  const r = runBattle([u], mob, { maxTicks: 200 })  // 200틱 = 마법사 1행동(spd8)
  const m = r.rounds.flatMap(x => x.log).join('\n').match(/→ D \(-(\d+)\)/)
  return m ? Number(m[1]) : null
}

test('스킬 레벨5 = 레벨1의 2배 데미지(power 스케일)', () => {
  const d1 = nukeDmg({})                    // 파이어볼 L1
  const d5 = nukeDmg({ mage_nuke: 5 })      // 파이어볼 L5
  assert.ok(d1 > 0 && d5 > 0, `d1=${d1} d5=${d5}`)
  assert.strictEqual(d5, d1 * 2)            // floor(32*2.2)=70 → 140
})
