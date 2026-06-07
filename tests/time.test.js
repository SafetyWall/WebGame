import { test } from 'node:test'
import assert from 'node:assert'
import { fmtSec } from '../src/ui/time.js'
import { TICKS_PER_SEC } from '../src/engine/battle.js'

test('TICKS_PER_SEC = 100 (100틱 = 1초)', () => {
  assert.strictEqual(TICKS_PER_SEC, 100)
})

test('fmtSec: 정수초="N초", 소수초="N.N초"(1자리)', () => {
  assert.strictEqual(fmtSec(500), '5초')      // 쿨 500틱 = 5초
  assert.strictEqual(fmtSec(100), '1초')      // interval 100 = 1초
  assert.strictEqual(fmtSec(350), '3.5초')    // 쿨 350틱 = 3.5초
  assert.strictEqual(fmtSec(150), '1.5초')    // 지속 150틱 = 1.5초
  assert.strictEqual(fmtSec(0), '0초')
  assert.strictEqual(fmtSec(1428), '14.3초')  // 임의 틱 → 1자리 반올림
})
