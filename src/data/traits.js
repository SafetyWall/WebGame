// 몹 트레잇 = 선언적 규칙. {trigger, cond?, op, value, priority?, exclusive?}.
// 엔진(engine/traits.js)이 시점별로 평가. §7.2 로스터 전체 정의(수치 placeholder).
// 라이브 부착은 melee_evade만(mobs.js). 나머지는 엔진/데이터 준비됨, 몹 미부착.
export const TRAITS = {
  melee_evade:    { id: 'melee_evade',    name: '근접회피',  trigger: 'incomingDamage',     cond: { attackerRange: 'melee' },  op: 'mult',    value: 0.7, priority: 100 },
  melee_immune:   { id: 'melee_immune',   name: '근접면역',  trigger: 'incomingDamage',     cond: { attackerRange: 'melee' },  op: 'mult',    value: 0,   priority: 100 },
  ranged_resist:  { id: 'ranged_resist',  name: '원거리저항', trigger: 'incomingDamage',    cond: { attackerRange: 'ranged' }, op: 'mult',    value: 0.5, priority: 100 },
  self_heal:      { id: 'self_heal',      name: '자가회복',  trigger: 'turnStart',                                             op: 'heal',    value: 20,  priority: 100 },
  damage_reflect: { id: 'damage_reflect', name: '데미지반사', trigger: 'postIncomingDamage',                                   op: 'reflect', value: 0.3, priority: 100 },
}
