import { test } from 'node:test'
import assert from 'node:assert'
import { renderBattle } from '../src/ui/render.js'

test('renderBattle returns html string with outcome and names', () => {
  const result = {
    winner: 'party',
    ticks: 50,
    rounds: [
      { tick: 28, party: [{ name: '전사', hp: 100, maxHp: 115 }], mob: { name: '슬라임', hp: 0, maxHp: 200 }, log: ['전사 공격 → 슬라임 (-19)'] },
    ],
  }
  const html = renderBattle(result)
  assert.strictEqual(typeof html, 'string')
  assert.match(html, /승리/)
  assert.match(html, /전사/)
  assert.match(html, /슬라임/)
})

test('renderBattle shows 패배 when mob wins', () => {
  const html = renderBattle({ winner: 'mob', ticks: 10, rounds: [] })
  assert.match(html, /패배/)
})
