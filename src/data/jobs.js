// 직업: 메타(name/spd/role/skills) top-level + 레벨별 스탯 테이블 levels{1..5}.
// 스케일 = hp·atk·[heal](위력), spd는 레벨 불변(정체성). level 1 = 베이스. 수치 placeholder.
// skills = 우선순위 배열(발동 먼저, 평타 마지막 fallback). 도발=가디언 스킬 effect(상시 taunt 아님).
export const JOBS = {
  novice:   { name: '노비스', spd: 7, role: 'dps', skills: ['melee_strike'],
    levels: { 1: { hp: 70, atk: 14 }, 2: { hp: 84, atk: 17 }, 3: { hp: 100, atk: 20 }, 4: { hp: 120, atk: 24 }, 5: { hp: 144, atk: 29 } } },
  warrior:  { name: '전사', spd: 9, role: 'dps', skills: ['warrior_cleave', 'melee_strike'],
    levels: { 1: { hp: 115, atk: 22 }, 2: { hp: 138, atk: 26 }, 3: { hp: 166, atk: 31 }, 4: { hp: 199, atk: 37 }, 5: { hp: 239, atk: 44 } } },
  mage:     { name: '마법사', spd: 8, role: 'dps', skills: ['mage_nuke', 'ranged_strike'],
    levels: { 1: { hp: 55, atk: 32 }, 2: { hp: 66, atk: 38 }, 3: { hp: 79, atk: 46 }, 4: { hp: 95, atk: 55 }, 5: { hp: 114, atk: 66 } } },
  guardian: { name: '가디언', spd: 5, role: 'tank', skills: ['guardian_taunt', 'guardian_strike'],
    levels: { 1: { hp: 260, atk: 10 }, 2: { hp: 312, atk: 12 }, 3: { hp: 374, atk: 14 }, 4: { hp: 449, atk: 17 }, 5: { hp: 539, atk: 20 } } },
  priest:   { name: '사제', spd: 7, role: 'heal', skills: ['priest_hot', 'basic_heal'],
    levels: { 1: { hp: 95, atk: 6, heal: 30 }, 2: { hp: 114, atk: 7, heal: 36 }, 3: { hp: 137, atk: 8, heal: 43 }, 4: { hp: 164, atk: 10, heal: 52 }, 5: { hp: 197, atk: 12, heal: 62 } } },
}
