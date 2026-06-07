// 절차생성 스테이지 곡선. stageCfg(s)가 임의 s 생성(50→100 = MAX_STAGE만 변경).
// 수치 placeholder(econ-sim 튜닝 대상). 중후반 승률은 2차전직 등 플레이어 파워원 도입 전까지 미보장.
// 제약: 한 레어도 동시 슬롯 수 ≤ 그 레어도 트레잇 풀 크기(일반3·희귀2·영웅2·전설1) — 초과 시 조우생성이 그 슬롯 스킵.

export const MAX_STAGE = 50

// 트레잇 슬롯 = 10스테이지마다 1개 추가, 추가 순서 = 일반/희귀/일반/영웅/희귀(누적).
//   ~10:[일반] ~20:[일반,희귀] ~30:+일반 ~40:+영웅 ~50:+희귀 → 41~50 = 일반2·희귀2·영웅1. 50+ = 5칸 유지.
const SLOT_SEQ = ['일반', '희귀', '일반', '영웅', '희귀']
function traitSlots(s) {
  return SLOT_SEQ.slice(0, Math.min(SLOT_SEQ.length, Math.ceil(s / 10)))
}

// 스테이지 설정 = 몹 레벨(=s, placeholder) + 트레잇 슬롯.
export function stageCfg(s) {
  return { level: s, traitSlots: traitSlots(s) }
}

// 소비처(encounter/sim/run) 호환용 1..MAX_STAGE 생성 객체.
export const STAGES = Object.fromEntries(
  Array.from({ length: MAX_STAGE }, (_, i) => [i + 1, stageCfg(i + 1)])
)
