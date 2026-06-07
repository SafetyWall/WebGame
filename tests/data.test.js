import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'

test('JOBS has 5 jobs with required fields (per-level stats)', () => {
  const keys = Object.keys(JOBS)
  assert.strictEqual(keys.length, 7)   // novice + 6 전직(전사/마법사/가디언/사제/도적/궁수)
  for (const k of keys) {
    const j = JOBS[k]
    assert.ok(j.name, `${k} name`)
    assert.ok(Number.isFinite(j.spd), `${k} spd`)
    assert.ok(['dps', 'tank', 'heal'].includes(j.role), `${k} role`)
    assert.ok(j.levels && j.levels[1], `${k} levels[1]`)
    assert.strictEqual(Object.keys(j.levels).length, 10, `${k} has 10 levels`)
    assert.ok(Number.isFinite(j.levels[1].hp), `${k} levels[1].hp`)
    assert.ok(Number.isFinite(j.levels[1].atk), `${k} levels[1].atk`)
    assert.ok(Number.isFinite(j.levels[10].hp), `${k} levels[10].hp`)
    assert.ok(Number.isFinite(j.mana), `${k} mana`)
  }
  assert.ok(!JOBS.guardian.taunt)   // 상시 taunt 제거(도발=스킬 effect)
  assert.strictEqual(JOBS.priest.role, 'heal')
})

test('each job references at least one valid skill id', () => {
  for (const k of Object.keys(JOBS)) {
    const j = JOBS[k]
    assert.ok(Array.isArray(j.skills) && j.skills.length >= 1, `${k} skills`)
    for (const id of j.skills) assert.ok(SKILLS[id], `${k} skill ${id} exists`)
  }
  assert.deepStrictEqual(JOBS.mage.skills, ['mage_nuke', 'mage_focus', 'mage_frost', 'mage_lightning', 'ranged_strike'])
  assert.deepStrictEqual(JOBS.priest.skills, ['priest_heal', 'priest_hot', 'priest_party_heal', 'priest_party_buff', 'holy_bolt'])
})

test('JOBS: skills 배열 = 우선순위(발동 먼저, 평타 마지막)', () => {
  assert.deepStrictEqual(JOBS.novice.skills, ['melee_strike'])             // 노비스=평타만
  assert.deepStrictEqual(JOBS.warrior.skills, ['warrior_cleave', 'warrior_heavy', 'warrior_crush', 'guardian_barrier', 'melee_strike'])  // 강화→2차전직 보관, 방벽(가디언서) 흡수
  assert.deepStrictEqual(JOBS.guardian.skills, ['guardian_sunder', 'guardian_barrier', 'guardian_thorns', 'guardian_guard', 'guardian_strike'])  // 가디언=2차전직 보관(베이스 전직 제외)
})
