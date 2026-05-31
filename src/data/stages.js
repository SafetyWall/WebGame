// 스테이지별 몹 레벨 + 특성 슬롯(개수=배열 길이, 각 슬롯 레어도). 수치 placeholder.
// 제약: 한 레어도 슬롯 수 ≤ 그 레어도 트레잇 수(일반2·희귀2·영웅1) — 초과 시 그 슬롯 스킵.
export const STAGES = {
  1: { level: 1, traitSlots: [] },
  2: { level: 2, traitSlots: ['일반'] },
  3: { level: 3, traitSlots: ['일반'] },
  4: { level: 4, traitSlots: ['일반', '희귀'] },
  5: { level: 5, traitSlots: ['희귀', '영웅'] },
}
