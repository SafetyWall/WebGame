// 몹 트레잇 = 선언적. 3계열:
//   규칙형 {trigger,cond?,op,value,priority?,exclusive?,defends?} — engine/traits.js가 시점별 평가.
//   타겟팅형 {targeting:{position?,lowHp?,atk?}} — engine/threat.js가 몹 타겟 weight 변조(trigger 없음).
//   스탯형 {stat:'atk'|'def'|'hp'|'spd', mult} — 조우 생성 시 몹 base 스탯 × mult(applyRules·conflicts 무간섭).
// rarity = 조우 생성기 draw 풀 분류. inactive:true = 정의 유지하되 어떤 슬롯에도 안 뜸(보류).
// defends = 방어 트레잇 메타(범위·완전봉쇄) → conflicts() 상호배제(§7.2 전딜봉쇄 방지)용.
// 1차 = 기존 엔진 재활용 셋. 2차(연타봉쇄·DoT/디버프 면역·힐차단·흡혈·광역·템포)는 신규 엔진 필요 → TODOS.
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
}
