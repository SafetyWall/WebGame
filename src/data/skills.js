// 선언적 스킬 테이블. kind=행동, range=근/원 이진 태그(heal은 null).
// power=즉발 위력 배율(attack→atk×power, heal→heal×power), manaGain=행동 시 자기 마나+,
// cost=발동 마나소비, cd=쿨다운(틱), effects=부여 effect 스펙.
// effect 스펙 = { target:'self'|'enemy'|'lowestHpAlly', type, value|valueRatio, duration, interval? }
//   배율형(dmgTaken/dmgDealt) = value 그대로. hot = valueRatio(시전자 heal 스케일) + interval.
// 가변 상태(마나/쿨/effect 인스턴스)는 유닛에 보관 → SKILLS는 공유 def, clone 불필요.
export const MANA_MAX = 100
export const MANA_GAIN = 25

export const SKILLS = {
  melee_strike:    { id: 'melee_strike',    name: '평타',     kind: 'attack', range: 'melee',  power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0,   effects: [] },
  ranged_strike:   { id: 'ranged_strike',   name: '평타',     kind: 'attack', range: 'ranged', power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0,   effects: [] },
  basic_heal:      { id: 'basic_heal',      name: '평타',     kind: 'heal',   range: null,     power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0,   effects: [] },
  guardian_strike: { id: 'guardian_strike', name: '방패치기', kind: 'attack', range: 'melee',  power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0,
    effects: [{ target: 'enemy', type: 'dmgDealt', value: 0.95, duration: 150 }] },
  mage_nuke:       { id: 'mage_nuke',       name: '파이어볼', kind: 'attack', range: 'ranged', power: 2.2, manaGain: 0,         cost: 50, cd: 400, effects: [] },
  warrior_cleave:  { id: 'warrior_cleave',  name: '갑옷부수기', kind: 'attack', range: 'melee', power: 1.7, manaGain: 0,        cost: 50, cd: 450,
    effects: [{ target: 'enemy', type: 'dmgTaken', value: 1.25, duration: 500 }] },
  priest_hot:      { id: 'priest_hot',      name: '치유의기도', kind: 'heal',  range: null,     power: 0,   manaGain: 0,         cost: 50, cd: 500,
    effects: [{ target: 'lowestHpAlly', type: 'hot', valueRatio: 0.5, interval: 100, duration: 500 }] },
  guardian_taunt:  { id: 'guardian_taunt',  name: '도발',     kind: 'attack', range: 'melee',  power: 1.0, manaGain: 0,         cost: 40, cd: 500,
    effects: [{ target: 'self', type: 'taunt', value: 1, duration: 600 }, { target: 'self', type: 'dmgTaken', value: 0.6, duration: 600 }] },
}
