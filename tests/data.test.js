import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'

test('JOBS has 6 jobs with required fields (per-level stats)', () => {
  const keys = Object.keys(JOBS)
  assert.strictEqual(keys.length, 6)   // novice + 5 전직(전사/마법사/사제/도적/궁수). 가디언 제거(2차전직용 보류)
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
  assert.ok(!JOBS.guardian)   // 가디언 클래스 제거
  assert.strictEqual(JOBS.priest.role, 'heal')
})

test('each job references at least one valid skill id', () => {
  for (const k of Object.keys(JOBS)) {
    const j = JOBS[k]
    assert.ok(Array.isArray(j.skills) && j.skills.length >= 1, `${k} skills`)
    for (const id of j.skills) assert.ok(SKILLS[id], `${k} skill ${id} exists`)
  }
  assert.deepStrictEqual(JOBS.mage.skills, ['mage_nuke', 'mage_focus', 'mage_lightning', 'mage_pierce', 'ranged_strike'])  // 빙결→관통(방어무시 이관)
  assert.deepStrictEqual(JOBS.priest.skills, ['priest_heal', 'priest_agi', 'priest_party_buff', 'priest_party_heal', 'holy_bolt'])
})

test('JOBS: skills 배열 = 우선순위(발동 먼저, 평타 마지막)', () => {
  assert.deepStrictEqual(JOBS.novice.skills, ['melee_strike'])             // 노비스=평타만
  assert.deepStrictEqual(JOBS.warrior.skills, ['warrior_cleave', 'warrior_heavy', 'warrior_crush', 'warrior_thorns', 'melee_strike'])  // 방벽→가시방패(가디언 흡수)
  assert.deepStrictEqual(JOBS.rogue.skills, ['rogue_double', 'rogue_haste', 'rogue_flurry', 'rogue_manacut', 'melee_strike'])  // 순수 속도+연타
  assert.deepStrictEqual(JOBS.archer.skills, ['archer_aim', 'archer_rapid', 'archer_poison', 'archer_bind', 'ranged_strike'])  // 보조 디버퍼(독+속박)
})
