// 런 영속(localStorage). 엔진 순수 유지 — UI 레이어만. storage 주입가능(테스트 shim).
const KEY = 'partyrpg.save.v1'   // 버전키: 스키마 변경 시 v 숫자 bump

export function save(state, rngState, storage = localStorage) {
  storage.setItem(KEY, JSON.stringify({ v: 1, state, rng: rngState }))
}

export function load(storage = localStorage) {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (o.v !== 1) return null            // 구버전 저장 → 폐기, 새 런
    return { state: o.state, rng: o.rng }
  } catch {
    return null                           // 손상 JSON → 폐기
  }
}

export function clear(storage = localStorage) {
  storage.removeItem(KEY)
}
