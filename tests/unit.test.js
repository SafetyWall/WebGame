import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SLIME } from './_fixtures.js'
import { makeUnit, makeMob, unitSkillIds } from '../src/engine/unit.js'

test('makeUnit copies job stats into runtime unit', () => {
  const u = makeUnit(JOBS.warrior)
  assert.strictEqual(u.name, '전사')
  assert.strictEqual(u.hp, 115)
  assert.strictEqual(u.maxHp, 115)
  assert.strictEqual(u.gauge, 0)
  assert.strictEqual(u.def, 40)        // 전사 def = 직업 메타 상수(탱 레버)
})

test('makeUnit no longer carries a static taunt field (도발=스킬)', () => {
  assert.strictEqual(makeUnit(JOBS.guardian).taunt, undefined)
  assert.strictEqual(makeUnit(JOBS.priest).heal, 30)
})

test('makeUnit: 전투 가변상태 mana/cooldowns/effects 초기화', () => {
  const u = makeUnit(JOBS.mage, 1)
  assert.strictEqual(u.mana, 0)
  assert.deepStrictEqual(u.cooldowns, {})
  assert.deepStrictEqual(u.effects, [])
})

test('unitSkillIds = 학습 액티브 + 평타(마지막); 미지정=전체(하위호환)', () => {
  // 평타 = job.skills 마지막. 전사: cleave + melee_strike(평타).
  assert.deepStrictEqual(unitSkillIds(JOBS.warrior, ['warrior_cleave']), ['warrior_cleave', 'melee_strike'])
  assert.deepStrictEqual(unitSkillIds(JOBS.warrior, []), ['melee_strike'])            // 평타만(미학습)
  assert.deepStrictEqual(unitSkillIds(JOBS.warrior, undefined), ['warrior_cleave', 'warrior_heavy', 'warrior_might', 'warrior_crush', 'melee_strike']) // 전체
  assert.deepStrictEqual(unitSkillIds(JOBS.novice, []), ['melee_strike'])             // 노비스=평타뿐
})

test('makeUnit: 미학습 액티브는 전투 스킬에서 제외(평타만)', () => {
  const u = makeUnit(JOBS.warrior, 1, null, {}, [])   // learnedSkills=[] → 평타만
  assert.deepStrictEqual(u.skills.map(s => s.id), ['melee_strike'])
})

test('makeUnit: manaMax = 직업별(기본100, 마법사·사제 120)', () => {
  assert.strictEqual(makeUnit(JOBS.warrior).manaMax, 100)
  assert.strictEqual(makeUnit(JOBS.guardian).manaMax, 100)
  assert.strictEqual(makeUnit(JOBS.mage).manaMax, 120)
  assert.strictEqual(makeUnit(JOBS.priest).manaMax, 120)
})

test('makeUnit: skills resolve(우선순위 보존)', () => {
  const u = makeUnit(JOBS.warrior, 1)   // learnedSkills 미지정=전체
  assert.deepStrictEqual(u.skills.map(s => s.id), ['warrior_cleave', 'warrior_heavy', 'warrior_might', 'warrior_crush', 'melee_strike'])
})

test('makeUnit: skillOrder 재배열 반영(액티브만, 평타는 항상 끝)', () => {
  const u = makeUnit(JOBS.warrior, 1, ['warrior_might', 'warrior_cleave'])
  assert.deepStrictEqual(u.skills.map(s => s.id), ['warrior_might', 'warrior_cleave', 'warrior_heavy', 'warrior_crush', 'melee_strike'])  // 누락 액티브 뒤 + 평타 끝
})

test('makeUnit: 평타(기본 공격)는 우선순위 끝 고정 — 위로 못 올림', () => {
  const u = makeUnit(JOBS.warrior, 1, ['melee_strike', 'warrior_cleave'])  // 평타를 1순위로 넣어도
  assert.strictEqual(u.skills[u.skills.length - 1].id, 'melee_strike')      // 항상 끝
  assert.strictEqual(u.skills[0].id, 'warrior_cleave')                       // 평타 무시하고 액티브가 앞
})

test('makeUnit: skillOrder 보정 — 무효 id 무시 + 누락 직업스킬 append(평타 끝)', () => {
  const u = makeUnit(JOBS.warrior, 1, ['warrior_might', 'bogus'])
  assert.deepStrictEqual(u.skills.map(s => s.id), ['warrior_might', 'warrior_cleave', 'warrior_heavy', 'warrior_crush', 'melee_strike'])
})

test('makeUnit: skillOrder 없으면 직업 기본 순서', () => {
  const u = makeUnit(JOBS.mage, 1, null)
  assert.deepStrictEqual(u.skills.map(s => s.id), ['mage_nuke', 'mage_focus', 'mage_frost', 'mage_lightning', 'ranged_strike'])
})

test('makeMob: effects 빈 배열', () => {
  const m = makeMob({ name: '몹', hp: 100, atk: 10, spd: 5 })
  assert.deepStrictEqual(m.effects, [])
})

test('makeMob sets runtime hp/gauge and def default', () => {
  const m = makeMob(SLIME)
  assert.strictEqual(m.hp, 200)
  assert.strictEqual(m.maxHp, 200)
  assert.strictEqual(m.gauge, 0)
  assert.strictEqual(m.def, 3)
})

test('makeUnit defaults to level 1 = base stats', () => {
  const u = makeUnit(JOBS.warrior)
  assert.strictEqual(u.level, 1)
  assert.strictEqual(u.hp, 115)
  assert.strictEqual(u.atk, 22)
  assert.strictEqual(u.spd, 120)
})

test('makeUnit at higher level scales hp/atk (spd fixed)', () => {
  const u = makeUnit(JOBS.warrior, 3)
  assert.strictEqual(u.level, 3)
  assert.strictEqual(u.hp, 166)
  assert.strictEqual(u.atk, 31)
  assert.strictEqual(u.spd, 120) // spd 레벨 불변
})

test('priest heal scales with level', () => {
  assert.strictEqual(makeUnit(JOBS.priest, 1).heal, 30)
  assert.strictEqual(makeUnit(JOBS.priest, 3).heal, 43)
})

test('makeUnit throws a clear error for an undefined level', () => {
  assert.throws(() => makeUnit(JOBS.warrior, 99), /no stats for .* level 99/)
})
