import { test } from 'node:test'
import assert from 'node:assert'
import { renderBattle, renderRounds } from '../src/ui/render.js'

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

test('renderBattle shows mob trait names in a bracket', () => {
  const result = {
    winner: 'party', ticks: 1,
    rounds: [{ tick: 1, party: [], mob: { name: '가시거북', hp: 280, maxHp: 280, traits: ['근접회피'] }, log: [] }],
  }
  const html = renderBattle(result)
  assert.match(html, /가시거북/)
  assert.match(html, /근접회피/)
})

test('renderBattle omits the bracket when mob has no traits', () => {
  const result = {
    winner: 'party', ticks: 1,
    rounds: [{ tick: 1, party: [], mob: { name: '슬라임', hp: 200, maxHp: 200, traits: [] }, log: [] }],
  }
  const html = renderBattle(result)
  assert.doesNotMatch(html, /\[\]/)
})

test('renderRounds shows 광역 label for an aoe mob (alongside traits)', () => {
  const html = renderRounds([
    { tick: 1, party: [], mob: { name: '오우거', hp: 1, maxHp: 1, traits: ['데미지반사'], aoe: true }, log: [] },
  ])
  assert.match(html, /광역/)
  assert.match(html, /데미지반사/)
})

test('renderRounds omits 광역 for a non-aoe mob', () => {
  const html = renderRounds([
    { tick: 1, party: [], mob: { name: '슬라임', hp: 1, maxHp: 1, traits: [], aoe: false }, log: [] },
  ])
  assert.doesNotMatch(html, /광역/)
})

test('renderRounds renders rounds without the 결과 head', () => {
  const html = renderRounds([
    { tick: 5, party: [{ name: '전사', hp: 10, maxHp: 20 }], mob: { name: '슬라임', hp: 0, maxHp: 30, traits: [] }, log: ['x'] },
  ])
  assert.doesNotMatch(html, /결과:/)
  assert.match(html, /전사/)
  assert.match(html, /라운드 1/)
})
