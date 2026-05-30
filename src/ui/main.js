import { JOBS } from '../data/jobs.js'
import { MOBS } from '../data/mobs.js'
import { makeUnit, makeMob } from '../engine/unit.js'
import { runBattle } from '../engine/battle.js'
import { renderBattle } from './render.js'

// 베이스: 고정 파티 1개 vs 고정 몹. (선발/경제는 후속 단계.)
const party = [
  makeUnit(JOBS.warrior),
  makeUnit(JOBS.mage),
  makeUnit(JOBS.guardian),
  makeUnit(JOBS.priest),
]
const mob = makeMob(MOBS.ogre)
const result = runBattle(party, mob)
document.getElementById('app').innerHTML = renderBattle(result)
