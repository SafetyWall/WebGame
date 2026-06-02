import { test } from 'node:test'
import assert from 'node:assert'
import { SKILLS, MANA_MAX, MANA_GAIN } from '../src/data/skills.js'
import { JOBS } from '../src/data/jobs.js'
import { makeUnit } from '../src/engine/unit.js'

test('SKILLS entries have id(=key)/name/kind and valid range', () => {
  for (const [key, s] of Object.entries(SKILLS)) {
    assert.strictEqual(s.id, key, `${key} id matches key`)
    assert.ok(s.name, `${key} name`)
    assert.ok(['attack', 'heal'].includes(s.kind), `${key} kind`)
    assert.ok(['melee', 'ranged', null].includes(s.range), `${key} range`)
  }
})

test('attack skills carry a melee/ranged tag; heal skill has null range', () => {
  assert.strictEqual(SKILLS.melee_strike.range, 'melee')
  assert.strictEqual(SKILLS.ranged_strike.range, 'ranged')
  assert.strictEqual(SKILLS.basic_heal.kind, 'heal')
  assert.strictEqual(SKILLS.basic_heal.range, null)
})

test('makeUnit resolves job.skills ids into shared SKILLS defs', () => {
  const mage = makeUnit(JOBS.mage)
  // 우선순위 배열: [0]=발동(파이어볼), 마지막=평타(원거리). 둘 다 공유 def 참조(clone 아님).
  assert.strictEqual(mage.skills[0], SKILLS.mage_nuke)
  assert.strictEqual(mage.skills[mage.skills.length - 1], SKILLS.ranged_strike)
  assert.strictEqual(makeUnit(JOBS.priest).skills[0], SKILLS.priest_heal)  // 사제 기본=치유
})

test('makeUnit no longer carries phys/magic type', () => {
  assert.strictEqual(makeUnit(JOBS.warrior).type, undefined)
})

test('SKILLS: 평타에 power/manaGain/cost/cd/effects 필드', () => {
  const s = SKILLS.melee_strike
  assert.strictEqual(s.power, 1.0)
  assert.ok(s.manaGain > 0)
  assert.strictEqual(s.cost, 0)
  assert.strictEqual(s.cd, 0)
  assert.deepStrictEqual(s.effects, [])
})

test('SKILLS: 발동스킬 5종 정의 + 자원/효과', () => {
  for (const id of ['mage_nuke', 'warrior_cleave', 'priest_hot', 'guardian_taunt', 'guardian_strike']) {
    assert.ok(SKILLS[id], `${id} 존재`)
    assert.strictEqual(SKILLS[id].id, id)
  }
  assert.ok(SKILLS.mage_nuke.power > 1.5)
  assert.strictEqual(SKILLS.warrior_cleave.effects[0].type, 'dmgTaken')
  assert.ok(SKILLS.warrior_cleave.effects[0].value > 1)         // 받는뎀 증가(증뎀)
  assert.strictEqual(SKILLS.priest_hot.power, 0)                // 즉발 없음
  assert.strictEqual(SKILLS.priest_hot.effects[0].type, 'hot')
  assert.ok(SKILLS.priest_hot.effects[0].valueRatio > 0)
  assert.strictEqual(SKILLS.priest_hot.effects[0].interval, 100)
  assert.ok(SKILLS.guardian_taunt.effects.some(e => e.type === 'taunt'))
  assert.ok(SKILLS.guardian_taunt.effects.some(e => e.type === 'dmgTaken' && e.value < 1))
  assert.deepStrictEqual(SKILLS.guardian_strike.effects, [])               // 평타화(주는뎀↓ 제거)
  assert.strictEqual(SKILLS.guardian_sunder.effects[0].type, 'dmgDealt')   // 무기파괴 = 적 주는뎀↓
  assert.ok(SKILLS.guardian_sunder.effects[0].value < 1)
})

test('SKILLS: P1 신규 액티브 정의 + learnCost', () => {
  for (const id of ['warrior_heavy', 'mage_focus', 'guardian_sunder', 'guardian_barrier', 'priest_heal', 'holy_bolt']) {
    assert.ok(SKILLS[id], `${id} 존재`)
    assert.strictEqual(SKILLS[id].id, id)
  }
  assert.ok(SKILLS.warrior_heavy.power > 2)                       // 고위력 burst
  assert.strictEqual(SKILLS.mage_focus.effects[0].type, 'dmgDealt')
  assert.ok(SKILLS.mage_focus.effects[0].value > 1)              // 자뎀 버프
  assert.ok(SKILLS.guardian_barrier.effects[0].value < 1)        // 받는뎀 감소
  assert.strictEqual(SKILLS.priest_heal.kind, 'heal')
  assert.strictEqual(SKILLS.holy_bolt.kind, 'attack')            // 사제 평타=원거리딜
  assert.strictEqual(SKILLS.holy_bolt.range, 'ranged')
  assert.ok(SKILLS.holy_bolt.manaGain > 0)
})

test('SKILLS: MANA 상수 export', () => {
  assert.ok(MANA_MAX > 0)
  assert.ok(MANA_GAIN > 0)
})
