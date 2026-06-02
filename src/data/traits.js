// 몹 트레잇 = 선언적 규칙. {trigger, cond?, op, value, priority?, exclusive?, rarity, defends?}.
// 엔진(engine/traits.js)이 시점별로 평가. rarity = 조우 생성기 랜덤 draw 풀 분류.
// defends = 방어 트레잇 메타(범위·완전봉쇄 여부) → 조우 생성기 상호배제(§7.2 전딜봉쇄 방지)용. 전투 거동엔 무관.
export const TRAITS = {
  melee_evade:    { id: 'melee_evade',    name: '근접회피',  rarity: '일반', trigger: 'incomingDamage',     cond: { attackerRange: 'melee' },  op: 'mult',    value: 0.7, priority: 100, defends: { range: 'melee',  full: false } },
  melee_immune:   { id: 'melee_immune',   name: '근접면역',  rarity: '영웅', trigger: 'incomingDamage',     cond: { attackerRange: 'melee' },  op: 'mult',    value: 0,   priority: 100, defends: { range: 'melee',  full: true } },
  ranged_resist:  { id: 'ranged_resist',  name: '원거리저항', rarity: '일반', trigger: 'incomingDamage',    cond: { attackerRange: 'ranged' }, op: 'mult',    value: 0.5, priority: 100, defends: { range: 'ranged', full: false } },
  ranged_immune:  { id: 'ranged_immune',  name: '원거리면역', rarity: '영웅', trigger: 'incomingDamage',    cond: { attackerRange: 'ranged' }, op: 'mult',    value: 0,   priority: 100, defends: { range: 'ranged', full: true } },
  self_heal:      { id: 'self_heal',      name: '자가회복',  rarity: '희귀', trigger: 'turnStart',                                            op: 'heal',    value: 20,  priority: 100 },
  damage_reflect: { id: 'damage_reflect', name: '데미지반사', rarity: '희귀', trigger: 'postIncomingDamage',                                  op: 'reflect', value: 0.3, priority: 100 },
  regeneration:   { id: 'regeneration',   name: '재생',      rarity: '전설', trigger: 'turnStart',                                            op: 'heal',    value: 50,  priority: 100 },
  // 타겟팅 트레잇 = trigger 없음(applyRules 무간섭). engine/threat.js가 targeting weight로 몹 타겟 변조.
  low_hp_seek:     { id: 'low_hp_seek',     name: '저체력추적', rarity: '일반', targeting: { position: 0, lowHp: 1 } },
  backline_pierce: { id: 'backline_pierce', name: '후열관통',   rarity: '희귀', targeting: { position: -1 } },
}
