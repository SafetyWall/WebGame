// 선언적 스킬 테이블. kind=행동 종류, range=근접/원거리 이진 태그(heal은 null).
// 위력은 유닛 스탯에서(attack→unit.atk, heal→unit.heal) — 스킬엔 power 없음.
// 가변 상태(마나/쿨, step5)는 유닛에 보관 → SKILLS는 공유 def, clone 불필요.
export const SKILLS = {
  melee_strike:  { id: 'melee_strike',  name: '평타', kind: 'attack', range: 'melee'  },
  ranged_strike: { id: 'ranged_strike', name: '평타', kind: 'attack', range: 'ranged' },
  basic_heal:    { id: 'basic_heal',    name: '평타', kind: 'heal',   range: null     },
}
