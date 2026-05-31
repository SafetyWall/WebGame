import { JOBS } from '../data/jobs.js'
import { makeUnit, makeMob } from '../engine/unit.js'
import { runBattle } from '../engine/battle.js'
import { renderBattle } from './render.js'
import { generateEncounter } from '../engine/encounter.js'
import { makeRng } from '../engine/rng.js'

// 베이스: 고정 파티 1개 vs 절차 생성 몹. (스테이지 진행·선발·경제는 step4.)
const party = [
  makeUnit(JOBS.warrior),
  makeUnit(JOBS.mage),
  makeUnit(JOBS.guardian),
  makeUnit(JOBS.priest),
]
const seed = Math.floor(Math.random() * 1e9) // UI 레이어 — 매 로드 새 조우. 엔진은 시드만 받음.
const rng = makeRng(seed)
const stage = 1 + rng.int(5)                  // 스테이지 1~5 랜덤
const mob = makeMob(generateEncounter(stage, rng))
const result = runBattle(party, mob)
document.getElementById('app').innerHTML = renderBattle(result)
