import { test } from 'node:test'
import assert from 'node:assert'
import { TRAITS } from '../src/data/traits.js'

const TRIGGERS = ['incomingDamage', 'postIncomingDamage', 'turnStart']
const OPS = ['mult', 'add', 'heal', 'reflect']

test('TRAITS entries have id(=key)/name/trigger/op/value with valid enums', () => {
  for (const [key, t] of Object.entries(TRAITS)) {
    assert.strictEqual(t.id, key, `${key} id matches key`)
    assert.ok(t.name, `${key} name`)
    assert.ok(TRIGGERS.includes(t.trigger), `${key} trigger`)
    assert.ok(OPS.includes(t.op), `${key} op`)
    assert.ok(Number.isFinite(t.value), `${key} value`)
  }
})

test('melee_evade is a melee incoming-damage 0.7 multiplier', () => {
  const e = TRAITS.melee_evade
  assert.strictEqual(e.trigger, 'incomingDamage')
  assert.deepStrictEqual(e.cond, { attackerRange: 'melee' })
  assert.strictEqual(e.op, 'mult')
  assert.strictEqual(e.value, 0.7)
})
