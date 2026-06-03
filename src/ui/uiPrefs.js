// UI 프리퍼런스 영속(localStorage). 런 세이브(persist.js)와 분리된 별도 키 → 런 리셋·손상과 무관(취향 유지).
// storage 주입가능(테스트 shim).
const KEY = 'partyrpg.ui.v1'
const DEFAULTS = { layout: '2col' }   // 2col = 밀집(한 화면 더 많이). 토글로 1col 전환.

export function loadPrefs(storage = localStorage) {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function savePrefs(prefs, storage = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // best-effort(쿼터·프라이빗모드) — 인메모리 계속
  }
}
