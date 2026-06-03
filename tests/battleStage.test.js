import { test } from 'node:test'
import assert from 'node:assert'
import { renderBattleStage } from '../src/ui/components/BattleStage.js'

const FR = [
  { tick: 5, actor: '전사', log: ['전사 공격 → 슬라임 (-30)'],
    party: [{ name: '전사', level: 5, hp: 100, maxHp: 115, mana: 25, manaMax: 100, gauge: 0, alive: true, effects: ['dmgDealt'] }],
    mob: { name: '슬라임', hp: 170, maxHp: 200, boss: false, effects: [] } },
  { tick: 8, actor: '슬라임', log: ['슬라임 공격 → 전사 (-12)'],
    party: [{ name: '전사', level: 5, hp: 88, maxHp: 115, mana: 50, manaMax: 100, gauge: 0, alive: true, effects: [] }],
    mob: { name: '슬라임', hp: 170, maxHp: 200, boss: false, effects: [] } },
]

test('renderBattleStage: frames 없으면 빈 문자열', () => {
  assert.strictEqual(renderBattleStage([], 0), '')
  assert.strictEqual(renderBattleStage(undefined, 0), '')
})

test('renderBattleStage: 전황 + 컨트롤 + 액션 로그', () => {
  const html = renderBattleStage(FR, 0)
  assert.match(html, /battle-stage/)
  assert.match(html, /data-action="pbNext"/)
  assert.match(html, /data-action="pbPlay"/)
  assert.match(html, /전사/)
  assert.match(html, /슬라임/)
  assert.match(html, /100\/115/)          // HP 수치
  assert.match(html, /전사 공격 → 슬라임/) // 액션 로그
  assert.match(html, /주뎀/)               // dmgDealt 태그 라벨
  assert.match(html, /1 \/ 2 · 틱 5/)      // 커서/카운트
})

test('renderBattleStage: 첫 frame이면 prev/first disabled', () => {
  const html = renderBattleStage(FR, 0)
  assert.match(html, /data-action="pbPrev" disabled/)
  assert.match(html, /data-action="pbFirst" disabled/)
})

test('renderBattleStage: 마지막 frame이면 next/last disabled', () => {
  const html = renderBattleStage(FR, 1)
  assert.match(html, /data-action="pbNext" disabled/)
  assert.match(html, /data-action="pbLast" disabled/)
  assert.match(html, /2 \/ 2/)
})

test('renderBattleStage: cursor 범위 밖 클램프', () => {
  const html = renderBattleStage(FR, 99)
  assert.match(html, /2 \/ 2 · 틱 8/)      // 마지막으로 클램프
})

test('renderBattleStage: 사망 유닛 dead 클래스', () => {
  const dead = [{ tick: 1, actor: '슬라임', log: [], party: [{ name: '전사', level: 1, hp: 0, maxHp: 100, mana: 0, manaMax: 100, gauge: 0, alive: false, effects: [] }], mob: { name: '슬라임', hp: 50, maxHp: 200, boss: false, effects: [] } }]
  assert.match(renderBattleStage(dead, 0), /class="bu dead"/)
})
