// 절차생성 스테이지 곡선. 수기 테이블 제거 → stageCfg(s)가 임의 s 생성(20→50~100 = MAX_STAGE만 변경).
// 수치 placeholder(econ-sim 튜닝 대상). 중후반 승률은 2차전직 등 플레이어 파워원 도입 전까지 미보장.
// 제약: 한 레어도 동시 슬롯 수 ≤ 그 레어도 트레잇 풀 크기(일반3·희귀2·영웅2·전설1) — 초과 시 조우생성이 그 슬롯 스킵.

export const MAX_STAGE = 20

// 레어도 등장 계획: unlock=첫 등장 스테이지, every=+1마다 스테이지 간격, max=동시 슬롯 상한(풀 크기 이하).
const RARITY_PLAN = [
  { r: '일반', unlock: 3,  every: 5,  max: 3 },
  { r: '희귀', unlock: 9,  every: 6,  max: 2 },
  { r: '영웅', unlock: 15, every: 99, max: 1 },
  { r: '전설', unlock: 19, every: 99, max: 1 },
]

// 슬롯 = 레어도 순(일반→…→전설)으로 등장. 온보딩(S1~2)=빈 배열.
function traitSlots(s) {
  const slots = []
  for (const p of RARITY_PLAN) {
    if (s < p.unlock) continue
    const n = Math.min(p.max, 1 + Math.floor((s - p.unlock) / p.every))
    for (let i = 0; i < n; i++) slots.push(p.r)
  }
  return slots
}

// 스테이지 설정 = 몹 레벨(=s, placeholder) + 트레잇 슬롯.
export function stageCfg(s) {
  return { level: s, traitSlots: traitSlots(s) }
}

// 소비처(encounter/sim/run) 호환용 1..MAX_STAGE 생성 객체.
export const STAGES = Object.fromEntries(
  Array.from({ length: MAX_STAGE }, (_, i) => [i + 1, stageCfg(i + 1)])
)
