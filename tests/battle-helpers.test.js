import { test } from 'node:test'
import assert from 'node:assert'
import { damage, lowestHpAlly, selectMobTarget } from '../src/engine/battle.js'

test('damage = atk - def, minimum 1', () => {
  assert.strictEqual(damage(10, 3), 7)
  assert.strictEqual(damage(2, 5), 1)   // 음수 방지 → 1
  assert.strictEqual(damage(5, 5), 1)
})

test('lowestHpAlly picks alive ally with min hp', () => {
  const party = [
    { name: 'a', hp: 50 },
    { name: 'b', hp: 10 },
    { name: 'c', hp: 0 },   // 죽음 제외
  ]
  assert.strictEqual(lowestHpAlly(party).name, 'b')
})

test('selectMobTarget prefers alive taunt tank', () => {
  const party = [
    { name: 'dps', hp: 30, taunt: false },
    { name: 'tank', hp: 200, taunt: true },
  ]
  assert.strictEqual(selectMobTarget(party).name, 'tank')
})

test('selectMobTarget falls back to lowest hp when no taunt alive', () => {
  const party = [
    { name: 'dps', hp: 30, taunt: false },
    { name: 'tank', hp: 0, taunt: true },   // 탱 죽음
  ]
  assert.strictEqual(selectMobTarget(party).name, 'dps')
})
