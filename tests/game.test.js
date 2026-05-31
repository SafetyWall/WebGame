import { test } from 'node:test'
import assert from 'node:assert'
import { renderGame } from '../src/ui/game.js'
import { newRun } from '../src/engine/run.js'
import { makeRng } from '../src/engine/rng.js'

test('prep view shows stage/gold, enemy preview, roster, and action buttons', () => {
  const html = renderGame(newRun(makeRng(1)))
  assert.match(html, /스테이지 1/)
  assert.match(html, /골드 5/)
  assert.match(html, /다가올 적/)
  assert.match(html, /data-action="recruit"/)
  assert.match(html, /data-action="toggle"/)
  assert.match(html, /data-action="fight"/)
})

test('result win view shows reward and a next button', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2, lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [] } }
  const html = renderGame(s)
  assert.match(html, /승리/)
  assert.match(html, /골드 \+6/)
  assert.match(html, /data-action="next"/)
})

test('result loss view shows defeat and a restart button', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', lastResult: { outcome: 'loss', reward: 0, ticks: 9999, rounds: [] } }
  const html = renderGame(s)
  assert.match(html, /패배/)
  assert.match(html, /data-action="restart"/)
})

test('result clear view shows clear and a restart button', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 5, lastResult: { outcome: 'clear', reward: 9, ticks: 100, rounds: [] } }
  const html = renderGame(s)
  assert.match(html, /클리어/)
  assert.match(html, /data-action="restart"/)
})
