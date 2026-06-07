// 틱 → 초 표기(단일 출처). 100틱=1초(engine TICKS_PER_SEC). 정수면 "5초", 소수면 "3.5초"(1자리).
import { TICKS_PER_SEC } from '../engine/battle.js'

export function fmtSec(ticks) {
  const s = ticks / TICKS_PER_SEC
  return (Number.isInteger(s) ? String(s) : s.toFixed(1)) + '초'
}
