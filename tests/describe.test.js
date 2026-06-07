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
  const d = describeSkill(SKILLS.warrior_cleave)   // power1.7 cost50 cd450 dmgTaken enemy 1.15
  assert.match(d, /근접 공격/)
  assert.match(d, /위력 ×1\.7/)
  assert.match(d, /마나 50/)
  assert.match(d, /쿨 4.5초/)
  assert.match(d, /받는 데미지 \+15%/)   // 보유자 기준(적/자신 접두 없음)
})

test('describeSkill: 버프(power0)는 위력 라인 없음', () => {
  const d = describeSkill(SKILLS.mage_focus)   // power0 dmgDealt self 1.4
  assert.doesNotMatch(d, /위력/)
  assert.match(d, /주는 데미지 \+40%/)
})

test('describeSkill: effect type별 문구', () => {
  assert.match(describeSkill(SKILLS.warrior_crush), /기절 1.5초/)
  assert.match(describeSkill(SKILLS.archer_poison), /지속 데미지 ATK×0\.3/)   // 독화살(구 출혈)
  assert.match(describeSkill(SKILLS.priest_party_heal), /지속 회복/)
  assert.match(describeSkill(SKILLS.mage_lightning), /표식: 피격 시 \+ATK×0\.6/)
  assert.match(describeSkill(SKILLS.warrior_thorns), /받은 데미지 30% 반사/)    // 가시방패(가디언 흡수)
  assert.match(describeSkill(SKILLS.rogue_double), /추가타 ATK×0\.5/)           // 더블어택 버프
})

test('describeSkill: hits·ignoreDef', () => {
  assert.match(describeSkill(SKILLS.archer_rapid), /3회 타격/)
  assert.match(describeSkill(SKILLS.mage_pierce), /방어 100% 무시/)             // 관통(법사 이관)
})

test('describeSkill: 회복 스킬 = 회복 태그', () => {
  assert.match(describeSkill(SKILLS.priest_heal), /회복/)   // power2 cost50
  assert.match(describeSkill(SKILLS.priest_heal), /위력 ×2/)
})

test('describeSkill: 스킬 레벨로 위력·effect 스케일', () => {
  // warrior_cleave dmgTaken 1.15 @ lv2(mult1.25) → 1+(0.15)*1.25=1.1875 → +19%
  assert.match(describeSkill(SKILLS.warrior_cleave, 2), /받는 데미지 \+19%/)
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
  assert.match(describeTrait(TRAITS.atk_seek), /공격력 높은 적 우선/)
})

test('describeTrait: 스탯 트레잇 = "스탯 +N%"', () => {
  assert.match(describeTrait(TRAITS.stat_atk), /공격력 \+20%/)
  assert.match(describeTrait(TRAITS.stat_def), /방어력 \+20%/)
  assert.match(describeTrait(TRAITS.stat_hp), /체력 \+20%/)
  assert.match(describeTrait(TRAITS.stat_spd), /속도 \+10%/)
})

test('describeAoe: 광역 설명', () => {
  assert.match(describeAoe(), /광역 공격/)
})

test('describeTrait: 2차 — 관통/흡혈/저항/면역/연타봉쇄/오라', () => {
  assert.match(describeTrait(TRAITS.armor_pierce), /방어 50% 무시/)
  assert.match(describeTrait(TRAITS.armor_pierce_full), /방어 완전 무시/)
  assert.match(describeTrait(TRAITS.lifesteal), /가한 피해 30% 흡혈/)
  assert.match(describeTrait(TRAITS.dot_resist), /지속 피해 -50%/)
  assert.match(describeTrait(TRAITS.dot_immune), /지속 피해 면역/)
  assert.match(describeTrait(TRAITS.debuff_resist), /디버프 -50%/)
  assert.match(describeTrait(TRAITS.debuff_immune), /디버프 면역/)
  assert.match(describeTrait(TRAITS.multihit_lock), /연타 봉쇄/)
  assert.match(describeTrait(TRAITS.heal_weaken), /파티 받는 회복 -50%/)
  assert.match(describeTrait(TRAITS.heal_block), /파티 회복 봉쇄/)
  assert.match(describeTrait(TRAITS.mana_suppress), /파티 마나 획득 -50%/)
  assert.match(describeTrait(TRAITS.gauge_slow), /파티 행동 속도 -30%/)
  assert.match(describeTrait(TRAITS.gauge_bind), /파티 행동 속도 -60%/)
})
