import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { reflectFrac } from '../src/engine/effects.js'

test('reflectFrac = reflect effect 값 합(없으면 0)', () => {
  assert.strictEqual(reflectFrac({ effects: [] }), 0)
  assert.strictEqual(reflectFrac({ effects: [{ type: 'reflect', value: 0.3 }] }), 0.3)
  assert.strictEqual(reflectFrac({ effects: [{ type: 'dmgTaken', value: 0.5 }] }), 0)
})

test('가시방패 = 자기 reflect effect 부여', () => {
  assert.strictEqual(SKILLS.guardian_thorns.effects[0].type, 'reflect')
  const g = makeUnit(JOBS.guardian, 1, null, {}, ['guardian_thorns']); g.mana = 100
  const mob = makeMob({ name: 'D', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  runBattle([g], mob, { maxTicks: 400 })   // 가디언(spd5) 1행동(가시방패)
  assert.ok(g.effects.some(e => e.type === 'reflect'), '가디언 reflect 부여됨')
})

test('reflect 보유 유닛 피격 시 몹이 반사뎀 받음', () => {
  const g = makeUnit(JOBS.guardian, 1); g.hp = 1e6
  g.effects.push({ type: 'reflect', value: 0.5, source: g.id, expireTick: 99999 })
  const mob = makeMob({ name: 'M', hp: 100000, atk: 100, def: 0, spd: 50, traits: [] })
  const before = mob.hp
  runBattle([g], mob, { maxTicks: 500 })
  assert.ok(mob.hp < before, `몹 hp 반사로 감소 (${before}→${mob.hp})`)
})

test('가디언 키트에 가시방패 포함', () => {
  assert.ok(JOBS.guardian.skills.includes('guardian_thorns'))
})
