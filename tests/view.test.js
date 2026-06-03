import { test } from 'node:test'
import assert from 'node:assert'
import { renderApp } from '../src/ui/view.js'
import { newRun } from '../src/engine/run.js'
import { makeRng } from '../src/engine/rng.js'

const S = (run, ui = {}) => ({ run, ui: { layout: '2col', modal: null, ...ui } })

test('prep: 헤더/골드/적/기본 액션 노출', () => {
  const html = renderApp(S(newRun(makeRng(1))))
  assert.match(html, /스테이지 1/)
  assert.match(html, /💰20/)
  assert.match(html, /다가올 적/)
  assert.match(html, /data-action="recruit"/)
  assert.match(html, /data-action="toggle"/)
  assert.match(html, /data-action="fight"/)
})

test('prep: 레이아웃 클래스 + 토글 버튼(2col→1col)', () => {
  const html = renderApp(S(newRun(makeRng(1)), { layout: '2col' }))
  assert.match(html, /roster layout-2col/)
  assert.match(html, /data-action="toggleLayout"[^>]*data-layout="1col"/)
  const h1 = renderApp(S(newRun(makeRng(1)), { layout: '1col' }))
  assert.match(h1, /roster layout-1col/)
  assert.match(h1, /data-layout="2col"/)
})

test('prep: 카드 본문=openModal, 스킬 pill=data-tip', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2, learnedSkills: ['warrior_cleave'], skillLevels: { warrior_cleave: 1 } }], party: [0] }
  const html = renderApp(S(s))
  assert.match(html, /data-action="openModal"[^>]*data-i="0"/)
  assert.match(html, /class="sk have"[^>]*data-tip="skill"[^>]*data-skill="warrior_cleave"/)   // 학습=have
  assert.match(html, /class="sk no"[^>]*data-tip="skill"[^>]*data-skill="warrior_heavy"/)       // 미학습=no
})

test('prep: 노비스 카드 = 스킬 영역 빈칸(전직 안내 미노출)', () => {
  const html = renderApp(S(newRun(makeRng(1))))
  assert.doesNotMatch(html, /전직 필요/)
  assert.match(html, /<div class="skills2"><\/div>/)   // 빈 2×2
})

test('prep: 적 특성/광역 = data-tip pill', () => {
  const base = newRun(makeRng(1))
  const s = { ...base, encounter: { ...base.encounter, name: '오우거', boss: true, aoe: true, traits: ['regeneration'] } }
  const html = renderApp(S(s))
  assert.match(html, /data-tip="aoe"/)
  assert.match(html, /data-tip="trait"[^>]*data-trait="regeneration"/)
  assert.match(html, /👑 오우거/)
})

test('prep: 출전 카드 = 자체 드래그(data-drag=party, data-pos)', () => {
  const html = renderApp(S({ ...newRun(makeRng(1)), party: [0, 1] }))
  assert.match(html, /data-action="openModal" data-i="0" data-drag="party" data-pos="0"/)
  // 벤치(미출전)는 drag 속성 없음
  const s = { ...newRun(makeRng(1)), party: [0] }
  const h2 = renderApp(S(s))
  assert.match(h2, /data-action="openModal" data-i="1"(?! data-drag)/)
})

test('prep: 풀파티면 미출전 출전버튼 disabled', () => {
  const html = renderApp(S({ ...newRun(makeRng(1)), slots: 1, party: [0] }))
  assert.match(html, /<button class="mini" disabled[^>]*>출전<\/button>/)
})

test('modal: ui.modal=null이면 모달 없음', () => {
  const html = renderApp(S(newRun(makeRng(1))))
  assert.doesNotMatch(html, /modal-overlay/)
})

test('modal: 비노비스 = 강화 before→after 미리보기', () => {
  const s = { ...newRun(makeRng(1)), gold: 50, roster: [{ job: 'warrior', level: 1 }], party: [0] }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /modal-overlay/)
  assert.match(html, /data-action="upgrade"[^>]*data-i="0"/)
  assert.match(html, /HP 115→<b>138<\/b>/)
  assert.match(html, /\(\+23\)/)
  assert.match(html, /data-action="closeModal"/)
})

test('modal: 노비스 = 전직 버튼', () => {
  const s = { ...newRun(makeRng(1)), gold: 50 }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /data-action="promote"[^>]*data-job="warrior"/)
  assert.doesNotMatch(html, /data-action="upgrade"/)
})

test('modal: 학습 스킬=레벨업+위력 미리보기, 미학습=학습', () => {
  const s = { ...newRun(makeRng(1)), gold: 50, roster: [{ job: 'warrior', level: 2, learnedSkills: ['warrior_cleave'], skillLevels: { warrior_cleave: 1 } }], party: [0] }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /data-action="levelupSkill"[^>]*data-skill="warrior_cleave"/)
  assert.match(html, /위력 ×1\.7→×2\.13/)   // skillUpPreview
  assert.match(html, /data-action="learnSkill"[^>]*data-skill="warrior_heavy"/)
})

test('modal: 다중 스킬 = 우선순위 드래그 리스트', () => {
  const s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 2 }], party: [0] }
  const html = renderApp(S(s, { modal: 0 }))
  assert.match(html, /class="prio-item" data-drag="prio"[^>]*data-skill="warrior_cleave"/)
  assert.match(html, /data-skill="melee_strike"/)
})

test('result: 승리 배너 + 다음 버튼', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2, lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [] } }
  const html = renderApp(S(s))
  assert.match(html, /승리/)
  assert.match(html, /골드 \+6/)
  assert.match(html, /data-action="next"/)
})

test('result: 패배=재시작 / 클리어=새 런', () => {
  const loss = renderApp(S({ ...newRun(makeRng(1)), phase: 'result', lastResult: { outcome: 'loss', reward: 0, ticks: 9, rounds: [] } }))
  assert.match(loss, /패배/)
  assert.match(loss, /data-action="restart"/)
  const clear = renderApp(S({ ...newRun(makeRng(1)), phase: 'result', stage: 20, lastResult: { outcome: 'clear', reward: 9, ticks: 100, rounds: [] } }))
  assert.match(clear, /클리어/)
  assert.match(clear, /data-action="restart"/)
})

test('result: 단일 h2 배너(결과: 헤더 중복 없음) + 라운드 로그 유지', () => {
  const s = { ...newRun(makeRng(1)), phase: 'result', stage: 2,
    lastResult: { outcome: 'win', reward: 6, ticks: 100, rounds: [
      { tick: 50, party: [{ name: '전사', hp: 5, maxHp: 115 }], mob: { name: '슬라임', hp: 0, maxHp: 30, traits: [] }, log: ['끝'] },
    ] } }
  const html = renderApp(S(s))
  assert.doesNotMatch(html, /결과:/)
  assert.strictEqual((html.match(/<h2>/g) || []).length, 1)
  assert.match(html, /라운드 1/)
})
