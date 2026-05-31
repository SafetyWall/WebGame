// 런 영속(localStorage). 엔진 순수 유지 — UI 레이어만. storage 주입가능(테스트 shim).
const KEY = 'partyrpg.save.v2'   // 버전키: 스키마 변경 시 v 숫자 bump (v2 = 전직=레벨업 + roster.skillOrder)
const VERSION = 2

export function save(state, rngState, storage = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify({ v: VERSION, state, rng: rngState }))
  } catch {
    // 쿼터초과·프라이빗모드(setItem throw) → 영속은 best-effort, 인메모리 런은 계속
  }
}

export function load(storage = localStorage) {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (o.v !== VERSION) return null      // 구버전 저장 → 폐기, 새 런
    return { state: o.state, rng: o.rng }
  } catch {
    return null                           // 손상 JSON → 폐기
  }
}

export function clear(storage = localStorage) {
  storage.removeItem(KEY)
}
