import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

test('maxTicks reached with no death -> mob wins (stalemate)', () => {
  // 가디언(spd5) vs 오우거(spd6): maxTicks 50이면 둘 다 게이지 1000 못 채움 → 아무도 행동 못 함 → 교착.
  const party = [makeUnit(JOBS.guardian)]
  const mob = makeMob(MOBS.ogre)
  const r = runBattle(party, mob, { maxTicks: 50 })
  assert.strictEqual(r.winner, 'mob')
  assert.strictEqual(r.ticks, 50)
})
