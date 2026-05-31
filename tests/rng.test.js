import { test } from 'node:test'
import assert from 'node:assert'
import { makeRng } from '../src/engine/rng.js'

test('same seed produces the same sequence', () => {
  const a = makeRng(123)
  const b = makeRng(123)
  assert.strictEqual(a.next(), b.next())
  assert.strictEqual(a.int(1000), b.int(1000))
})

test('int(n) returns an integer in [0, n)', () => {
  const r = makeRng(5)
  for (let i = 0; i < 50; i++) {
    const x = r.int(10)
    assert.ok(Number.isInteger(x) && x >= 0 && x < 10, `int out of range: ${x}`)
  }
})

test('pick returns an element of the array', () => {
  const r = makeRng(9)
  const arr = ['a', 'b', 'c', 'd']
  for (let i = 0; i < 20; i++) assert.ok(arr.includes(r.pick(arr)))
})

test('shuffle returns a new array that is a permutation', () => {
  const r = makeRng(7)
  const arr = [1, 2, 3, 4, 5]
  const s = r.shuffle(arr)
  assert.notStrictEqual(s, arr)                          // 새 배열
  assert.deepStrictEqual([...s].sort(), [...arr].sort()) // 같은 원소
  assert.deepStrictEqual(arr, [1, 2, 3, 4, 5])           // 원본 불변
})
