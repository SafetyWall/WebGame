import { test } from 'node:test'
import assert from 'node:assert'
import { statusName, statusKind, instanceDesc } from '../src/ui/status.js'

test('statusName: 배율형은 값 방향으로 이름', () => {
  assert.strictEqual(statusName('dmgTaken', 1.25), '취약')   // 받는뎀↑
  assert.strictEqual(statusName('dmgTaken', 0.6), '방어')    // 받는뎀↓
  assert.strictEqual(statusName('dmgDealt', 1.3), '강화')
  assert.strictEqual(statusName('dmgDealt', 0.8), '약화')
  assert.strictEqual(statusName('speed', 1.3), '신속')
  assert.strictEqual(statusName('speed', 0.7), '둔화')
})

test('statusName: 고정형', () => {
  assert.strictEqual(statusName('stun'), '기절')
  assert.strictEqual(statusName('dot'), '출혈')
  assert.strictEqual(statusName('hot'), '재생')
  assert.strictEqual(statusName('mark'), '표식')
  assert.strictEqual(statusName('reflect'), '가시')
  assert.strictEqual(statusName('intercept'), '수호')
  assert.strictEqual(statusName('taunt'), '도발')
})

test('statusKind: 보유자 기준 이로움/해로움', () => {
  assert.strictEqual(statusKind('dmgTaken', 1.25), 'debuff')  // 받는뎀↑ = 나쁨
  assert.strictEqual(statusKind('dmgTaken', 0.6), 'buff')
  assert.strictEqual(statusKind('dmgDealt', 1.3), 'buff')
  assert.strictEqual(statusKind('speed', 0.7), 'debuff')
  assert.strictEqual(statusKind('stun'), 'debuff')
  assert.strictEqual(statusKind('hot'), 'buff')
  assert.strictEqual(statusKind('mark'), 'debuff')
})

test('instanceDesc: 값 확정 인스턴스 → 정확 표기', () => {
  assert.match(instanceDesc({ type: 'dmgTaken', value: 1.25 }), /받는 데미지 \+25%/)
  assert.match(instanceDesc({ type: 'dmgDealt', value: 0.8 }), /주는 데미지 -20%/)
  assert.match(instanceDesc({ type: 'dot', value: 12, interval: 100 }), /100틱마다 12/)
  assert.match(instanceDesc({ type: 'reflect', value: 0.3 }), /30% 반사/)
  assert.match(instanceDesc({ type: 'stun', value: 1 }), /행동 불가/)
})
