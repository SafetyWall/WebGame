import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { newRun, changeJob, PROMOTE_TARGETS } from '../src/engine/run.js'
import { makeRng } from '../src/engine/rng.js'

test('도적·궁수 직업 정의(10레벨·마나·스킬 5개·평타 포함)', () => {
  for (const k of ['rogue', 'archer']) {
    const j = JOBS[k]
    assert.ok(j, `${k} 존재`)
    assert.strictEqual(Object.keys(j.levels).length, 10)
    assert.ok(Number.isFinite(j.mana))
    assert.strictEqual(j.skills.length, 5)              // 액티브4 + 평타
    for (const id of j.skills) assert.ok(SKILLS[id], `${k} ${id}`)
  }
  assert.deepStrictEqual(JOBS.rogue.skills, ['rogue_double', 'rogue_haste', 'rogue_flurry', 'rogue_manacut', 'melee_strike'])
  assert.deepStrictEqual(JOBS.archer.skills, ['archer_aim', 'archer_rapid', 'archer_poison', 'archer_bind', 'ranged_strike'])
})

test('도적·궁수 = 노비스 전직 대상', () => {
  assert.ok(PROMOTE_TARGETS.includes('rogue'))
  assert.ok(PROMOTE_TARGETS.includes('archer'))
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'novice', level: 1 }], party: [0], gold: 10 }
  const r = changeJob(s, 0, 'rogue')
  assert.strictEqual(r.roster[0].job, 'rogue')
  assert.deepStrictEqual(r.roster[0].learnedSkills, ['rogue_double'])   // 기본 학습(키트 첫 액티브)
})

test('궁수 독화살 = 전투에서 dot 부여(메커닉 배선 확인)', () => {
  const u = makeUnit(JOBS.archer, 1, null, {}, ['archer_poison']); u.mana = 100
  const mob = makeMob({ name: 'D', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  runBattle([u], mob, { maxTicks: 300 })   // 궁수 spd120 → 첫 행동 tick84(독화살)
  assert.ok(mob.effects.some(e => e.type === 'dot'), '독화살 dot 부여됨')
})

test('궁수 연사 = 멀티히트(3타) 배선 확인', () => {
  const u = makeUnit(JOBS.archer, 1, null, {}, ['archer_rapid']); u.mana = 100
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  const r = runBattle([u], mob, { maxTicks: 300 })
  const hits = (r.rounds.flatMap(x => x.log).join('\n').match(/→ M \(-/g) || []).length
  assert.ok(hits >= 3, `연사 다중히트 (${hits})`)
})
