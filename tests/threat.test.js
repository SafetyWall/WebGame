import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { TRAITS } from '../src/data/traits.js'
import { makeUnit } from '../src/engine/unit.js'
import { selectMobTarget } from '../src/engine/battle.js'
import { mobWeights, threatScore, DEFAULT_WEIGHTS } from '../src/engine/threat.js'

const taunted = (u) => { u.effects.push({ type: 'taunt', value: 1, source: u.id, expireTick: 9999 }); return u }

test('mobWeights = default(위치 지배) when no targeting trait', () => {
  assert.deepStrictEqual(mobWeights(undefined), DEFAULT_WEIGHTS)
  assert.deepStrictEqual(mobWeights({ traits: [] }), DEFAULT_WEIGHTS)
})

test('threatScore: 도발 보너스가 지배(앞열 아니어도 최고)', () => {
  const party = [makeUnit(JOBS.warrior), taunted(makeUnit(JOBS.mage))]
  const back = threatScore(party[1], 1, party, DEFAULT_WEIGHTS)
  const front = threatScore(party[0], 0, party, DEFAULT_WEIGHTS)
  assert.ok(back > front, '도발자(뒤) > 앞열')
})

test('selectMobTarget 디폴트(무트레잇 몹) = 앞열 (Phase1 등가)', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage)]
  assert.strictEqual(selectMobTarget(party, { traits: [] }).name, '전사')
})

test('selectMobTarget 저체력추적 몹 = 최저 hp 유닛', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage)]  // 전사115 > 마법사55
  const mob = { traits: [TRAITS.low_hp_seek] }
  assert.strictEqual(selectMobTarget(party, mob).name, '마법사')
})

test('selectMobTarget 고공격력추적 몹 = 최고 atk 유닛(물몸 딜러 직격)', () => {
  const party = [makeUnit(JOBS.guardian), makeUnit(JOBS.mage)]  // 가디언 atk10 < 마법사 atk32
  const mob = { traits: [TRAITS.atk_seek] }
  assert.strictEqual(selectMobTarget(party, mob).name, '마법사')
})

test('selectMobTarget 도발 > 저체력추적 (도발이 어그로 강제)', () => {
  // 가디언(고hp) 앞 도발 + 마법사(저hp). 저체력추적이면 평소 마법사지만 도발이 뺏음.
  const party = [taunted(makeUnit(JOBS.guardian)), makeUnit(JOBS.mage)]
  const mob = { traits: [TRAITS.low_hp_seek] }
  assert.strictEqual(selectMobTarget(party, mob).name, '가디언')
})
