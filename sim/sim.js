// 헤드리스 밸런스 측정. 평타는 결정론 → 매치업당 단일 결과(승/패 + 킬틱).
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

const PARTIES = {
  '균형':   ['warrior', 'mage', 'guardian', 'priest'],
  '딜몰빵': ['mage', 'mage', 'warrior'],
  '탱힐':   ['guardian', 'guardian', 'priest'],
}

console.log('=== 베이스 시뮬 (평타, 결정론) ===')
for (const [pname, jobKeys] of Object.entries(PARTIES)) {
  for (const mkey of Object.keys(MOBS)) {
    const party = jobKeys.map(j => makeUnit(JOBS[j]))
    const mob = makeMob(MOBS[mkey])
    const r = runBattle(party, mob)
    const outcome = r.winner === 'party' ? '승' : '패'
    console.log(`${pname.padEnd(7)} vs ${MOBS[mkey].name.padEnd(5)} → ${outcome} (${r.ticks}틱)`)
  }
}
