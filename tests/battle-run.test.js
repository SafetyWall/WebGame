import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SLIME, OGRE } from './_fixtures.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

test('strong party defeats weak single-target mob', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage), makeUnit(JOBS.archer), makeUnit(JOBS.priest)]
  const mob = makeMob(SLIME)
  const r = runBattle(party, mob)
  assert.strictEqual(r.winner, 'party')
  assert.ok(r.ticks > 0)
  assert.ok(r.rounds.length >= 1)
})

test('result is deterministic (same input -> same output)', () => {
  const build = () => ({
    party: [makeUnit(JOBS.warrior), makeUnit(JOBS.priest)],
    mob: makeMob(SLIME),
  })
  const a = build(); const b = build()
  const r1 = runBattle(a.party, a.mob)
  const r2 = runBattle(b.party, b.mob)
  assert.strictEqual(r1.winner, r2.winner)
  assert.strictEqual(r1.ticks, r2.ticks)
})

test('priest gets healed (heal targeting works in battle)', () => {
  // 사제 단독 + 광역몹: 사제는 몹 못 죽임 → 결국 패. 단 회복 로그가 찍혀야 함.
  const party = [makeUnit(JOBS.priest)]
  const mob = makeMob(OGRE)
  const r = runBattle(party, mob, { maxTicks: 3000 })
  const logs = r.rounds.flatMap(rd => rd.log).join('\n')
  assert.match(logs, /회복/)
})

test('round snapshot shape', () => {
  const party = [makeUnit(JOBS.warrior)]
  const mob = makeMob(SLIME)
  const r = runBattle(party, mob)
  const snap = r.rounds[0]
  assert.ok(Number.isFinite(snap.tick))
  assert.ok(Array.isArray(snap.party))
  assert.ok(snap.mob.name)
  assert.ok(Array.isArray(snap.log))
})
