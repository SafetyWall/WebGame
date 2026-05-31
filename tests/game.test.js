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

test('result view has a single h2 (no duplicate 결과: header)', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2,
    lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [
      { tick: 50, party: [{ name: '전사', hp: 5, maxHp: 115 }], mob: { name: '슬라임', hp: 0, maxHp: 30, traits: [] }, log: ['끝'] },
    ] } }
  const html = renderGame(s)
  assert.doesNotMatch(html, /결과:/)               // renderBattle head 안 씀
  assert.strictEqual((html.match(/<h2>/g) || []).length, 1)   // 배너 하나만
  assert.match(html, /100틱/)                      // 틱수는 배너에 흡수
  assert.match(html, /라운드 1/)                   // 라운드 로그는 유지
})

test('prep: 노비스에 전직 버튼, 골드충분 시 슬롯확장 버튼 노출', () => {
  const html = renderGame(newRun(makeRng(1)))     // gold5 slots3, roster 노비스×2
  assert.match(html, /data-action="promote"/)
  assert.match(html, /data-job="warrior"/)
  assert.match(html, /data-action="expand"/)
  assert.match(html, /슬롯확장\(5\)/)             // slotCost(3)=5
})

test('prep: 풀파티면 미출전 유닛 출전버튼 disabled', () => {
  const base = newRun(makeRng(1))
  const s = { ...base, slots: 1, party: [0] }      // slot 1, 1명 출전 = 꽉 참, idx1 대기
  const html = renderGame(s)
  assert.match(html, /<button disabled[^>]*>출전<\/button>/)
})

test('prep: 전직 버튼은 골드부족 시 숨김', () => {
  const s = { ...newRun(makeRng(1)), gold: 4 }     // 4 < PROMOTE_COST 5
  const html = renderGame(s)
  assert.doesNotMatch(html, /data-action="promote"/)
})

test('prep: 노비스는 강화 버튼 없음(전직만 가능)', () => {
  const html = renderGame(newRun(makeRng(1)))      // roster 노비스×2
  assert.doesNotMatch(html, /data-action="upgrade"/)
})

test('prep: 비노비스는 강화 버튼 노출, 전직 버튼 없음', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2 }], party: [0], gold: 5 }
  const html = renderGame(s)
  assert.match(html, /data-action="upgrade"/)
  assert.doesNotMatch(html, /data-action="promote"/)
})
