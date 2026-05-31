import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'

test('JOBS has 5 jobs with required fields (per-level stats)', () => {
  const keys = Object.keys(JOBS)
  assert.strictEqual(keys.length, 5)
  for (const k of keys) {
    const j = JOBS[k]
    assert.ok(j.name, `${k} name`)
    assert.ok(Number.isFinite(j.spd), `${k} spd`)
    assert.ok(['dps', 'tank', 'heal'].includes(j.role), `${k} role`)
    assert.ok(j.levels && j.levels[1], `${k} levels[1]`)
    assert.strictEqual(Object.keys(j.levels).length, 5, `${k} has 5 levels`)
    assert.ok(Number.isFinite(j.levels[1].hp), `${k} levels[1].hp`)
    assert.ok(Number.isFinite(j.levels[1].atk), `${k} levels[1].atk`)
  }
  assert.strictEqual(JOBS.guardian.taunt, true)
  assert.strictEqual(JOBS.priest.role, 'heal')
})

test('each job references at least one valid skill id', () => {
  for (const k of Object.keys(JOBS)) {
    const j = JOBS[k]
    assert.ok(Array.isArray(j.skills) && j.skills.length >= 1, `${k} skills`)
    for (const id of j.skills) assert.ok(SKILLS[id], `${k} skill ${id} exists`)
  }
  assert.deepStrictEqual(JOBS.mage.skills, ['ranged_strike'])
  assert.deepStrictEqual(JOBS.priest.skills, ['basic_heal'])
})
