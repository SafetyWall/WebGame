// 선언적 스킬 테이블. kind=행동, range=근/원 이진 태그(heal은 null).
// power=즉발 위력 배율(attack→atk×power, heal→heal×power), manaGain=행동 시 자기 마나+,
// cost=발동 마나소비, cd=쿨다운(틱), effects=부여 effect 스펙.
// hits=멀티히트 횟수(1행동 N회 타격), ignoreDef=방어무시 비율(1=전부), manaDrain=명중 시 적 마나 차감.
// effect 스펙 = { target:'self'|'enemy'|'lowestHpAlly'|'allies', type, value|valueRatio, duration, interval? }
//   배율형(dmgTaken/dmgDealt/speed) = value 그대로. hot/dot/mark = valueRatio(시전자 스케일) + interval?. reflect/extraHit = value×레벨배율.
// 가변 상태(마나/쿨/effect 인스턴스)는 유닛에 보관 → SKILLS는 공유 def, clone 불필요.
export const MANA_MAX = 100
export const MANA_GAIN = 25

export const SKILLS = {
  melee_strike:    { id: 'melee_strike',    name: '기본 공격', kind: 'attack', range: 'melee',  power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0,   effects: [] },
  ranged_strike:   { id: 'ranged_strike',   name: '기본 공격', kind: 'attack', range: 'ranged', power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0,   effects: [] },
  basic_heal:      { id: 'basic_heal',      name: '기본 공격', kind: 'heal',   range: null,     power: 1.0, manaGain: MANA_GAIN, cost: 0,  cd: 0,   effects: [] },

  // === 전사 (근접 기준선 + 가디언 흡수) ===
  warrior_cleave:  { id: 'warrior_cleave',  name: '갑옷부수기', kind: 'attack', range: 'melee', power: 1.7, manaGain: 0, cost: 50, cd: 450,
    effects: [{ target: 'enemy', type: 'dmgTaken', value: 1.15, duration: 300 }] },  // 시그니처(받는뎀↑·팀증폭). 딜 동반이라 지속 짧음(사제 버프보다 짧게)
  warrior_heavy:   { id: 'warrior_heavy',   name: '강타',     kind: 'attack', range: 'melee',  power: 2.8, manaGain: 0, cost: 60, cd: 600, learnCost: 6, effects: [] },
  warrior_crush:   { id: 'warrior_crush',   name: '분쇄',     kind: 'attack', range: 'melee',  power: 1.5, manaGain: 0, cost: 50, cd: 700, learnCost: 6,
    effects: [{ target: 'enemy', type: 'stun', value: 1, duration: 150 }] },  // 딜 + 적 게이지 정지
  warrior_thorns:  { id: 'warrior_thorns',  name: '가시방패', kind: 'attack', range: 'melee',  power: 0,   manaGain: 0, cost: 45, cd: 600, learnCost: 6,
    effects: [{ target: 'self', type: 'reflect', value: 0.3, duration: 500 }] },  // 받은뎀 30% 반사(전사 흡수, 구 가디언 가시방패). 방벽(자기 받는뎀↓)을 대체
  warrior_might:   { id: 'warrior_might',   name: '강화',     kind: 'attack', range: 'melee',  power: 0,   manaGain: 0, cost: 40, cd: 700, learnCost: 6,
    effects: [{ target: 'self', type: 'dmgDealt', value: 1.3, duration: 500 }, { target: 'self', type: 'speed', value: 1.3, duration: 500 }] },  // 미배선(키트 외)

  // === 마법사 (버스트 유리대포: 약평타·큰스킬·안티아머) ===
  mage_nuke:       { id: 'mage_nuke',       name: '파이어볼', kind: 'attack', range: 'ranged', power: 10.0, manaGain: 0, cost: 45, cd: 350, effects: [] },  // 한방 시그니처(평타 약화분을 스킬 폭딜로). 유리대포 핵심
  mage_focus:      { id: 'mage_focus',      name: '마력집중', kind: 'attack', range: 'ranged', power: 0,   manaGain: 0, cost: 30, cd: 700, learnCost: 6,
    effects: [{ target: 'self', type: 'dmgDealt', value: 1.4, duration: 500 }] },  // 자기 주는뎀↑(파이어볼 증폭)
  mage_lightning:  { id: 'mage_lightning',  name: '라이트닝', kind: 'attack', range: 'ranged', power: 1.3, hits: 3, manaGain: 0, cost: 40, cd: 450, learnCost: 6,
    effects: [{ target: 'enemy', type: 'mark', valueRatio: 0.6, duration: 500 }] },  // 다단히트(3) + 표식 디버프(피격당 +floor(시전자atk×0.6))
  mage_pierce:     { id: 'mage_pierce',     name: '관통',     kind: 'attack', range: 'ranged', power: 4.0, ignoreDef: 1, manaGain: 0, cost: 45, cd: 450, learnCost: 6, effects: [] },  // 방어무시(고방 적 안티아머 — 구 궁수서 이관). 도적엔 없음 → 후반 고방서 법사>도적

  // === 사제 (평타 강·미미한 버프 상시유지·힐) ===
  holy_bolt:       { id: 'holy_bolt',       name: '기본 공격', kind: 'attack', range: 'ranged', power: 1.0, manaGain: MANA_GAIN, cost: 0, cd: 0, effects: [] },  // 사제 평타(원거리딜+마나젠). atk 높아 전사 평타 바로 아래
  priest_heal:     { id: 'priest_heal',     name: '치유',     kind: 'heal',   range: null,     power: 2.0, manaGain: 0, cost: 50, cd: 400, learnCost: 6, effects: [] },
  priest_hot:      { id: 'priest_hot',      name: '재생',     kind: 'heal',   range: null,     power: 0,   manaGain: 0, cost: 50, cd: 500,
    effects: [{ target: 'lowestHpAlly', type: 'hot', valueRatio: 0.5, interval: 100, duration: 500 }] },  // 미배선(키트 외)
  priest_party_heal: { id: 'priest_party_heal', name: '파티힐',   kind: 'heal', range: null, power: 0, manaGain: 0, cost: 60, cd: 600, learnCost: 6,
    effects: [{ target: 'allies', type: 'hot', valueRatio: 0.4, interval: 100, duration: 400 }] },
  priest_party_buff: { id: 'priest_party_buff', name: '블레싱', kind: 'heal', range: null, power: 0, manaGain: 0, cost: 50, cd: 1000, learnCost: 6,
    effects: [{ target: 'allies', type: 'dmgDealt', value: 1.15, duration: 800 }] },  // 시그니처: 파티 주는뎀+15%(미미·상시유지, 지속·쿨 넉넉→사제 평타 칠 틈)
  priest_agi:        { id: 'priest_agi',        name: '민첩성증가', kind: 'heal', range: null, power: 0, manaGain: 0, cost: 45, cd: 1000, learnCost: 6,
    effects: [{ target: 'allies', type: 'speed', value: 1.10, duration: 800 }] },  // 시그니처: 파티 속도+10%(속도=고레버리지라 주는뎀버프보다 더 약하게)

  // === 도적 (순수 속도·연타) ===
  rogue_double:    { id: 'rogue_double',    name: '더블어택', kind: 'attack', range: 'melee',  power: 0, manaGain: 0, cost: 30, cd: 400, learnCost: 6,
    effects: [{ target: 'self', type: 'extraHit', value: 0.5, duration: 400 }] },  // 버프: 지속동안 평타에 추가타 1회(atk×비율). 레벨↑=비율↑(L5=1.0=진짜 더블)
  rogue_haste:     { id: 'rogue_haste',     name: '질풍격',   kind: 'attack', range: 'melee',  power: 1.3, manaGain: 0, cost: 35, cd: 600, learnCost: 6,
    effects: [{ target: 'self', type: 'speed', value: 1.2, duration: 400 }] },  // 공격(딜) + 자기 속도 보너스 라이더(순수 버프 아님 → 셋업턴 안 버림)
  rogue_flurry:    { id: 'rogue_flurry',    name: '난무',     kind: 'attack', range: 'melee',  power: 0.6, hits: 4, manaGain: 0, cost: 45, cd: 500, learnCost: 6, effects: [] },  // 멀티히트(4) 주력
  rogue_manacut:   { id: 'rogue_manacut',   name: '마나절단', kind: 'attack', range: 'melee',  power: 1.2, manaGain: 0, cost: 35, cd: 450, learnCost: 6, manaDrain: 30, effects: [] },  // 딜 + 적 마나 차감(현재 몹 마나 미사용→휴면, 향후 몬스터 스킬용)

  // === 궁수 (보조 디버퍼: 속도↓+주는뎀↓·독) ===
  archer_aim:      { id: 'archer_aim',      name: '조준사격', kind: 'attack', range: 'ranged', power: 2.5, manaGain: 0, cost: 55, cd: 600, learnCost: 6, effects: [] },  // 고단일딜
  archer_rapid:    { id: 'archer_rapid',    name: '연사',     kind: 'attack', range: 'ranged', power: 0.6, hits: 3, manaGain: 0, cost: 40, cd: 450, learnCost: 6, effects: [] },  // 3회 타격
  archer_poison:   { id: 'archer_poison',   name: '독화살',   kind: 'attack', range: 'ranged', power: 1.0, manaGain: 0, cost: 35, cd: 400, learnCost: 6,
    effects: [{ target: 'enemy', type: 'dot', valueRatio: 0.3, interval: 100, duration: 500 }] },  // 딜 + 지속 독(시전자 atk 비례). 구 도적 출혈 대체
  archer_bind:     { id: 'archer_bind',     name: '속박사격', kind: 'attack', range: 'ranged', power: 1.2, manaGain: 0, cost: 40, cd: 500, learnCost: 6,
    effects: [{ target: 'enemy', type: 'speed', value: 0.8, duration: 400 }, { target: 'enemy', type: 'dmgDealt', value: 0.8, duration: 400 }] },  // 속도-20% + 주는뎀-20% 시너지 디버프(속도=고자산이라 -20%까지만)
}
