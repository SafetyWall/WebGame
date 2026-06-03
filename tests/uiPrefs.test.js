import { test } from 'node:test'
import assert from 'node:assert'
import { loadPrefs, savePrefs } from '../src/ui/uiPrefs.js'

const shim = () => {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }
}

test('loadPrefs: 빈 스토리지 = 기본값(layout 2col)', () => {
  assert.deepStrictEqual(loadPrefs(shim()), { layout: '2col' })
})

test('save → load round-trip', () => {
  const st = shim()
  savePrefs({ layout: '1col' }, st)
  assert.strictEqual(loadPrefs(st).layout, '1col')
})

test('loadPrefs: 손상 JSON = 기본값', () => {
  const st = shim()
  st.setItem('partyrpg.ui.v1', '{nope')
  assert.deepStrictEqual(loadPrefs(st), { layout: '2col' })
})

test('loadPrefs: 부분 저장도 기본값과 병합', () => {
  const st = shim()
  st.setItem('partyrpg.ui.v1', JSON.stringify({}))
  assert.strictEqual(loadPrefs(st).layout, '2col')
})

test('savePrefs: throwing storage 무시(best-effort)', () => {
  const throwing = { setItem: () => { throw new Error('quota') }, getItem: () => null, removeItem: () => {} }
  assert.doesNotThrow(() => savePrefs({ layout: '1col' }, throwing))
})
