import { test } from 'node:test'
import assert from 'node:assert'
import { describeSkill, describeTrait, describeAoe } from '../src/ui/describe.js'
import { SKILLS } from '../src/data/skills.js'
import { TRAITS } from '../src/data/traits.js'

test('describeSkill: 기본 공격 = 마나 충전·쿨 없음', () => {
  const d = describeSkill(SKILLS.melee_strike)
  assert.match(d, /근접 공격/)
  assert.match(d, /기본 공격\(마나 충전 \+25\)/)
  assert.doesNotMatch(d, /쿨/)
})

test('describeSkill: 공격 스킬 = 위력·마나·쿨', () => {
  const d = describeSkill(SKILLS.warrior_cleave)   // power1.7 cost50 cd450 dmgTaken enemy 1.25
  assert.match(d, /근접 공격/)
  assert.match(d, /위력 ×1\.7/)
  assert.match(d, /마나 50/)
  assert.match(d, /쿨 450틱/)
  assert.match(d, /받는 데미지 \+25%/)   // 보유자 기준(적/자신 접두 없음)
})

test('describeSkill: 버프(power0)는 위력 라인 없음', () => {
  const d = describeSkill(SKILLS.guardian_barrier)   // power0 dmgTaken self 0.6
  assert.doesNotMatch(d, /위력/)
  assert.match(d, /받는 데미지 -40%/)
})

test('describeSkill: effect type별 문구', () => {
  assert.match(describeSkill(SKILLS.warrior_crush), /기절 150틱/)
  assert.match(describeSkill(SKILLS.rogue_bleed), /지속 데미지 ATK×0\.3/)
  assert.match(describeSkill(SKILLS.priest_party_heal), /지속 회복/)
  assert.match(describeSkill(SKILLS.mage_lightning), /표식: 피격 시 \+ATK×0\.6/)
  assert.match(describeSkill(SKILLS.guardian_thorns), /받은 데미지 30% 반사/)
  assert.match(describeSkill(SKILLS.guardian_guard), /최저체력 아군 대신 피격/)
  assert.match(describeSkill(SKILLS.guardian_taunt), /도발/)
})

test('describeSkill: hits·ignoreDef', () => {
  assert.match(describeSkill(SKILLS.archer_rapid), /3회 타격/)
  assert.match(describeSkill(SKILLS.rogue_pierce), /방어 100% 무시/)
})

test('describeSkill: 회복 스킬 = 회복 태그', () => {
  assert.match(describeSkill(SKILLS.priest_heal), /회복/)   // power2 cost50
  assert.match(describeSkill(SKILLS.priest_heal), /위력 ×2/)
})

test('describeSkill: 스킬 레벨로 위력·effect 스케일', () => {
  // warrior_cleave dmgTaken 1.25 @ lv2(mult1.25) → 1+(0.25)*1.25=1.3125 → +31%
  assert.match(describeSkill(SKILLS.warrior_cleave, 2), /받는 데미지 \+31%/)
})

test('describeTrait: 회피/면역/저항', () => {
  assert.match(describeTrait(TRAITS.melee_evade), /근접 공격 데미지 -30%/)
  assert.match(describeTrait(TRAITS.melee_immune), /근접 공격 면역/)
  assert.match(describeTrait(TRAITS.ranged_resist), /원거리 공격 데미지 -50%/)
})

test('describeTrait: 회복/반사/타겟팅', () => {
  assert.match(describeTrait(TRAITS.regeneration), /매 턴 시작 HP \+50/)
  assert.match(describeTrait(TRAITS.damage_reflect), /받은 데미지 30% 반사/)
  assert.match(describeTrait(TRAITS.low_hp_seek), /체력 낮은 적 우선/)
})

test('describeAoe: 광역 설명', () => {
  assert.match(describeAoe(), /광역 공격/)
})
