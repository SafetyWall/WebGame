// 수치는 placeholder — 밸런스는 시뮬 후 튜닝. skills = 보유 스킬 id 배열(다중 대비, 지금은 1개).
export const JOBS = {
  novice:   { name: '노비스', hp: 70,  atk: 14, spd: 7, role: 'dps',  skills: ['melee_strike'] },
  warrior:  { name: '전사',   hp: 115, atk: 22, spd: 9, role: 'dps',  skills: ['melee_strike'] },
  mage:     { name: '마법사', hp: 55,  atk: 32, spd: 8, role: 'dps',  skills: ['ranged_strike'] },
  guardian: { name: '가디언', hp: 260, atk: 10, spd: 5, role: 'tank', taunt: true, skills: ['melee_strike'] },
  priest:   { name: '사제',   hp: 95,  atk: 6,  spd: 7, role: 'heal', heal: 30, skills: ['basic_heal'] },
}
