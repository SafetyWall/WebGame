// 위협도 스코어 타겟팅. 유닛 factor(위치/저체력/공격력)의 가중합 → 몹이 최고 threat 생존자 타격.
// 디폴트 weight = 위치 지배(앞열 = Phase1 등가). 몹 트레잇의 targeting 메타가 weight 변조(없으면 디폴트).
// 순수, RNG 0. applyRules(숫자 변환)와 형태가 달라(유닛 점수매김) 별도 모듈.
import { hasTaunt } from './effects.js'

export const DEFAULT_WEIGHTS = { position: 1, lowHp: 0, atk: 0 }
const TAUNT_BONUS = 1000

// 몹 트레잇들의 targeting weight 집계(명시 factor만 덮어씀). 없으면 디폴트.
export function mobWeights(mob) {
  const w = { ...DEFAULT_WEIGHTS }
  for (const t of (mob && mob.traits ? mob.traits : [])) {
    if (t && t.targeting) Object.assign(w, t.targeting)
  }
  return w
}

// idx = alive 배열 내 위치(앞=0). factor 0~1 정규화 후 가중합 + 도발 보너스.
export function threatScore(unit, idx, alive, weights) {
  const n = alive.length
  const position = n <= 1 ? 1 : (n - 1 - idx) / (n - 1)         // 앞=1, 뒤=0
  const maxHp = Math.max(...alive.map(u => u.hp))
  const lowHp = maxHp > 0 ? 1 - unit.hp / maxHp : 0             // hp 낮을수록↑
  const maxAtk = Math.max(...alive.map(u => u.atk))
  const atk = maxAtk > 0 ? unit.atk / maxAtk : 0
  let s = weights.position * position + weights.lowHp * lowHp + weights.atk * atk
  if (hasTaunt(unit)) s += TAUNT_BONUS
  return s
}
