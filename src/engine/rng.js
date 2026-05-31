// 시드 PRNG (mulberry32). 순수·결정론 — 같은 seed = 같은 수열.
// 조우 구성(랜덤 몹·랜덤 특성)에만 사용. 전투 자체는 RNG 없음.
export function makeRng(seed) {
  let s = seed >>> 0
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    snapshot: () => s,
    int: (n) => Math.floor(next() * n),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        const tmp = a[i]; a[i] = a[j]; a[j] = tmp
      }
      return a
    },
  }
}
