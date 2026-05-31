// 몹 풀 = 계수(mul)만. 조우 생성기가 스테이지 슬롯 레어도에 맞춰 트레잇 랜덤 부착.
// 일반(MONSTERS) = 고정 특성 없음. 보스(BOSSES) = 고정 특성(aoe|fixed) + 추가 트레잇(bonus). 수치 placeholder.
export const MONSTERS = {
  slime:  { name: '슬라임',   mul: { hp: 1.1, atk: 1.0, def: 0.6, spd: 1.3 } },
  turtle: { name: '가시거북', mul: { hp: 1.5, atk: 1.1, def: 2.5, spd: 0.9 } },
}

// 보스 = 특별 몹. 고정 능력(aoe 플래그 또는 fixed=항상 부착되는 트레잇 id) + bonus(스테이지 슬롯 외 추가 트레잇 레어도).
// 스테이지 배치(STAGES.boss)는 아직 미정 — 정의만 둠. generateEncounter(stage, rng, monId)로 호출 가능.
export const BOSSES = {
  ogre:   { name: '오우거', boss: true, mul: { hp: 2.0, atk: 1.6, def: 1.2, spd: 0.9 }, aoe: true, bonus: ['희귀'] },
}
