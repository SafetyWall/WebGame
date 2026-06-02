// 직업: 메타(name/spd/role/mana/skills) top-level + 레벨별 스탯 테이블 levels{1..10}.
// 스케일 = hp·atk·[heal](위력), spd·mana는 레벨 불변(정체성, 마나는 전직으로만). level 1 = 베이스. 수치 placeholder.
// 손번호 테이블(공식화는 비용상 보류) — L6~10 ≈ ×1.2/레벨 연장. skills = 우선순위 배열(발동 먼저, 평타 마지막 fallback).
export const JOBS = {
  novice:   { name: '노비스', spd: 7, role: 'dps', mana: 100, skills: ['melee_strike'],
    levels: { 1: { hp: 70, atk: 14 }, 2: { hp: 84, atk: 17 }, 3: { hp: 100, atk: 20 }, 4: { hp: 120, atk: 24 }, 5: { hp: 144, atk: 29 },
              6: { hp: 173, atk: 35 }, 7: { hp: 207, atk: 42 }, 8: { hp: 249, atk: 50 }, 9: { hp: 299, atk: 60 }, 10: { hp: 358, atk: 72 } } },
  warrior:  { name: '전사', spd: 9, role: 'dps', mana: 100, skills: ['warrior_cleave', 'warrior_heavy', 'warrior_might', 'melee_strike'],
    levels: { 1: { hp: 115, atk: 22 }, 2: { hp: 138, atk: 26 }, 3: { hp: 166, atk: 31 }, 4: { hp: 199, atk: 37 }, 5: { hp: 239, atk: 44 },
              6: { hp: 287, atk: 53 }, 7: { hp: 344, atk: 63 }, 8: { hp: 413, atk: 76 }, 9: { hp: 496, atk: 91 }, 10: { hp: 595, atk: 110 } } },
  mage:     { name: '마법사', spd: 8, role: 'dps', mana: 120, skills: ['mage_nuke', 'mage_focus', 'mage_frost', 'ranged_strike'],
    levels: { 1: { hp: 55, atk: 32 }, 2: { hp: 66, atk: 38 }, 3: { hp: 79, atk: 46 }, 4: { hp: 95, atk: 55 }, 5: { hp: 114, atk: 66 },
              6: { hp: 137, atk: 79 }, 7: { hp: 164, atk: 95 }, 8: { hp: 197, atk: 114 }, 9: { hp: 236, atk: 137 }, 10: { hp: 284, atk: 164 } } },
  guardian: { name: '가디언', spd: 5, role: 'tank', mana: 100, skills: ['guardian_taunt', 'guardian_sunder', 'guardian_barrier', 'guardian_strike'],
    levels: { 1: { hp: 260, atk: 10 }, 2: { hp: 312, atk: 12 }, 3: { hp: 374, atk: 14 }, 4: { hp: 449, atk: 17 }, 5: { hp: 539, atk: 20 },
              6: { hp: 647, atk: 24 }, 7: { hp: 776, atk: 29 }, 8: { hp: 931, atk: 35 }, 9: { hp: 1118, atk: 42 }, 10: { hp: 1341, atk: 50 } } },
  priest:   { name: '사제', spd: 7, role: 'heal', mana: 120, skills: ['priest_heal', 'priest_hot', 'holy_bolt'],
    levels: { 1: { hp: 95, atk: 6, heal: 30 }, 2: { hp: 114, atk: 7, heal: 36 }, 3: { hp: 137, atk: 8, heal: 43 }, 4: { hp: 164, atk: 10, heal: 52 }, 5: { hp: 197, atk: 12, heal: 62 },
              6: { hp: 236, atk: 14, heal: 74 }, 7: { hp: 284, atk: 17, heal: 89 }, 8: { hp: 340, atk: 21, heal: 107 }, 9: { hp: 409, atk: 25, heal: 129 }, 10: { hp: 490, atk: 30, heal: 154 } } },
}
