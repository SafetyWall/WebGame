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

test('SKILLS: 발동스킬 정의 + 자원/효과', () => {
  for (const id of ['mage_nuke', 'warrior_cleave', 'priest_hot', 'warrior_thorns', 'archer_bind']) {
    assert.ok(SKILLS[id], `${id} 존재`)
    assert.strictEqual(SKILLS[id].id, id)
  }
  assert.ok(SKILLS.mage_nuke.power > 1.5)                        // 파이어볼 고버스트
  assert.strictEqual(SKILLS.warrior_cleave.effects[0].type, 'dmgTaken')
  assert.ok(SKILLS.warrior_cleave.effects[0].value > 1)         // 받는뎀 증가(증뎀)
  assert.ok(SKILLS.warrior_cleave.effects[0].duration < SKILLS.priest_party_buff.effects[0].duration)  // 딜 동반이라 사제 버프보다 지속 짧음
  assert.strictEqual(SKILLS.priest_hot.power, 0)                // 즉발 없음
  assert.strictEqual(SKILLS.priest_hot.effects[0].type, 'hot')
  assert.ok(SKILLS.priest_hot.effects[0].valueRatio > 0)
  assert.strictEqual(SKILLS.priest_hot.effects[0].interval, 100)
  assert.strictEqual(SKILLS.warrior_thorns.effects[0].type, 'reflect')      // 가시방패(가디언 흡수)
  assert.ok(SKILLS.archer_bind.effects.some(e => e.type === 'speed' && e.value < 1))     // 속박 = 속도↓
  assert.ok(SKILLS.archer_bind.effects.some(e => e.type === 'dmgDealt' && e.value < 1))  // + 주는뎀↓ 시너지
})

test('SKILLS: 모든 평타 = "기본 공격"으로 이름 통일', () => {
  for (const id of ['melee_strike', 'ranged_strike', 'basic_heal', 'holy_bolt']) {
    assert.strictEqual(SKILLS[id].name, '기본 공격', `${id} 이름`)
  }
})

test('SKILLS: 신규 액티브 정의 + learnCost', () => {
  for (const id of ['warrior_heavy', 'mage_focus', 'archer_poison', 'mage_pierce', 'priest_heal', 'holy_bolt']) {
    assert.ok(SKILLS[id], `${id} 존재`)
    assert.strictEqual(SKILLS[id].id, id)
  }
  assert.ok(SKILLS.warrior_heavy.power > 2)                       // 고위력 burst
  assert.strictEqual(SKILLS.mage_focus.effects[0].type, 'dmgDealt')
  assert.ok(SKILLS.mage_focus.effects[0].value > 1)              // 자뎀 버프
  assert.strictEqual(SKILLS.archer_poison.effects[0].type, 'dot') // 독화살 = 지속뎀
  assert.strictEqual(SKILLS.mage_pierce.ignoreDef, 1)            // 관통 = 방어무시
  assert.strictEqual(SKILLS.priest_heal.kind, 'heal')
  assert.strictEqual(SKILLS.holy_bolt.kind, 'attack')            // 사제 평타=원거리딜
  assert.strictEqual(SKILLS.holy_bolt.range, 'ranged')
  assert.ok(SKILLS.holy_bolt.manaGain > 0)
})

test('SKILLS: MANA 상수 export', () => {
  assert.ok(MANA_MAX > 0)
  assert.ok(MANA_GAIN > 0)
})
