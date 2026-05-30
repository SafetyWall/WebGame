import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'

test('JOBS has 5 jobs with required fields', () => {
  const keys = Object.keys(JOBS)
  assert.strictEqual(keys.length, 5)
  for (const k of keys) {
    const j = JOBS[k]
    assert.ok(j.name, `${k} has name`)
    assert.ok(Number.isFinite(j.hp), `${k} hp`)
    assert.ok(Number.isFinite(j.atk), `${k} atk`)
    assert.ok(Number.isFinite(j.spd), `${k} spd`)
    assert.ok(['dps', 'tank', 'heal'].includes(j.role), `${k} role`)
  }
  assert.strictEqual(JOBS.guardian.taunt, true)
  assert.strictEqual(JOBS.priest.role, 'heal')
})

test('MOBS entries have combat fields', () => {
  for (const k of Object.keys(MOBS)) {
    const m = MOBS[k]
    assert.ok(m.name)
    assert.ok(Number.isFinite(m.hp))
    assert.ok(Number.isFinite(m.atk))
    assert.ok(Number.isFinite(m.def))
    assert.ok(Number.isFinite(m.spd))
  }
})
