import { test } from 'node:test'
import assert from 'node:assert'
import { movePartyTo, movePrioTo } from '../src/ui/dragMove.js'
import { newRun } from '../src/engine/run.js'
import { makeRng } from '../src/engine/rng.js'
import { unitSkillIds, normalizeSkillOrder } from '../src/engine/unit.js'
import { JOBS } from '../src/data/jobs.js'

test('movePartyTo: 맨앞을 맨뒤로', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'novice', level: 1 }, { job: 'novice', level: 1 }, { job: 'novice', level: 1 }], party: [0, 1, 2] }
  assert.deepStrictEqual(movePartyTo(s, 0, 2).party, [1, 2, 0])
})

test('movePartyTo: 맨뒤를 맨앞으로', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'novice', level: 1 }, { job: 'novice', level: 1 }, { job: 'novice', level: 1 }], party: [0, 1, 2] }
  assert.deepStrictEqual(movePartyTo(s, 2, 0).party, [2, 0, 1])
})

test('movePartyTo: 경계 밖/미출전 = no-op', () => {
  const s = { ...newRun(makeRng(1)), party: [0, 1] }
  assert.strictEqual(movePartyTo(s, 0, 5), s)
  assert.strictEqual(movePartyTo(s, 9, 0), s)
})

test('movePrioTo: 평타를 맨앞으로', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2 }], party: [0] }
  const ns = movePrioTo(s, 0, 'melee_strike', 0)
  const order = normalizeSkillOrder(unitSkillIds(JOBS.warrior, ns.roster[0].learnedSkills), ns.roster[0].skillOrder)
  assert.strictEqual(order[0], 'melee_strike')
})
