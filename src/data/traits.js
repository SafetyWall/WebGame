// 몹 트레잇 = 선언적 규칙. {trigger, cond?, op, value, priority?, exclusive?, rarity}.
// 엔진(engine/traits.js)이 시점별로 평가. rarity = 조우 생성기 랜덤 draw 풀 분류.
export const TRAITS = {
  melee_evade:    { id: 'melee_evade',    name: '근접회피',  rarity: '일반', trigger: 'incomingDamage',     cond: { attackerRange: 'melee' },  op: 'mult',    value: 0.7, priority: 100 },
  melee_immune:   { id: 'melee_immune',   name: '근접면역',  rarity: '영웅', trigger: 'incomingDamage',     cond: { attackerRange: 'melee' },  op: 'mult',    value: 0,   priority: 100 },
  ranged_resist:  { id: 'ranged_resist',  name: '원거리저항', rarity: '일반', trigger: 'incomingDamage',    cond: { attackerRange: 'ranged' }, op: 'mult',    value: 0.5, priority: 100 },
  self_heal:      { id: 'self_heal',      name: '자가회복',  rarity: '희귀', trigger: 'turnStart',                                            op: 'heal',    value: 20,  priority: 100 },
  damage_reflect: { id: 'damage_reflect', name: '데미지반사', rarity: '희귀', trigger: 'postIncomingDamage',                                  op: 'reflect', value: 0.3, priority: 100 },
}
