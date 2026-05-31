import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyEffect, expireEffects, tickHoT, dmgTakenMult, dmgDealtMult, hasTaunt } from '../src/engine/effects.js'

test('applyEffect: 새 effect push', () => {
  const t = { effects: [] }
  applyEffect(t, { type: 'dmgTaken', value: 0.6, source: 1, expireTick: 100 })
  assert.equal(t.effects.length, 1)
  assert.equal(t.effects[0].value, 0.6)
})

test('applyEffect: refresh — 같은 (type,source) 덮어쓰기', () => {
  const t = { effects: [{ type: 'dmgTaken', value: 0.6, source: 1, expireTick: 100 }] }
  applyEffect(t, { type: 'dmgTaken', value: 0.6, source: 1, expireTick: 300 })
  assert.equal(t.effects.length, 1)
  assert.equal(t.effects[0].expireTick, 300)   // 연장됨
})

test('applyEffect: 다른 source는 별도 존재', () => {
  const t = { effects: [{ type: 'dmgTaken', value: 0.8, source: 1, expireTick: 100 }] }
  applyEffect(t, { type: 'dmgTaken', value: 0.8, source: 2, expireTick: 100 })
  assert.equal(t.effects.length, 2)
})

test('expireEffects: expireTick<=tick 제거', () => {
  const t = { effects: [
    { type: 'dmgTaken', value: 0.6, source: 1, expireTick: 100 },
    { type: 'taunt', value: 1, source: 1, expireTick: 300 },
  ] }
  expireEffects(t, 100)
  assert.equal(t.effects.length, 1)
  assert.equal(t.effects[0].type, 'taunt')
})

test('tickHoT: nextTick 도달 시 회복 + nextTick 전진', () => {
  const log = []
  const t = { name: '아군', hp: 50, maxHp: 100, effects: [
    { type: 'hot', value: 10, source: 1, expireTick: 500, interval: 100, nextTick: 100 },
  ] }
  tickHoT(t, 100, log)
  assert.equal(t.hp, 60)
  assert.equal(t.effects[0].nextTick, 200)
  tickHoT(t, 150, log)        // 아직 nextTick(200) 전 → no-op
  assert.equal(t.hp, 60)
})

test('tickHoT: maxHp cap', () => {
  const t = { name: '아군', hp: 95, maxHp: 100, effects: [
    { type: 'hot', value: 10, source: 1, expireTick: 500, interval: 100, nextTick: 100 },
  ] }
  tickHoT(t, 100, [])
  assert.equal(t.hp, 100)
})

test('tickHoT: 죽은 대상 no-op', () => {
  const t = { name: '아군', hp: 0, maxHp: 100, effects: [
    { type: 'hot', value: 10, source: 1, expireTick: 500, interval: 100, nextTick: 100 },
  ] }
  tickHoT(t, 100, [])
  assert.equal(t.hp, 0)
})

test('dmgTakenMult / dmgDealtMult: 곱, 없으면 1', () => {
  assert.equal(dmgTakenMult({ effects: [] }), 1)
  const t = { effects: [
    { type: 'dmgTaken', value: 0.6, source: 1, expireTick: 9 },
    { type: 'dmgTaken', value: 0.5, source: 2, expireTick: 9 },
    { type: 'dmgDealt', value: 0.95, source: 1, expireTick: 9 },
  ] }
  assert.equal(dmgTakenMult(t), 0.3)        // 0.6*0.5
  assert.equal(dmgDealtMult(t), 0.95)
})

test('hasTaunt', () => {
  assert.equal(hasTaunt({ effects: [] }), false)
  assert.equal(hasTaunt({ effects: [{ type: 'taunt', value: 1, source: 1, expireTick: 9 }] }), true)
})
