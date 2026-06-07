import { test } from 'node:test'
import assert from 'node:assert'
import { upgradePreview, skillUpPreview } from '../src/ui/preview.js'
import { SKILLS } from '../src/data/skills.js'

test('upgradePreview: 전사 L1→L2 hp/atk 델타', () => {
  const p = upgradePreview('warrior', 1)
  assert.strictEqual(p.fromLevel, 1)
  assert.strictEqual(p.toLevel, 2)
  const hp = p.stats.find((s) => s.key === 'hp')
  const atk = p.stats.find((s) => s.key === 'atk')
  assert.deepStrictEqual([hp.before, hp.after, hp.delta], [115, 138, 23])
  assert.deepStrictEqual([atk.before, atk.after, atk.delta], [22, 26, 4])
  assert.strictEqual(p.stats.find((s) => s.key === 'heal'), undefined)   // 전사=힐 없음
})

test('upgradePreview: 사제는 heal 델타 포함', () => {
  const p = upgradePreview('priest', 1)
  const heal = p.stats.find((s) => s.key === 'heal')
  assert.deepStrictEqual([heal.before, heal.after, heal.delta], [30, 36, 6])
})

test('upgradePreview: 노비스·만렙 = null', () => {
  assert.strictEqual(upgradePreview('novice', 1), null)
  assert.strictEqual(upgradePreview('warrior', 10), null)
})

test('skillUpPreview: 위력 배율 전후', () => {
  const p = skillUpPreview(SKILLS.warrior_cleave, 1)   // power1.7
  assert.strictEqual(p.multBefore, 1)
  assert.strictEqual(p.multAfter, 1.25)
  assert.strictEqual(p.power.before, 1.7)
  assert.strictEqual(p.power.after, 2.13)   // 1.7*1.25=2.125 → round2 2.13
})

test('skillUpPreview: 버프(power0)=power null', () => {
  const p = skillUpPreview(SKILLS.warrior_thorns, 1)   // power0(가시방패)
  assert.strictEqual(p.power, null)
})

test('skillUpPreview: 미학습·만렙 = null', () => {
  assert.strictEqual(skillUpPreview(SKILLS.warrior_cleave, 0), null)
  assert.strictEqual(skillUpPreview(SKILLS.warrior_cleave, 5), null)
})
