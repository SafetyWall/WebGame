// 직업: 메타(name/spd/role/mana/skills) top-level + 레벨별 스탯 테이블 levels{1..10}.
// 스케일 = hp·atk·[heal](위력), spd·mana·[def]는 레벨 불변(정체성, 마나는 전직으로만). level 1 = 베이스. 수치 placeholder.
// def = 직업 메타 상수(탱 레버, 미지정=0=딜러). 데미지 % 경감식 atk×K/(def+K)라 레벨 성장 불필요(battle.DEF_K).
// 손번호 테이블(공식화는 비용상 보류) — L6~10 ≈ ×1.2/레벨 연장. skills = 우선순위 배열(발동 먼저, 평타 마지막 fallback).
export const JOBS = {
  novice:   { name: '노비스', spd: 100, role: 'dps', mana: 100, skills: ['melee_strike'],
    levels: { 1: { hp: 70, atk: 14 }, 2: { hp: 84, atk: 17 }, 3: { hp: 100, atk: 20 }, 4: { hp: 120, atk: 24 }, 5: { hp: 144, atk: 29 },
              6: { hp: 173, atk: 35 }, 7: { hp: 207, atk: 42 }, 8: { hp: 249, atk: 50 }, 9: { hp: 299, atk: 60 }, 10: { hp: 358, atk: 72 } } },
  warrior:  { name: '전사', spd: 120, role: 'dps', mana: 100, def: 40, skills: ['warrior_cleave', 'warrior_heavy', 'warrior_crush', 'warrior_thorns', 'melee_strike'],
    levels: { 1: { hp: 115, atk: 22 }, 2: { hp: 138, atk: 26 }, 3: { hp: 166, atk: 31 }, 4: { hp: 199, atk: 37 }, 5: { hp: 239, atk: 44 },
              6: { hp: 287, atk: 53 }, 7: { hp: 344, atk: 63 }, 8: { hp: 413, atk: 76 }, 9: { hp: 496, atk: 91 }, 10: { hp: 595, atk: 110 } } },
  mage:     { name: '마법사', spd: 90, role: 'dps', mana: 120, skills: ['mage_nuke', 'mage_focus', 'mage_lightning', 'mage_pierce', 'ranged_strike'],
    levels: { 1: { hp: 55, atk: 16 }, 2: { hp: 66, atk: 19 }, 3: { hp: 79, atk: 23 }, 4: { hp: 95, atk: 28 }, 5: { hp: 114, atk: 33 },
              6: { hp: 137, atk: 40 }, 7: { hp: 164, atk: 48 }, 8: { hp: 197, atk: 57 }, 9: { hp: 236, atk: 69 }, 10: { hp: 284, atk: 82 } } },  // 평타 약화(atk 반토막) — 폭딜은 파이어볼 등 스킬로
  priest:   { name: '사제', spd: 100, role: 'heal', mana: 120, skills: ['priest_heal', 'priest_agi', 'priest_party_buff', 'priest_party_heal', 'holy_bolt'],
    levels: { 1: { hp: 95, atk: 25, heal: 30 }, 2: { hp: 114, atk: 30, heal: 36 }, 3: { hp: 137, atk: 36, heal: 43 }, 4: { hp: 164, atk: 43, heal: 52 }, 5: { hp: 197, atk: 52, heal: 62 },
              6: { hp: 236, atk: 62, heal: 74 }, 7: { hp: 284, atk: 75, heal: 89 }, 8: { hp: 340, atk: 90, heal: 107 }, 9: { hp: 409, atk: 108, heal: 129 }, 10: { hp: 490, atk: 128, heal: 154 } } },  // atk 상향: 평타 DPS 전사 바로 아래(라그 메이스 사제). 실전 DPS는 버프/힐 캐스팅으로 깎임
  rogue:    { name: '도적', spd: 130, role: 'dps', mana: 100, skills: ['rogue_double', 'rogue_haste', 'rogue_flurry', 'rogue_manacut', 'melee_strike'],
    levels: { 1: { hp: 90, atk: 26 }, 2: { hp: 108, atk: 31 }, 3: { hp: 130, atk: 37 }, 4: { hp: 156, atk: 45 }, 5: { hp: 187, atk: 54 },
              6: { hp: 224, atk: 65 }, 7: { hp: 269, atk: 78 }, 8: { hp: 322, atk: 93 }, 9: { hp: 387, atk: 112 }, 10: { hp: 464, atk: 134 } } },  // spd 150→130(최고 유지). 순수 속도+연타(출혈·방어무시 제거)
  archer:   { name: '궁수', spd: 120, role: 'dps', mana: 100, skills: ['archer_aim', 'archer_rapid', 'archer_poison', 'archer_bind', 'ranged_strike'],
    levels: { 1: { hp: 75, atk: 28 }, 2: { hp: 90, atk: 34 }, 3: { hp: 108, atk: 40 }, 4: { hp: 130, atk: 48 }, 5: { hp: 156, atk: 58 },
              6: { hp: 187, atk: 70 }, 7: { hp: 224, atk: 84 }, 8: { hp: 269, atk: 100 }, 9: { hp: 322, atk: 120 }, 10: { hp: 387, atk: 145 } } },  // 보조 디버퍼(속박+독). 관통→법사 이관
}
