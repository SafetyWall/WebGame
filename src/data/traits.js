// 몹 트레잇 = 선언적. 계열(메타 필드로 구분, engine이 해당 시점에 읽음):
//   규칙형 {trigger,cond?,op,value,priority?,exclusive?,defends?} — engine/traits.js applyRules가 시점별 평가.
//   타겟팅형 {targeting:{position?,lowHp?,atk?}} — engine/threat.js가 몹 타겟 weight 변조(trigger 없음).
//   스탯형 {stat:'atk'|'def'|'hp'|'spd', mult} — 조우 생성 시 몹 base 스탯 × mult(무간섭).
//   2차 메타 — pierce(관통)·lifesteal(흡혈): engine/battle actMob 직접 읽음.
//            resist:{dot?,debuff?}(저항/면역): applySkillEffects→resolveMobEffect. hitCap(연타봉쇄): actUnit.
//            aura:{aura:effectType,value}(오라): applyMobAuras가 전투시작 파티 전원에 effect 스탬프.
// rarity = 조우 생성기 draw 풀 분류. inactive:true = 정의 유지하되 어떤 슬롯에도 안 뜸(보류).
// defends = 방어 트레잇 메타(범위·완전봉쇄) → conflicts() 상호배제(§7.2 전딜봉쇄 방지)용.
// 1차 = 기존 엔진 재활용. 2차 = 신규 엔진(라이브, 아래) — 관통·흡혈·지속/디버프 저항·면역·연타봉쇄·힐/마나/게이지 오라.
export const TRAITS = {
  // === 일반 = 스탯 % 강화 + 사거리 부분저항(혼합파티 실효 ~절반). 속도는 강력 → 절반. 수치 placeholder. ===
  stat_atk: { id: 'stat_atk', name: '맹공', rarity: '일반', stat: 'atk', mult: 1.2 },
  stat_def: { id: 'stat_def', name: '철갑', rarity: '일반', stat: 'def', mult: 1.2 },
  stat_hp:  { id: 'stat_hp',  name: '강골', rarity: '일반', stat: 'hp',  mult: 1.2 },
  stat_spd: { id: 'stat_spd', name: '쾌속', rarity: '일반', stat: 'spd', mult: 1.1 },
  melee_evade:   { id: 'melee_evade',   name: '근접회피',  rarity: '일반', trigger: 'incomingDamage', cond: { attackerRange: 'melee' },  op: 'mult', value: 0.7, priority: 100, defends: { range: 'melee',  full: false } },
  ranged_resist: { id: 'ranged_resist', name: '원거리저항', rarity: '일반', trigger: 'incomingDamage', cond: { attackerRange: 'ranged' }, op: 'mult', value: 0.5, priority: 100, defends: { range: 'ranged', full: false } },

  // === 희귀 = 레버 1개(서스테인·반사·타겟팅) ===
  self_heal:      { id: 'self_heal',      name: '자가회복', rarity: '희귀', trigger: 'turnStart',          op: 'heal',    value: 20,  priority: 100 },
  damage_reflect: { id: 'damage_reflect', name: '데미지반사', rarity: '희귀', trigger: 'postIncomingDamage', op: 'reflect', value: 0.3, priority: 100 },
  low_hp_seek:    { id: 'low_hp_seek',    name: '저체력추적', rarity: '희귀', targeting: { position: 0, lowHp: 1 } },  // 탱월(앞열 소킹) 무력화 = 최저체력 직격
  atk_seek:       { id: 'atk_seek',       name: '고공격력추적', rarity: '희귀', targeting: { position: 0, atk: 1 } },   // 물몸 딜러 직격

  // === 영웅 = 완전봉쇄(빌드 왜곡) ===
  melee_immune:  { id: 'melee_immune',  name: '근접면역',  rarity: '영웅', trigger: 'incomingDamage', cond: { attackerRange: 'melee' },  op: 'mult', value: 0, priority: 100, defends: { range: 'melee',  full: true } },
  ranged_immune: { id: 'ranged_immune', name: '원거리면역', rarity: '영웅', trigger: 'incomingDamage', cond: { attackerRange: 'ranged' }, op: 'mult', value: 0, priority: 100, defends: { range: 'ranged', full: true } },

  // === 전설 (현 1~50 SLOT_SEQ엔 전설 슬롯 없음 → 미등장. 2차에서 재슬롯) ===
  regeneration: { id: 'regeneration', name: '재생', rarity: '전설', trigger: 'turnStart', op: 'heal', value: 50, priority: 100 },

  // === 2차 (라이브 — 신규 엔진) — 부분(희귀)/완전(영웅) 페어. 수치 placeholder(econ-sim). ===
  // 몹 공격측 메타(engine/battle actMob 직접 읽음): pierce=관통(플레이어 def 무시), lifesteal=흡혈(가한뎀%回).
  armor_pierce:      { id: 'armor_pierce',      name: '관통',     rarity: '희귀', pierce: 0.5 },
  armor_pierce_full: { id: 'armor_pierce_full', name: '관통완전', rarity: '영웅', pierce: 1.0 },
  lifesteal:         { id: 'lifesteal',         name: '흡혈',     rarity: '희귀', lifesteal: 0.3 },
  lifesteal_greater: { id: 'lifesteal_greater', name: '대흡혈',   rarity: '영웅', lifesteal: 0.6 },
  // 들어오는 effect 저항/면역(resolveMobEffect): resist.<key>=남는 위력(0=면역). dot=지속, debuff=감속·빙결·약점·스턴·표식.
  dot_resist:    { id: 'dot_resist',    name: '지속저항',   rarity: '희귀', resist: { dot: 0.5 } },
  dot_immune:    { id: 'dot_immune',    name: '지속면역',   rarity: '영웅', resist: { dot: 0 } },
  debuff_resist: { id: 'debuff_resist', name: '디버프저항', rarity: '희귀', resist: { debuff: 0.5 } },
  debuff_immune: { id: 'debuff_immune', name: '디버프면역', rarity: '영웅', resist: { debuff: 0 } },
  // 연타봉쇄(hitCap): 멀티히트 타격 횟수 상한.
  multihit_lock: { id: 'multihit_lock', name: '연타봉쇄', rarity: '영웅', hitCap: 1 },
  // 파티 오라(applyMobAuras → 전투시작 파티 전원 effect): aura=effect타입, value=배율(0=완전봉쇄).
  heal_weaken:   { id: 'heal_weaken',   name: '힐약화',     rarity: '희귀', aura: 'healReduce',   value: 0.5 },
  heal_block:    { id: 'heal_block',    name: '힐봉쇄',     rarity: '영웅', aura: 'healReduce',   value: 0 },
  mana_suppress: { id: 'mana_suppress', name: '마나억제',   rarity: '희귀', aura: 'manaSuppress', value: 0.5 },
  mana_block:    { id: 'mana_block',    name: '마나봉쇄',   rarity: '영웅', aura: 'manaSuppress', value: 0 },
  gauge_slow:    { id: 'gauge_slow',    name: '게이지지연', rarity: '희귀', aura: 'speed',        value: 0.7 },
  gauge_bind:    { id: 'gauge_bind',    name: '게이지구속', rarity: '영웅', aura: 'speed',        value: 0.4 },
}
