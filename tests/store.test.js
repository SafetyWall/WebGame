import { test } from 'node:test'
import assert from 'node:assert'
import { createStore } from '../src/ui/store.js'

const inc = (run) => ({ ...run, gold: run.gold + 1 })
const noop = (run) => run

test('dispatch: run 액션 적용 + 구독 통지', () => {
  const store = createStore({ run: { gold: 0 }, ui: { layout: '2col' } })
  let seen = null
  store.subscribe((s) => { seen = s })
  store.dispatch(inc)
  assert.strictEqual(store.getState().run.gold, 1)
  assert.strictEqual(seen.run.gold, 1)
})

test('dispatch: no-op(같은 ref)는 통지 안 함', () => {
  const store = createStore({ run: { gold: 0 }, ui: {} })
  let count = 0
  store.subscribe(() => { count++ })
  store.dispatch(noop)
  assert.strictEqual(count, 0)
})

test('setUi: ui 부분 병합 + 통지', () => {
  const store = createStore({ run: {}, ui: { layout: '2col', modal: null } })
  let seen = null
  store.subscribe((s) => { seen = s })
  store.setUi({ modal: 3 })
  assert.deepStrictEqual(store.getState().ui, { layout: '2col', modal: 3 })
  assert.strictEqual(seen.ui.modal, 3)
})

test('subscribe: unsubscribe 후 통지 중단', () => {
  const store = createStore({ run: { gold: 0 }, ui: {} })
  let count = 0
  const off = store.subscribe(() => { count++ })
  store.dispatch(inc)
  off()
  store.dispatch(inc)
  assert.strictEqual(count, 1)
})
