import { test } from 'node:test'
import assert from 'node:assert'
import { save, load, clear } from '../src/ui/persist.js'

// node에 localStorage 없음 → Map 기반 storage shim 주입
const shim = () => {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  }
}

test('save → load round-trips state and rng', () => {
  const st = shim()
  const state = { phase: 'prep', gold: 5, stage: 1, slots: 3 }
  save(state, 42, st)
  const out = load(st)
  assert.deepStrictEqual(out.state, state)
  assert.strictEqual(out.rng, 42)
})

test('load returns null for empty, version mismatch, corrupt', () => {
  const st = shim()
  assert.strictEqual(load(st), null)                                          // empty
  st.setItem('partyrpg.save.v2', JSON.stringify({ v: 1, state: {}, rng: 0 }))
  assert.strictEqual(load(st), null)                                          // version mismatch (구 v1)
  st.setItem('partyrpg.save.v2', '{not json')
  assert.strictEqual(load(st), null)                                          // corrupt
})

test('clear removes the save', () => {
  const st = shim()
  save({ a: 1 }, 0, st)
  clear(st)
  assert.strictEqual(load(st), null)
})

test('save swallows a throwing storage (quota / private mode) — best-effort', () => {
  const throwing = { setItem: () => { throw new Error('QuotaExceededError') }, getItem: () => null, removeItem: () => {} }
  assert.doesNotThrow(() => save({ gold: 5 }, 1, throwing))   // 클릭루프 크래시 금지
})
