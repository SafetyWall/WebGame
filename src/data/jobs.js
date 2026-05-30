// 수치는 placeholder — 밸런스는 시뮬 후 튜닝. type 태그는 베이스선 효과 0 (미래 RPS용).
export const JOBS = {
  novice:   { name: '노비스', hp: 70,  atk: 14, type: 'phys',  spd: 7, role: 'dps' },
  warrior:  { name: '전사',   hp: 115, atk: 22, type: 'phys',  spd: 9, role: 'dps' },
  mage:     { name: '마법사', hp: 55,  atk: 32, type: 'magic', spd: 8, role: 'dps' },
  guardian: { name: '가디언', hp: 260, atk: 10, type: 'phys',  spd: 5, role: 'tank', taunt: true },
  priest:   { name: '사제',   hp: 95,  atk: 6,  type: 'heal',  spd: 7, role: 'heal', heal: 30 },
}
