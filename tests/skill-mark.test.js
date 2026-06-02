import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { markBonus } from '../src/engine/effects.js'

test('markBonus = mark effect 값 합(없으면 0)', () => {
  assert.strictEqual(markBonus({ effects: [] }), 0)
  assert.strictEqual(markBonus({ effects: [{ type: 'mark', value: 30 }] }), 30)
})

test('라이트닝 = 적에 mark 부여(값=floor(시전자atk×ratio))', () => {
  assert.strictEqual(SKILLS.mage_lightning.effects[0].type, 'mark')
  const m = makeUnit(JOBS.mage, 1, null, {}, ['mage_lightning']); m.mana = 100  // atk32
  const mob = makeMob({ name: 'D', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  runBattle([m], mob, { maxTicks: 200 })
  const mk = mob.effects.find(e => e.type === 'mark')
  assert.ok(mk, '몹 mark 부여됨')
  assert.strictEqual(mk.value, Math.floor(32 * 0.6))   // 19
})

test('표식 걸린 몹은 피격 시마다 추가뎀', () => {
  // 몹에 mark 50 직접 부여 + 평타 유닛 1타 → 평타뎀 + 50.
  const u = makeUnit(JOBS.warrior, 1, null, {}, [])   // 평타만(melee_strike, atk22, power1)
  const mob = makeMob({ name: 'M', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  mob.effects.push({ type: 'mark', value: 50, source: 0, expireTick: 99999 })
  const before = mob.hp
  runBattle([u], mob, { maxTicks: 200 })   // 전사 1행동(평타 22)
  const dealt = before - mob.hp
  assert.strictEqual(dealt, 22 + 50)        // 평타 + 표식
})

test('마법사 키트에 라이트닝 포함(4 액티브)', () => {
  assert.deepStrictEqual(JOBS.mage.skills, ['mage_nuke', 'mage_focus', 'mage_frost', 'mage_lightning', 'ranged_strike'])
})
