import { test } from 'node:test'
import assert from 'node:assert'
import { TRAITS } from '../src/data/traits.js'
import { applyRules } from '../src/engine/traits.js'

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

// 합성 규칙으로 엔진 단독 검증(data 테이블 무관).
const mobWith = (traits, over = {}) => ({ name: 'M', hp: 100, maxHp: 100, traits, ...over })

test('mult op transforms the incoming value', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', op: 'mult', value: 0.7 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 7)
})

test('mult by 0 produces 0 (total immunity, not skipped)', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', op: 'mult', value: 0 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 0)
})

test('add op transforms the incoming value', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', op: 'add', value: 5 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 15)
})

test('cond matches only when every key equals ctx', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', cond: { attackerRange: 'melee' }, op: 'mult', value: 0.5 }])
  assert.strictEqual(applyRules('incomingDamage', 10, { attackerRange: 'melee' }, mob), 5)   // 매칭
  assert.strictEqual(applyRules('incomingDamage', 10, { attackerRange: 'ranged' }, mob), 10) // 불일치
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 10)                          // 키 없음
})

test('only rules for the fired trigger apply', () => {
  const mob = mobWith([{ trigger: 'turnStart', op: 'mult', value: 0 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 10)
})

test('priority ascending: lower applies first (order changes result)', () => {
  const mob = mobWith([
    { trigger: 'incomingDamage', op: 'add', value: 5, priority: 200 },
    { trigger: 'incomingDamage', op: 'mult', value: 0.7, priority: 100 },
  ])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 12) // (10*0.7)+5
})

test('default priority is 100', () => {
  const mob = mobWith([
    { trigger: 'incomingDamage', op: 'add', value: 5, priority: 50 }, // 먼저
    { trigger: 'incomingDamage', op: 'mult', value: 0.7 },            // 기본 100 → 나중
  ])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 10.5) // (10+5)*0.7
})

test('exclusive rule stops later rules', () => {
  const mob = mobWith([
    { trigger: 'incomingDamage', op: 'mult', value: 0, priority: 100, exclusive: true },
    { trigger: 'incomingDamage', op: 'add', value: 5, priority: 200 },
  ])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 0) // add 무적용
})

test('heal op raises mob hp capped at maxHp; value passes through', () => {
  const mob = mobWith([{ trigger: 'turnStart', op: 'heal', value: 20 }], { hp: 90, maxHp: 100 })
  const ret = applyRules('turnStart', 0, {}, mob)
  assert.strictEqual(mob.hp, 100) // 90+20 capped
  assert.strictEqual(ret, 0)
})

test('reflect op damages attacker by floor(damage * value)', () => {
  const attacker = { name: 'A', hp: 50 }
  const mob = mobWith([{ trigger: 'postIncomingDamage', op: 'reflect', value: 0.3 }])
  applyRules('postIncomingDamage', 0, { attacker, damage: 17 }, mob)
  assert.strictEqual(attacker.hp, 45) // 50 - floor(17*0.3)=5
})

test('empty or missing traits leaves value unchanged', () => {
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mobWith([])), 10)
  assert.strictEqual(applyRules('incomingDamage', 10, {}, { name: 'M', hp: 1, maxHp: 1 }), 10) // traits undefined
})
