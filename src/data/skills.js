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
  guardian_strike: { id: 'guardian_strike', name: '방패치기', kind: 'attack', range: 'melee',  power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0, effects: [] },  // 평타(주는뎀↓는 무기파괴로 이동)
  mage_nuke:       { id: 'mage_nuke',       name: '파이어볼', kind: 'attack', range: 'ranged', power: 2.2, manaGain: 0,         cost: 50, cd: 400, effects: [] },
  warrior_cleave:  { id: 'warrior_cleave',  name: '갑옷부수기', kind: 'attack', range: 'melee', power: 1.7, manaGain: 0,        cost: 50, cd: 450,
    effects: [{ target: 'enemy', type: 'dmgTaken', value: 1.25, duration: 500 }] },
  priest_hot:      { id: 'priest_hot',      name: '재생',     kind: 'heal',  range: null,     power: 0,   manaGain: 0,         cost: 50, cd: 500,
    effects: [{ target: 'lowestHpAlly', type: 'hot', valueRatio: 0.5, interval: 100, duration: 500 }] },
  guardian_taunt:  { id: 'guardian_taunt',  name: '도발',     kind: 'attack', range: 'melee',  power: 1.0, manaGain: 0,         cost: 40, cd: 500,
    effects: [{ target: 'self', type: 'taunt', value: 1, duration: 600 }, { target: 'self', type: 'dmgTaken', value: 0.6, duration: 600 }] },

  // === P1 신규 액티브 (기존 메커닉) — 학습/레벨업 대상. 수치 placeholder ===
  warrior_heavy:    { id: 'warrior_heavy',    name: '강타',     kind: 'attack', range: 'melee',  power: 2.8, manaGain: 0, cost: 60, cd: 600, learnCost: 6, effects: [] },
  mage_focus:       { id: 'mage_focus',       name: '마력집중', kind: 'attack', range: 'ranged', power: 0,   manaGain: 0, cost: 30, cd: 700, learnCost: 6,
    effects: [{ target: 'self', type: 'dmgDealt', value: 1.4, duration: 500 }] },
  guardian_sunder:  { id: 'guardian_sunder',  name: '무기파괴', kind: 'attack', range: 'melee',  power: 1.2, manaGain: 0, cost: 40, cd: 500, learnCost: 6,
    effects: [{ target: 'enemy', type: 'dmgDealt', value: 0.8, duration: 500 }] },
  guardian_barrier: { id: 'guardian_barrier', name: '방벽',     kind: 'attack', range: 'melee',  power: 0,   manaGain: 0, cost: 50, cd: 800, learnCost: 6,
    effects: [{ target: 'self', type: 'dmgTaken', value: 0.6, duration: 500 }] },
  priest_heal:      { id: 'priest_heal',      name: '치유',     kind: 'heal',   range: null,     power: 2.0, manaGain: 0, cost: 50, cd: 400, learnCost: 6, effects: [] },
  holy_bolt:        { id: 'holy_bolt',        name: '평타',     kind: 'attack', range: 'ranged', power: 1.0, manaGain: MANA_GAIN, cost: 0, cd: 0, effects: [] },  // 사제 평타(원거리딜+마나젠)

  // === 속도 메커닉 스킬 ===
  mage_lightning:   { id: 'mage_lightning',    name: '라이트닝', kind: 'attack', range: 'ranged', power: 1.3, manaGain: 0, cost: 45, cd: 550, learnCost: 6,
    effects: [{ target: 'enemy', type: 'mark', valueRatio: 0.6, duration: 500 }] },  // 적 표식: 피격당 +floor(시전자atk×0.6)
  warrior_might:    { id: 'warrior_might',     name: '강화',     kind: 'attack', range: 'melee',  power: 0,   manaGain: 0, cost: 40, cd: 700, learnCost: 6,
    effects: [{ target: 'self', type: 'dmgDealt', value: 1.3, duration: 500 }, { target: 'self', type: 'speed', value: 1.3, duration: 500 }] },
  mage_frost:       { id: 'mage_frost',        name: '빙결',     kind: 'attack', range: 'ranged', power: 1.5, manaGain: 0, cost: 40, cd: 500, learnCost: 6,
    effects: [{ target: 'enemy', type: 'speed', value: 0.7, duration: 400 }] },
  warrior_crush:    { id: 'warrior_crush',     name: '분쇄',     kind: 'attack', range: 'melee',  power: 1.5, manaGain: 0, cost: 50, cd: 700, learnCost: 6,
    effects: [{ target: 'enemy', type: 'stun', value: 1, duration: 150 }] },  // 딜 + 적 게이지 정지
  guardian_thorns:  { id: 'guardian_thorns',   name: '가시방패', kind: 'attack', range: 'melee',  power: 0,   manaGain: 0, cost: 45, cd: 600, learnCost: 6,
    effects: [{ target: 'self', type: 'reflect', value: 0.3, duration: 500 }] },  // 받은뎀 30% 반사
  guardian_guard:   { id: 'guardian_guard',    name: '수호',     kind: 'attack', range: 'melee',  power: 0,   manaGain: 0, cost: 50, cd: 700, learnCost: 6,
    effects: [{ target: 'self', type: 'intercept', value: 1, duration: 500 }] },  // 최저체력 아군 대신 받기

  // === 파티 전체 타겟 메커닉(사제) ===
  priest_party_heal: { id: 'priest_party_heal', name: '파티힐',   kind: 'heal', range: null, power: 0, manaGain: 0, cost: 60, cd: 600, learnCost: 6,
    effects: [{ target: 'allies', type: 'hot', valueRatio: 0.4, interval: 100, duration: 400 }] },
  priest_party_buff: { id: 'priest_party_buff', name: '파티뎀버프', kind: 'heal', range: null, power: 0, manaGain: 0, cost: 50, cd: 700, learnCost: 6,
    effects: [{ target: 'allies', type: 'dmgDealt', value: 1.2, duration: 500 }] },

  // === 신규직업 스킬(도적·궁수) — 직업 생성(P11) 전 미배선. 메커닉별로 추가 ===
  rogue_bleed:      { id: 'rogue_bleed',       name: '출혈',     kind: 'attack', range: 'melee',  power: 1.0, manaGain: 0, cost: 35, cd: 400, learnCost: 6,
    effects: [{ target: 'enemy', type: 'dot', valueRatio: 0.3, interval: 100, duration: 500 }] },  // 딜 + 지속 출혈(시전자 atk 비례)
}
