// 헤드리스 밸런스 측정. 조우는 시드별 랜덤(랜덤 몹+특성) → 매치업당 trial 분포.
// 전투 자체는 결정론(같은 조우=같은 결과). §8 전수×trial 방법론.
import { JOBS } from '../src/data/jobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { generateEncounter } from '../src/engine/encounter.js'
import { makeRng } from '../src/engine/rng.js'
import { STAGES } from '../src/data/stages.js'

const PARTIES = {
  '균형':   ['warrior', 'mage', 'guardian', 'priest'],
  '딜몰빵': ['mage', 'mage', 'warrior'],
  '탱힐':   ['guardian', 'guardian', 'priest'],
  '원거리': ['mage', 'mage', 'mage'],
  '근접':   ['warrior', 'warrior', 'warrior'],
}
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1)
const stageKeys = Object.keys(STAGES).map(Number)

console.log('=== 조우 시뮬 (스테이지×시드 trial, 전투 결정론) ===')
for (const [pname, jobKeys] of Object.entries(PARTIES)) {
  const cells = stageKeys.map((stage) => {
    let wins = 0
    for (const seed of SEEDS) {
      const party = jobKeys.map((j) => makeUnit(JOBS[j]))
      const mob = makeMob(generateEncounter(stage, makeRng(seed)))
      if (runBattle(party, mob).winner === 'party') wins++
    }
    return `S${stage} ${wins}/${SEEDS.length}`
  })
  console.log(`${pname.padEnd(7)} ${cells.join('  ')}`)
}
